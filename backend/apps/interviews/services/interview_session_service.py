import logging
from datetime import timedelta
from typing import Any
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from apps.accounts.models import UserResumeVersion
from apps.aptitude.models import AptitudeSession, AptitudeTestConfig
from apps.aptitude.services.session_service import start_or_resume_aptitude_session
from apps.interviews.models import (
    InterviewConfig,
    InterviewCoolingPeriod,
    InterviewRound,
    InterviewSession,
)
from apps.interviews.services.interview_ai_service import get_interview_ai_provider
from apps.learning.models import Roadmap

logger = logging.getLogger(__name__)


def check_interview_eligibility(user) -> dict[str, Any]:
    """
    Checks cooling period status per interview type and returns active session info.
    Cooling periods are completely independent by type.
    """
    now = timezone.now()
    cooling_records = InterviewCoolingPeriod.objects.filter(user=user, expires_at__gt=now)
    cooling_map = {rec.interview_type: rec for rec in cooling_records}

    def _type_status(itype: str) -> dict[str, Any]:
        rec = cooling_map.get(itype)
        if rec and rec.is_active:
            return {
                "is_eligible": False,
                "cooling_until": rec.expires_at.isoformat(),
                "remaining_seconds": rec.remaining_seconds,
                "reason": f"{itype.capitalize()} interview is in a 24-hour cooling period following an unsuccessful attempt.",
            }
        return {
            "is_eligible": True,
            "cooling_until": None,
            "remaining_seconds": 0,
            "reason": None,
        }

    # Find active in-progress session if any
    active_session = (
        InterviewSession.objects.filter(
            student=user, status__in=[InterviewSession.STATUS_IN_PROGRESS, InterviewSession.STATUS_CREATED]
        )
        .order_by("-created_at")
        .first()
    )

    return {
        "technical": _type_status(InterviewSession.TYPE_TECHNICAL),
        "hr": _type_status(InterviewSession.TYPE_HR),
        "mixed": _type_status(InterviewSession.TYPE_MIXED),
        "active_session": {
            "session_id": str(active_session.id),
            "interview_type": active_session.interview_type,
            "role": active_session.role,
            "salary_range": active_session.salary_range,
            "status": active_session.status,
            "created_at": active_session.created_at.isoformat(),
        }
        if active_session
        else None,
    }


def get_prepopulated_setup_data(user) -> dict[str, Any]:
    """
    Prepopulates interview setup fields from active Learning Roadmap and user profile.
    Never mutates or overwrites the roadmap.
    """
    active_roadmap = Roadmap.objects.filter(user=user, is_active=True).first()
    profile = getattr(user, "profile", None)

    resumes = UserResumeVersion.objects.filter(user=user).order_by("-version_number")
    resume_list = [
        {
            "version_number": r.version_number,
            "original_filename": r.original_filename,
            "file_size_bytes": r.file_size_bytes,
            "created_at": r.created_at.isoformat(),
        }
        for r in resumes
    ]

    role = (
        (active_roadmap.role if active_roadmap else (profile.target_role if profile else None))
        or "Backend Developer"
    )
    experience_level = (
        (active_roadmap.experience_level if active_roadmap else (profile.experience_level if profile else None))
        or "Fresher"
    )
    salary_range = (
        (active_roadmap.target_salary if active_roadmap else (profile.target_salary if profile else None))
        or "₹5–7 LPA"
    )
    language = (
        (active_roadmap.language if active_roadmap else "")
        or "Python"
    )
    framework = (
        (active_roadmap.framework if active_roadmap else "")
        or "Django"
    )
    database = (
        (active_roadmap.database if active_roadmap else "")
        or "PostgreSQL"
    )

    return {
        "has_active_roadmap": active_roadmap is not None,
        "role": role,
        "experience_level": experience_level,
        "salary_range": salary_range,
        "language": language,
        "framework": framework,
        "database": database,
        "available_resumes": resume_list,
        "current_resume_version": profile.current_resume_version if profile else 0,
    }


def create_interview_session(user, data: dict[str, Any]) -> InterviewSession:
    """
    Validates setup fields, enforces independent cooling periods, snapshots resume version,
    and initializes interview session with structured questions.
    """
    interview_type = data.get("interview_type", "").lower()
    if interview_type not in [
        InterviewSession.TYPE_TECHNICAL,
        InterviewSession.TYPE_HR,
        InterviewSession.TYPE_MIXED,
    ]:
        raise ValidationError({"interview_type": "Invalid interview type selected."})

    # Enforce independent cooling period check
    now = timezone.now()
    active_cooling = InterviewCoolingPeriod.objects.filter(
        user=user, interview_type=interview_type, expires_at__gt=now
    ).first()
    if active_cooling:
        raise PermissionDenied(
            {
                "detail": f"{interview_type.capitalize()} interview is currently in a cooling period. Please try again after cooling expires.",
                "remaining_seconds": active_cooling.remaining_seconds,
                "cooling_until": active_cooling.expires_at.isoformat(),
            }
        )

    # Validate required fields
    role = (data.get("role") or "").strip()
    experience_level = (data.get("experience_level") or "").strip()
    salary_range = (data.get("salary_range") or "").strip()

    if not role:
        raise ValidationError({"role": "Target job role is required."})
    if not experience_level:
        raise ValidationError({"experience_level": "Experience level is required."})
    if not salary_range:
        raise ValidationError({"salary_range": "Target salary range is required."})

    language = (data.get("language") or "").strip()
    framework = (data.get("framework") or "").strip()
    database = (data.get("database") or "").strip()

    # Optional resume version snapshot
    resume_ver_num = data.get("resume_version_reference")
    resume_snapshot = {}
    if resume_ver_num:
        resume_record = UserResumeVersion.objects.filter(user=user, version_number=resume_ver_num).first()
        if resume_record:
            resume_snapshot = {
                "version_number": resume_record.version_number,
                "original_filename": resume_record.original_filename,
                "file_size_bytes": resume_record.file_size_bytes,
                "storage_path": resume_record.storage_path,
            }

    with transaction.atomic():
        # Check if user already has an in-progress session of same type
        existing = (
            InterviewSession.objects.filter(
                student=user, interview_type=interview_type, status=InterviewSession.STATUS_IN_PROGRESS
            )
            .order_by("-created_at")
            .first()
        )
        if existing:
            return existing

        session = InterviewSession.objects.create(
            student=user,
            interview_type=interview_type,
            role=role,
            experience_level=experience_level,
            salary_range=salary_range,
            language=language,
            framework=framework,
            database=database,
            resume_version_reference=resume_ver_num if resume_snapshot else None,
            resume_snapshot=resume_snapshot,
            status=InterviewSession.STATUS_IN_PROGRESS,
            final_result=InterviewSession.RESULT_PENDING,
            evaluation_status=InterviewSession.EVAL_NOT_STARTED,
        )

        ai_provider = get_interview_ai_provider()

        if interview_type in [InterviewSession.TYPE_TECHNICAL, InterviewSession.TYPE_HR]:
            questions = ai_provider.generate_questions(
                interview_type=interview_type,
                role=role,
                experience_level=experience_level,
                salary_range=salary_range,
                language=language,
                framework=framework,
                database=database,
                resume_snapshot=resume_snapshot,
            )
            first_q = questions[0]["question_text"] if questions else "Welcome. Please introduce your technical background."
            session.ai_conversation_state = {
                "questions": questions,
                "current_question_index": 0,
                "turns": [
                    {
                        "role": "interviewer",
                        "content": first_q,
                        "question_index": 0,
                        "timestamp": timezone.now().isoformat(),
                    }
                ],
            }
            session.save(update_fields=["ai_conversation_state", "updated_at"])

        elif interview_type == InterviewSession.TYPE_MIXED:
            # Generate sequential round structure
            is_fresher = experience_level.lower() in ["fresher", "less than 1 year"]
            round_definitions = []

            if is_fresher:
                # Round 1: Cognitive Aptitude Screening (reusing Phase 5 engine)
                round_definitions.append({
                    "round_number": 1,
                    "round_type": InterviewRound.ROUND_APTITUDE,
                    "round_name": "Round 1: Cognitive Aptitude Screening",
                    "round_description": "Standardized cognitive foundation test covering Quantitative Aptitude, Logical Reasoning, and Verbal Ability (60% qualifying threshold).",
                })
                round_definitions.append({
                    "round_number": 2,
                    "round_type": InterviewRound.ROUND_TECHNICAL_1,
                    "round_name": "Round 2: Core Technical & Problem Solving",
                    "round_description": f"Core {role} technical concepts, language runtime, and fundamental algorithmic trade-offs.",
                })
                round_definitions.append({
                    "round_number": 3,
                    "round_type": InterviewRound.ROUND_TECHNICAL_2,
                    "round_name": "Round 3: Advanced Architecture & Systems",
                    "round_description": f"Production scenarios, database concurrency, and system design tailored to {salary_range}.",
                })
                round_definitions.append({
                    "round_number": 4,
                    "round_type": InterviewRound.ROUND_HR,
                    "round_name": "Round 4: Behavioral & Culture Fit",
                    "round_description": "Professional communication, team collaboration, conflict handling, and career motivation.",
                })
            else:
                # Experienced candidates skip aptitude
                round_definitions.append({
                    "round_number": 1,
                    "round_type": InterviewRound.ROUND_TECHNICAL_1,
                    "round_name": "Round 1: Core Technical & Architecture",
                    "round_description": f"Core engineering depth, concurrency, and architecture patterns for {role}.",
                })
                round_definitions.append({
                    "round_number": 2,
                    "round_type": InterviewRound.ROUND_TECHNICAL_2,
                    "round_name": "Round 2: System Scalability & Production Scenarios",
                    "round_description": f"Distributed systems, debugging live incidents, and trade-offs expected for {salary_range}.",
                })
                round_definitions.append({
                    "round_number": 3,
                    "round_type": InterviewRound.ROUND_HR,
                    "round_name": "Round 3: Behavioral & Executive Readiness",
                    "round_description": "Leadership, cross-functional collaboration, mentorship, and career trajectory.",
                })

            for idx, r_def in enumerate(round_definitions):
                r_status = InterviewRound.STATUS_IN_PROGRESS if idx == 0 else InterviewRound.STATUS_PENDING
                apt_sess = None

                # For Round 1 Aptitude, auto-instantiate an AptitudeSession (mixed_stage)
                if r_def["round_type"] == InterviewRound.ROUND_APTITUDE:
                    try:
                        apt_sess, _ = start_or_resume_aptitude_session(
                            user=user,
                            session_type=AptitudeSession.TYPE_MIXED_STAGE,
                        )
                    except Exception as exc:
                        logger.warning("Could not auto-start aptitude stage: %s", exc)

                ir = InterviewRound.objects.create(
                    session=session,
                    round_number=r_def["round_number"],
                    round_type=r_def["round_type"],
                    round_name=r_def["round_name"],
                    round_description=r_def["round_description"],
                    status=r_status,
                    aptitude_session=apt_sess,
                    started_at=timezone.now() if idx == 0 else None,
                )

                # If first round is voice-based, initialize questions
                if idx == 0 and r_def["round_type"] != InterviewRound.ROUND_APTITUDE:
                    q_list = ai_provider.generate_questions(
                        interview_type="technical",
                        role=role,
                        experience_level=experience_level,
                        salary_range=salary_range,
                        language=language,
                        framework=framework,
                        database=database,
                        resume_snapshot=resume_snapshot,
                        round_type="technical_1",
                    )
                    first_text = q_list[0]["question_text"] if q_list else "Let's begin the technical assessment."
                    ir.ai_conversation_state = {
                        "questions": q_list,
                        "current_question_index": 0,
                        "turns": [
                            {
                                "role": "interviewer",
                                "content": first_text,
                                "question_index": 0,
                                "timestamp": timezone.now().isoformat(),
                            }
                        ],
                    }
                    ir.save(update_fields=["ai_conversation_state", "updated_at"])

    return session


def process_interview_turn(session_id: str, user, student_speech: str) -> dict[str, Any]:
    """
    Executes a real-time conversational voice turn:
    records student speech, analyzes intent, handles follow-ups/clarifications/I-don't-knows,
    and returns the interviewer's spoken response.
    """
    with transaction.atomic():
        session = (
            InterviewSession.objects.select_for_update()
            .filter(id=session_id, student=user)
            .first()
        )
        if not session:
            raise NotFound({"detail": "Interview session not found."})

        if session.status != InterviewSession.STATUS_IN_PROGRESS:
            raise ValidationError({"detail": f"Session is not active (current status: {session.status})."})

        ai_provider = get_interview_ai_provider()

        # Handle Mixed Voice Round vs Standalone Session
        if session.interview_type == InterviewSession.TYPE_MIXED:
            current_round = session.rounds.filter(status=InterviewRound.STATUS_IN_PROGRESS).first()
            if not current_round:
                raise ValidationError({"detail": "No active round found for this mixed interview session."})
            if current_round.round_type == InterviewRound.ROUND_APTITUDE:
                raise ValidationError({"detail": "Current round is Aptitude. Voice turns are disabled for aptitude stages."})

            conv_state = current_round.ai_conversation_state or {}
            questions = conv_state.get("questions", [])
            current_idx = conv_state.get("current_question_index", 0)
            turns = conv_state.get("turns", [])

            # Record student turn
            turns.append({
                "role": "student",
                "content": student_speech,
                "question_index": current_idx,
                "timestamp": timezone.now().isoformat(),
            })

            res = ai_provider.process_turn(
                interview_type=session.interview_type,
                role=session.role,
                experience_level=session.experience_level,
                salary_range=session.salary_range,
                tech_stack={"language": session.language, "framework": session.framework, "database": session.database},
                questions=questions,
                current_question_index=current_idx,
                student_speech=student_speech,
                turns_history=turns,
                resume_snapshot=session.resume_snapshot,
            )

            # Record interviewer turn
            turns.append({
                "role": "interviewer",
                "content": res["interviewer_speech"],
                "question_index": res["next_question_index"],
                "status": res["status"],
                "timestamp": timezone.now().isoformat(),
            })

            conv_state["turns"] = turns
            conv_state["current_question_index"] = res["next_question_index"]
            current_round.ai_conversation_state = conv_state

            if res.get("is_completed"):
                # Round questions finished, trigger round evaluation & transition
                eval_res = ai_provider.evaluate_session(
                    interview_type="technical" if "technical" in current_round.round_type else "hr",
                    role=session.role,
                    experience_level=session.experience_level,
                    salary_range=session.salary_range,
                    tech_stack={"language": session.language, "framework": session.framework, "database": session.database},
                    questions=questions,
                    turns_history=turns,
                    resume_snapshot=session.resume_snapshot,
                )
                _handle_round_result(session, current_round, eval_res["final_result"], eval_res["feedback"])
            else:
                current_round.save(update_fields=["ai_conversation_state", "updated_at"])

            return {
                "session_id": str(session.id),
                "round_id": str(current_round.id),
                "round_number": current_round.round_number,
                "interviewer_speech": res["interviewer_speech"],
                "status": res["status"],
                "next_question_index": res["next_question_index"],
                "total_questions": len(questions),
                "is_completed": res.get("is_completed", False),
            }

        # Standalone Technical or HR Interview
        conv_state = session.ai_conversation_state or {}
        questions = conv_state.get("questions", [])
        current_idx = conv_state.get("current_question_index", 0)
        turns = conv_state.get("turns", [])

        turns.append({
            "role": "student",
            "content": student_speech,
            "question_index": current_idx,
            "timestamp": timezone.now().isoformat(),
        })

        res = ai_provider.process_turn(
            interview_type=session.interview_type,
            role=session.role,
            experience_level=session.experience_level,
            salary_range=session.salary_range,
            tech_stack={"language": session.language, "framework": session.framework, "database": session.database},
            questions=questions,
            current_question_index=current_idx,
            student_speech=student_speech,
            turns_history=turns,
            resume_snapshot=session.resume_snapshot,
        )

        turns.append({
            "role": "interviewer",
            "content": res["interviewer_speech"],
            "question_index": res["next_question_index"],
            "status": res["status"],
            "timestamp": timezone.now().isoformat(),
        })

        conv_state["turns"] = turns
        conv_state["current_question_index"] = res["next_question_index"]
        session.ai_conversation_state = conv_state

        if res.get("is_completed"):
            complete_and_evaluate_session(session)
        else:
            session.save(update_fields=["ai_conversation_state", "updated_at"])

        return {
            "session_id": str(session.id),
            "interviewer_speech": res["interviewer_speech"],
            "status": res["status"],
            "next_question_index": res["next_question_index"],
            "total_questions": len(questions),
            "is_completed": res.get("is_completed", False),
        }


def _handle_round_result(session: InterviewSession, round_obj: InterviewRound, result: str, feedback: dict) -> None:
    """
    Handles sequential round results inside Mixed recruitment:
    - If passed: unlocks next round. If all rounds passed, session passes!
    - If failed: ends Mixed recruitment as FAIL, sets remaining rounds 'not_attempted', creates 24h cooling.
    """
    round_obj.status = InterviewRound.STATUS_COMPLETED
    round_obj.result = result
    round_obj.feedback = feedback
    round_obj.completed_at = timezone.now()
    round_obj.save(update_fields=["status", "result", "feedback", "completed_at", "updated_at"])

    if result == InterviewRound.RESULT_PASS:
        # Check if next round exists
        next_round = session.rounds.filter(round_number=round_obj.round_number + 1).first()
        if next_round:
            next_round.status = InterviewRound.STATUS_IN_PROGRESS
            next_round.started_at = timezone.now()

            # Initialize questions for next voice round
            ai_provider = get_interview_ai_provider()
            q_type = "hr" if next_round.round_type == InterviewRound.ROUND_HR else "technical"
            q_list = ai_provider.generate_questions(
                interview_type=q_type,
                role=session.role,
                experience_level=session.experience_level,
                salary_range=session.salary_range,
                language=session.language,
                framework=session.framework,
                database=session.database,
                resume_snapshot=session.resume_snapshot,
                round_type=next_round.round_type,
            )
            first_text = q_list[0]["question_text"] if q_list else "Welcome to this round."
            next_round.ai_conversation_state = {
                "questions": q_list,
                "current_question_index": 0,
                "turns": [
                    {
                        "role": "interviewer",
                        "content": first_text,
                        "question_index": 0,
                        "timestamp": timezone.now().isoformat(),
                    }
                ],
            }
            next_round.save(update_fields=["status", "started_at", "ai_conversation_state", "updated_at"])
        else:
            # All rounds successfully passed!
            session.status = InterviewSession.STATUS_COMPLETED
            session.final_result = InterviewSession.RESULT_PASS
            session.evaluation_status = InterviewSession.EVAL_COMPLETED
            session.completed_at = timezone.now()
            session.overall_feedback = {
                "overall_result": "PASS",
                "summary": f"Outstanding performance! Candidate successfully cleared all rounds of the {session.role} Mixed Recruitment Process for the {session.salary_range} tier.",
                "rounds_completed": session.rounds.count(),
            }
            session.save(update_fields=["status", "final_result", "evaluation_status", "completed_at", "overall_feedback", "updated_at"])
    else:
        # Round FAILED: entire Mixed process terminates immediately as FAIL
        session.status = InterviewSession.STATUS_COMPLETED
        session.final_result = InterviewSession.RESULT_FAIL
        session.evaluation_status = InterviewSession.EVAL_COMPLETED
        session.completed_at = timezone.now()

        # Mark all pending subsequent rounds as not_attempted
        session.rounds.filter(round_number__gt=round_obj.round_number).update(
            status=InterviewRound.STATUS_NOT_ATTEMPTED,
            result=InterviewRound.RESULT_PENDING,
        )

        # Enforce 24h cooling on Mixed recruitment
        cfg = InterviewConfig.get_active_config()
        cooling_hours = cfg.mixed_cooling_hours or 24
        expires = timezone.now() + timedelta(hours=cooling_hours)
        session.cooling_period_until = expires

        InterviewCoolingPeriod.objects.update_or_create(
            user=session.student,
            interview_type=InterviewSession.TYPE_MIXED,
            defaults={"expires_at": expires, "failed_session": session},
        )

        session.overall_feedback = {
            "overall_result": "FAIL",
            "summary": f"Mixed recruitment process concluded at {round_obj.round_name}. Review the round feedback below to address weak spots before reattempting after the 24-hour cooling period.",
            "failed_at_round": round_obj.round_name,
            "round_feedback": feedback,
        }
        session.save(update_fields=["status", "final_result", "evaluation_status", "completed_at", "cooling_period_until", "overall_feedback", "updated_at"])


def complete_mixed_aptitude_stage(session_id: str, user) -> dict[str, Any]:
    """
    Evaluates the aptitude round in Mixed Recruitment against the qualifying threshold.
    Does NOT consume the standalone daily aptitude quota.
    """
    with transaction.atomic():
        session = (
            InterviewSession.objects.select_for_update()
            .filter(id=session_id, student=user)
            .first()
        )
        if not session or session.interview_type != InterviewSession.TYPE_MIXED:
            raise NotFound({"detail": "Mixed interview session not found."})

        round_obj = session.rounds.filter(
            round_type=InterviewRound.ROUND_APTITUDE, status=InterviewRound.STATUS_IN_PROGRESS
        ).first()
        if not round_obj:
            raise ValidationError({"detail": "No active Aptitude round found."})

        apt_sess = round_obj.aptitude_session
        if not apt_sess or apt_sess.status != AptitudeSession.STATUS_SUBMITTED:
            raise ValidationError({"detail": "Aptitude stage has not been submitted yet."})

        cfg = AptitudeTestConfig.get_active_config()
        cutoff = cfg.mixed_qualifying_cutoff or 60.0
        pct = apt_sess.percentage or 0.0
        is_pass = pct >= cutoff

        feedback = {
            "overall_result": "PASS" if is_pass else "FAIL",
            "summary": f"Scored {pct}% in Cognitive Aptitude screening (Qualifying threshold: {cutoff}%).",
            "percentage": pct,
            "qualifying_cutoff": cutoff,
            "correct_count": apt_sess.correct_count,
            "total_questions": apt_sess.total_questions,
            "technical_knowledge": "Evaluated Quantitative Aptitude, Logical Reasoning, and Verbal Ability fundamentals.",
            "communication": "N/A for objective cognitive screening.",
            "problem_solving": f"Accuracy rate: {round((apt_sess.correct_count / max(1, apt_sess.total_questions)) * 100, 1)}%.",
            "key_weaknesses": ["Speed math & time allocation" if not is_pass else "None critical in cognitive screening"],
            "areas_for_improvement": ["Timed practice across weaker aptitude sections" if not is_pass else "Maintain speed"],
            "improvement_suggestions": ["Focus on elimination strategies and mental arithmetic shortcuts."],
            "better_approaches": ["Skip difficult questions initially to secure all easy marks within the 60-minute window."],
        }

        result_str = InterviewRound.RESULT_PASS if is_pass else InterviewRound.RESULT_FAIL
        _handle_round_result(session, round_obj, result_str, feedback)

        return {
            "session_id": str(session.id),
            "round_id": str(round_obj.id),
            "result": result_str,
            "percentage": pct,
            "cutoff": cutoff,
            "is_passed": is_pass,
            "session_status": session.status,
            "final_result": session.final_result,
        }


def complete_and_evaluate_session(session: InterviewSession) -> InterviewSession:
    """
    Evaluates standalone Technical or HR interview.
    Enforces binary PASS/FAIL and creates a 24-hour cooling period only upon failure.
    """
    ai_provider = get_interview_ai_provider()
    conv_state = session.ai_conversation_state or {}
    questions = conv_state.get("questions", [])
    turns = conv_state.get("turns", [])

    eval_res = ai_provider.evaluate_session(
        interview_type=session.interview_type,
        role=session.role,
        experience_level=session.experience_level,
        salary_range=session.salary_range,
        tech_stack={"language": session.language, "framework": session.framework, "database": session.database},
        questions=questions,
        turns_history=turns,
        resume_snapshot=session.resume_snapshot,
    )

    final_result = eval_res.get("final_result", "fail")
    feedback = eval_res.get("feedback", {})

    session.status = InterviewSession.STATUS_COMPLETED
    session.final_result = final_result
    session.evaluation_status = InterviewSession.EVAL_COMPLETED
    session.overall_feedback = feedback
    session.completed_at = timezone.now()

    if final_result == InterviewSession.RESULT_FAIL:
        cfg = InterviewConfig.get_active_config()
        cooling_hours = cfg.technical_cooling_hours if session.interview_type == InterviewSession.TYPE_TECHNICAL else cfg.hr_cooling_hours
        expires = timezone.now() + timedelta(hours=cooling_hours or 24)
        session.cooling_period_until = expires

        InterviewCoolingPeriod.objects.update_or_create(
            user=session.student,
            interview_type=session.interview_type,
            defaults={"expires_at": expires, "failed_session": session},
        )

    session.save(
        update_fields=[
            "status",
            "final_result",
            "evaluation_status",
            "overall_feedback",
            "completed_at",
            "cooling_period_until",
            "updated_at",
        ]
    )
    return session


def abandon_interview_session(session_id: str, user) -> InterviewSession:
    """
    Abandons an in-progress interview.
    Does NOT record a FAIL and does NOT trigger a cooling period.
    """
    with transaction.atomic():
        session = InterviewSession.objects.filter(id=session_id, student=user).first()
        if not session:
            raise NotFound({"detail": "Interview session not found."})

        if session.status != InterviewSession.STATUS_IN_PROGRESS:
            raise ValidationError({"detail": f"Cannot abandon session with status '{session.status}'."})

        session.status = InterviewSession.STATUS_ABANDONED
        session.final_result = InterviewSession.RESULT_ABANDONED
        session.completed_at = timezone.now()
        session.save(update_fields=["status", "final_result", "completed_at", "updated_at"])

        # Also abandon active rounds if Mixed
        session.rounds.filter(status=InterviewRound.STATUS_IN_PROGRESS).update(
            status=InterviewRound.STATUS_NOT_ATTEMPTED
        )

    return session


def get_session_detail_dict(session: InterviewSession) -> dict[str, Any]:
    """
    Serializes interview session for the student view.
    Never leaks expected answers or internal evaluation prompts.
    """
    rounds_data = []
    if session.interview_type == InterviewSession.TYPE_MIXED:
        for r in session.rounds.all().order_by("round_number"):
            rounds_data.append({
                "round_id": str(r.id),
                "round_number": r.round_number,
                "round_type": r.round_type,
                "round_name": r.round_name,
                "round_description": r.round_description,
                "status": r.status,
                "result": r.result,
                "aptitude_session_id": str(r.aptitude_session_id) if r.aptitude_session_id else None,
                "feedback": r.feedback if r.status == InterviewRound.STATUS_COMPLETED else {},
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            })

    conv = session.ai_conversation_state or {}
    questions = conv.get("questions", [])
    turns = conv.get("turns", [])
    current_q_idx = conv.get("current_question_index", 0)

    # Active round state for Mixed
    current_round_obj = None
    if session.interview_type == InterviewSession.TYPE_MIXED:
        current_round_obj = session.rounds.filter(status=InterviewRound.STATUS_IN_PROGRESS).first()
        if current_round_obj:
            r_conv = current_round_obj.ai_conversation_state or {}
            questions = r_conv.get("questions", [])
            turns = r_conv.get("turns", [])
            current_q_idx = r_conv.get("current_question_index", 0)

    # Clean turns to avoid leaking sensitive internal keys
    sanitized_turns = []
    for t in turns:
        sanitized_turns.append({
            "role": t.get("role", "interviewer"),
            "content": t.get("content", ""),
            "timestamp": t.get("timestamp"),
            "status": t.get("status"),
        })

    return {
        "session_id": str(session.id),
        "interview_type": session.interview_type,
        "role": session.role,
        "experience_level": session.experience_level,
        "salary_range": session.salary_range,
        "language": session.language,
        "framework": session.framework,
        "database": session.database,
        "status": session.status,
        "final_result": session.final_result,
        "evaluation_status": session.evaluation_status,
        "resume_version": session.resume_version_reference,
        "resume_name": session.resume_snapshot.get("original_filename") if session.resume_snapshot else None,
        "cooling_period_until": session.cooling_period_until.isoformat() if session.cooling_period_until else None,
        "started_at": session.started_at.isoformat(),
        "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        "current_question_index": current_q_idx,
        "total_questions": len(questions),
        "turns": sanitized_turns,
        "rounds": rounds_data,
        "current_round": {
            "round_id": str(current_round_obj.id),
            "round_number": current_round_obj.round_number,
            "round_type": current_round_obj.round_type,
            "round_name": current_round_obj.round_name,
            "aptitude_session_id": str(current_round_obj.aptitude_session_id) if current_round_obj.aptitude_session_id else None,
        }
        if current_round_obj
        else None,
        "overall_feedback": session.overall_feedback if session.status == InterviewSession.STATUS_COMPLETED else {},
    }
