from typing import Any, Optional
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound

from apps.experiences.models import (
    InterviewExperience,
    ExperienceVersion,
    ExperienceStage,
    StageQuestion,
    ExperienceHelpfulVote,
    ExperienceReport,
)
from apps.experiences.services.experiences_moderation_service import (
    ExperienceModerationService,
)
from apps.experiences.services.question_extractor_service import (
    QuestionExtractorService,
)
from apps.administration.models import AdminActivityLog


def _sync_stages_and_questions(
    experience: InterviewExperience, stages_data: list[dict[str, Any]]
) -> None:
    """
    Synchronizes flexible recruitment stages and their questions for an experience.
    """
    # Delete existing stages (cascading deletes stage questions)
    experience.stages.all().delete()

    for idx, s_data in enumerate(stages_data, start=1):
        stage = ExperienceStage.objects.create(
            experience=experience,
            stage_type=s_data.get("stage_type", "other"),
            custom_stage_name=s_data.get("custom_stage_name", "").strip(),
            order=s_data.get("order", idx),
            stage_date=s_data.get("stage_date") or None,
            stage_time=s_data.get("stage_time", "").strip(),
            time_gap=s_data.get("time_gap", "").strip(),
            interview_mode=s_data.get("interview_mode", "").strip(),
            difficulty=s_data.get("difficulty", "").strip(),
            result=s_data.get("result", "").strip(),
            advanced=s_data.get("advanced", True),
            description=s_data.get("description", "").strip(),
            additional_notes=s_data.get("additional_notes", "").strip(),
        )

        questions_data = s_data.get("questions", [])
        for q_idx, q_data in enumerate(questions_data, start=1):
            q_text = (q_data.get("question_text") or "").strip()
            if q_text:
                StageQuestion.objects.create(
                    stage=stage,
                    question_text=q_text,
                    follow_up_text=q_data.get("follow_up_text", "").strip(),
                    interviewer_approach=q_data.get("interviewer_approach", "").strip(),
                    student_response=q_data.get("student_response", "").strip(),
                    difficulty=q_data.get("difficulty", "").strip(),
                    order=q_data.get("order", q_idx),
                )


def _serialize_experience_snapshot(experience: InterviewExperience) -> dict[str, Any]:
    """
    Generates an immutable JSON snapshot of an experience with all stages and questions.
    """
    stages_snapshot = []
    for stage in experience.stages.all().order_by("order"):
        questions_snapshot = [
            {
                "question_text": q.question_text,
                "follow_up_text": q.follow_up_text,
                "interviewer_approach": q.interviewer_approach,
                "student_response": q.student_response,
                "difficulty": q.difficulty,
                "order": q.order,
            }
            for q in stage.questions.all().order_by("order")
        ]
        stages_snapshot.append(
            {
                "stage_type": stage.stage_type,
                "custom_stage_name": stage.custom_stage_name,
                "order": stage.order,
                "stage_date": str(stage.stage_date) if stage.stage_date else None,
                "stage_time": stage.stage_time,
                "time_gap": stage.time_gap,
                "interview_mode": stage.interview_mode,
                "difficulty": stage.difficulty,
                "result": stage.result,
                "advanced": stage.advanced,
                "description": stage.description,
                "additional_notes": stage.additional_notes,
                "questions": questions_snapshot,
            }
        )

    return {
        "company_name": experience.company_name,
        "role": experience.role,
        "experience_level": experience.experience_level,
        "salary_range": experience.salary_range,
        "company_location": experience.company_location,
        "recruitment_year": experience.recruitment_year,
        "job_type": experience.job_type,
        "interview_mode": experience.interview_mode,
        "overall_difficulty": experience.overall_difficulty,
        "overall_outcome": experience.overall_outcome,
        "additional_context": experience.additional_context,
        "is_anonymous": experience.is_anonymous,
        "stages": stages_snapshot,
    }


class ExperienceService:
    @classmethod
    @transaction.atomic
    def save_draft(
        cls, user, data: dict[str, Any], experience_id: Optional[str] = None
    ) -> InterviewExperience:
        """
        Creates or updates a private draft experience without triggering moderation.
        """
        company_name = (data.get("company_name") or "Untitled Experience").strip()
        role = (data.get("role") or "Software Engineer").strip()
        experience_level = (data.get("experience_level") or "Fresher").strip()
        overall_outcome = (
            data.get("overall_outcome") or InterviewExperience.OUTCOME_AWAITED
        )

        if experience_id:
            try:
                experience = InterviewExperience.objects.select_for_update().get(
                    id=experience_id
                )
            except (InterviewExperience.DoesNotExist, ValueError):
                raise NotFound("Interview experience not found.")

            if experience.author_id != user.id:
                raise PermissionDenied("You can only edit your own experience.")

            if experience.status == InterviewExperience.STATUS_PUBLISHED:
                raise ValidationError(
                    "Cannot update a published experience as a plain draft. Use edit-published."
                )
        else:
            experience = InterviewExperience(
                author=user, status=InterviewExperience.STATUS_DRAFT
            )

        experience.company_name = company_name
        experience.role = role
        experience.experience_level = experience_level
        experience.salary_range = (data.get("salary_range") or "").strip()
        experience.company_location = (data.get("company_location") or "").strip()
        experience.recruitment_year = data.get("recruitment_year") or None
        experience.job_type = (data.get("job_type") or "").strip()
        experience.interview_mode = (data.get("interview_mode") or "").strip()
        experience.overall_difficulty = (data.get("overall_difficulty") or "").strip()
        experience.overall_outcome = overall_outcome
        experience.additional_context = (data.get("additional_context") or "").strip()
        experience.is_anonymous = bool(data.get("is_anonymous", False))
        experience.status = InterviewExperience.STATUS_DRAFT
        experience.save()

        # Sync stages and questions
        stages_data = data.get("stages", [])
        _sync_stages_and_questions(experience, stages_data)

        return experience

    @classmethod
    @transaction.atomic
    def publish_experience(
        cls, user, experience_id: str, data: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        """
        Submits an experience for publication. Runs risk-based moderation.
        Low-risk submissions are published immediately.
        High-risk / suspicious submissions enter Pending Review.
        """
        try:
            experience = InterviewExperience.objects.select_for_update().get(
                id=experience_id
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Interview experience not found.")

        if experience.author_id != user.id:
            raise PermissionDenied("You can only publish your own experience.")

        # Update fields if payload provided
        if data:
            if "company_name" in data:
                experience.company_name = (data["company_name"] or "").strip()
            if "role" in data:
                experience.role = (data["role"] or "").strip()
            if "experience_level" in data:
                experience.experience_level = (data["experience_level"] or "").strip()
            if "salary_range" in data:
                experience.salary_range = (data["salary_range"] or "").strip()
            if "overall_outcome" in data:
                experience.overall_outcome = data["overall_outcome"]
            if "is_anonymous" in data:
                experience.is_anonymous = bool(data["is_anonymous"])
            if "company_location" in data:
                experience.company_location = (data["company_location"] or "").strip()
            if "recruitment_year" in data:
                experience.recruitment_year = data["recruitment_year"] or None
            if "job_type" in data:
                experience.job_type = (data["job_type"] or "").strip()
            if "interview_mode" in data:
                experience.interview_mode = (data["interview_mode"] or "").strip()
            if "overall_difficulty" in data:
                experience.overall_difficulty = (
                    data["overall_difficulty"] or ""
                ).strip()
            if "additional_context" in data:
                experience.additional_context = (
                    data["additional_context"] or ""
                ).strip()
            experience.save()

            if "stages" in data and data["stages"]:
                _sync_stages_and_questions(experience, data["stages"])

        snapshot = _serialize_experience_snapshot(experience)

        # Execute Risk-Based Moderation
        mod_result = ExperienceModerationService.moderate_experience(snapshot)

        next_ver = experience.published_version + 1

        if mod_result["is_auto_approvable"]:
            experience.status = InterviewExperience.STATUS_PUBLISHED
            experience.rejection_reason = ""
            experience.published_version = next_ver
            experience.published_at = timezone.now()
            experience.is_hidden = False
            experience.save()

            # Record approved version snapshot
            ExperienceVersion.objects.create(
                experience=experience,
                version_number=next_ver,
                is_published=True,
                status=ExperienceVersion.STATUS_APPROVED,
                snapshot_data=snapshot,
                moderation_result=mod_result,
            )

            # Extract student-reported questions for Learn module
            extracted = QuestionExtractorService.extract_and_sync_questions(experience)

            return {
                "experience_id": str(experience.id),
                "status": "published",
                "message": "Interview experience approved and published successfully.",
                "risk_level": mod_result["risk_level"],
                "extracted_questions": extracted,
            }
        elif mod_result["suggested_action"] == "reject":
            experience.status = InterviewExperience.STATUS_REJECTED
            experience.rejection_reason = "; ".join(mod_result["issues"])
            experience.save()

            ExperienceVersion.objects.create(
                experience=experience,
                version_number=next_ver,
                is_published=False,
                status=ExperienceVersion.STATUS_REJECTED,
                snapshot_data=snapshot,
                moderation_result=mod_result,
                rejection_reason=experience.rejection_reason,
            )

            return {
                "experience_id": str(experience.id),
                "status": "rejected",
                "message": "Submission requires corrections before publication.",
                "rejection_reason": experience.rejection_reason,
                "issues": mod_result["issues"],
            }
        else:
            # High/medium risk -> Pending Review for admin queue
            experience.status = InterviewExperience.STATUS_PENDING_REVIEW
            experience.rejection_reason = ""
            experience.save()

            ExperienceVersion.objects.create(
                experience=experience,
                version_number=next_ver,
                is_published=False,
                status=ExperienceVersion.STATUS_PENDING_REVIEW,
                snapshot_data=snapshot,
                moderation_result=mod_result,
            )

            return {
                "experience_id": str(experience.id),
                "status": "pending_review",
                "message": "Your submission has been queued for standard administrative review.",
                "risk_level": mod_result["risk_level"],
                "flagged_issues": mod_result["issues"],
            }

    @classmethod
    @transaction.atomic
    def edit_published_experience(
        cls, user, experience_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Handles edits to an already published experience.
        The current published version remains live and visible while the update is reviewed.
        """
        try:
            experience = InterviewExperience.objects.select_for_update().get(
                id=experience_id
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Interview experience not found.")

        if experience.author_id != user.id:
            raise PermissionDenied("You can only edit your own experience.")

        if experience.status != InterviewExperience.STATUS_PUBLISHED:
            # If not published yet, save as standard draft
            return {
                "experience": cls.save_draft(user, data, experience_id=experience_id),
                "status": "draft",
            }

        # Build proposed snapshot
        stages_data = data.get("stages", [])
        proposed_snapshot = {
            "company_name": (
                data.get("company_name") or experience.company_name
            ).strip(),
            "role": (data.get("role") or experience.role).strip(),
            "experience_level": (
                data.get("experience_level") or experience.experience_level
            ).strip(),
            "salary_range": (
                data.get("salary_range") or experience.salary_range
            ).strip(),
            "company_location": (
                data.get("company_location") or experience.company_location
            ).strip(),
            "recruitment_year": data.get("recruitment_year")
            or experience.recruitment_year,
            "job_type": (data.get("job_type") or experience.job_type).strip(),
            "interview_mode": (
                data.get("interview_mode") or experience.interview_mode
            ).strip(),
            "overall_difficulty": (
                data.get("overall_difficulty") or experience.overall_difficulty
            ).strip(),
            "overall_outcome": data.get("overall_outcome")
            or experience.overall_outcome,
            "additional_context": (
                data.get("additional_context") or experience.additional_context
            ).strip(),
            "is_anonymous": bool(data.get("is_anonymous", experience.is_anonymous)),
            "stages": stages_data,
        }

        mod_result = ExperienceModerationService.moderate_experience(proposed_snapshot)
        new_ver_num = experience.published_version + 1

        if mod_result["is_auto_approvable"]:
            # Auto-publish update: apply changes to canonical entity
            experience.company_name = proposed_snapshot["company_name"]
            experience.role = proposed_snapshot["role"]
            experience.experience_level = proposed_snapshot["experience_level"]
            experience.salary_range = proposed_snapshot["salary_range"]
            experience.company_location = proposed_snapshot["company_location"]
            experience.recruitment_year = proposed_snapshot["recruitment_year"]
            experience.job_type = proposed_snapshot["job_type"]
            experience.interview_mode = proposed_snapshot["interview_mode"]
            experience.overall_difficulty = proposed_snapshot["overall_difficulty"]
            experience.overall_outcome = proposed_snapshot["overall_outcome"]
            experience.additional_context = proposed_snapshot["additional_context"]
            experience.is_anonymous = proposed_snapshot["is_anonymous"]
            experience.published_version = new_ver_num
            experience.save()

            _sync_stages_and_questions(experience, stages_data)

            # Archive earlier published version
            ExperienceVersion.objects.filter(
                experience=experience, is_published=True
            ).update(is_published=False)

            ExperienceVersion.objects.create(
                experience=experience,
                version_number=new_ver_num,
                is_published=True,
                status=ExperienceVersion.STATUS_APPROVED,
                snapshot_data=proposed_snapshot,
                moderation_result=mod_result,
            )

            # Sync extracted questions
            QuestionExtractorService.extract_and_sync_questions(experience)

            return {
                "experience_id": str(experience.id),
                "status": "published",
                "message": "Updated interview experience successfully published.",
                "version": new_ver_num,
            }
        else:
            # Keep previous version live on discovery!
            # Create a pending review version snapshot
            pending_ver, _ = ExperienceVersion.objects.update_or_create(
                experience=experience,
                version_number=new_ver_num,
                defaults={
                    "is_published": False,
                    "status": ExperienceVersion.STATUS_PENDING_REVIEW,
                    "snapshot_data": proposed_snapshot,
                    "moderation_result": mod_result,
                },
            )

            return {
                "experience_id": str(experience.id),
                "status": "pending_review",
                "message": "Your edit is currently in review. Your previously published version remains visible to peers.",
                "pending_version": new_ver_num,
                "issues": mod_result["issues"],
            }

    @classmethod
    @transaction.atomic
    def delete_experience(cls, user, experience_id: str) -> None:
        """
        Deletes candidate's own experience and safely cleans up extracted questions.
        """
        try:
            experience = InterviewExperience.objects.select_for_update().get(
                id=experience_id
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Interview experience not found.")

        if experience.author_id != user.id and not user.is_staff:
            raise PermissionDenied("You can only delete your own experience.")

        QuestionExtractorService.deactivate_experience_questions(experience.id)
        experience.delete()

    @classmethod
    @transaction.atomic
    def toggle_helpful_vote(cls, user, experience_id: str) -> dict[str, Any]:
        """
        Toggles helpful vote for an authenticated user on an experience.
        """
        try:
            experience = InterviewExperience.objects.select_for_update().get(
                id=experience_id,
                status=InterviewExperience.STATUS_PUBLISHED,
                is_hidden=False,
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Published interview experience not found.")

        vote = ExperienceHelpfulVote.objects.filter(
            user=user, experience=experience
        ).first()

        if vote:
            vote.delete()
            voted = False
            experience.helpful_votes_count = max(0, experience.helpful_votes_count - 1)
        else:
            ExperienceHelpfulVote.objects.create(user=user, experience=experience)
            voted = True
            experience.helpful_votes_count += 1

        experience.save(update_fields=["helpful_votes_count"])

        return {
            "experience_id": str(experience.id),
            "helpful_votes_count": experience.helpful_votes_count,
            "has_voted": voted,
        }

    @classmethod
    def submit_report(
        cls, user, experience_id: str, reason: str, explanation: str = ""
    ) -> dict[str, Any]:
        """
        Submits or updates an issue report against an experience.
        """
        try:
            experience = InterviewExperience.objects.get(id=experience_id)
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Interview experience not found.")

        report, created = ExperienceReport.objects.update_or_create(
            reporter=user,
            experience=experience,
            defaults={
                "reason": reason,
                "explanation": explanation.strip(),
                "status": ExperienceReport.STATUS_PENDING,
            },
        )

        if created:
            experience.reports_count += 1
            # If 3 or more distinct reports, flag or auto-hide for investigation
            if experience.reports_count >= 3:
                experience.is_hidden = True
                experience.hidden_reason = (
                    "Under administrative review due to community reports"
                )
            experience.save(
                update_fields=["reports_count", "is_hidden", "hidden_reason"]
            )

        return {
            "report_id": str(report.id),
            "experience_id": str(experience.id),
            "status": report.status,
            "message": "Thank you for reporting. Our moderation team will review this submission.",
        }

    # Admin Operations
    @classmethod
    @transaction.atomic
    def admin_approve_experience(
        cls, admin_user, experience_id: str, version_number: Optional[int] = None
    ) -> InterviewExperience:
        try:
            experience = InterviewExperience.objects.select_for_update().get(
                id=experience_id
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Experience not found.")

        if version_number:
            ver = ExperienceVersion.objects.filter(
                experience=experience, version_number=version_number
            ).first()
            if ver and ver.snapshot_data:
                # Apply proposed snapshot to canonical entity
                snap = ver.snapshot_data
                experience.company_name = snap.get(
                    "company_name", experience.company_name
                )
                experience.role = snap.get("role", experience.role)
                experience.experience_level = snap.get(
                    "experience_level", experience.experience_level
                )
                experience.salary_range = snap.get(
                    "salary_range", experience.salary_range
                )
                experience.overall_outcome = snap.get(
                    "overall_outcome", experience.overall_outcome
                )
                experience.is_anonymous = snap.get(
                    "is_anonymous", experience.is_anonymous
                )
                experience.company_location = snap.get(
                    "company_location", experience.company_location
                )
                experience.recruitment_year = snap.get(
                    "recruitment_year", experience.recruitment_year
                )
                experience.job_type = snap.get("job_type", experience.job_type)
                experience.interview_mode = snap.get(
                    "interview_mode", experience.interview_mode
                )
                experience.overall_difficulty = snap.get(
                    "overall_difficulty", experience.overall_difficulty
                )
                experience.additional_context = snap.get(
                    "additional_context", experience.additional_context
                )
                _sync_stages_and_questions(experience, snap.get("stages", []))

                ver.status = ExperienceVersion.STATUS_APPROVED
                ver.is_published = True
                ver.save()

                ExperienceVersion.objects.filter(experience=experience).exclude(
                    id=ver.id
                ).update(is_published=False)
                experience.published_version = ver.version_number

        experience.status = InterviewExperience.STATUS_PUBLISHED
        experience.is_hidden = False
        experience.hidden_reason = ""
        experience.rejection_reason = ""
        if not experience.published_at:
            experience.published_at = timezone.now()
        experience.save()

        # Extract/sync questions
        QuestionExtractorService.extract_and_sync_questions(experience)

        AdminActivityLog.objects.create(
            actor=admin_user,
            action="experience_approved",
            resource_type="InterviewExperience",
            resource_id=str(experience.id),
            details={"company": experience.company_name, "role": experience.role},
        )
        return experience

    @classmethod
    @transaction.atomic
    def admin_reject_experience(
        cls, admin_user, experience_id: str, reason: str
    ) -> InterviewExperience:
        try:
            experience = InterviewExperience.objects.select_for_update().get(
                id=experience_id
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Experience not found.")

        experience.status = InterviewExperience.STATUS_REJECTED
        experience.rejection_reason = reason.strip()
        experience.save()

        QuestionExtractorService.deactivate_experience_questions(experience.id)

        AdminActivityLog.objects.create(
            actor=admin_user,
            action="experience_rejected",
            resource_type="InterviewExperience",
            resource_id=str(experience.id),
            details={"reason": reason},
        )
        return experience

    @classmethod
    @transaction.atomic
    def admin_suspend_experience(
        cls, admin_user, experience_id: str, reason: str
    ) -> InterviewExperience:
        try:
            experience = InterviewExperience.objects.select_for_update().get(
                id=experience_id
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Experience not found.")

        experience.is_hidden = True
        experience.hidden_reason = reason.strip()
        experience.save()

        QuestionExtractorService.deactivate_experience_questions(experience.id)

        AdminActivityLog.objects.create(
            actor=admin_user,
            action="experience_suspended",
            resource_type="InterviewExperience",
            resource_id=str(experience.id),
            details={"reason": reason},
        )
        return experience

    @classmethod
    @transaction.atomic
    def admin_restore_experience(
        cls, admin_user, experience_id: str
    ) -> InterviewExperience:
        try:
            experience = InterviewExperience.objects.select_for_update().get(
                id=experience_id
            )
        except (InterviewExperience.DoesNotExist, ValueError):
            raise NotFound("Experience not found.")

        experience.is_hidden = False
        experience.hidden_reason = ""
        experience.status = InterviewExperience.STATUS_PUBLISHED
        experience.save()

        QuestionExtractorService.extract_and_sync_questions(experience)

        AdminActivityLog.objects.create(
            actor=admin_user,
            action="experience_restored",
            resource_type="InterviewExperience",
            resource_id=str(experience.id),
        )
        return experience
