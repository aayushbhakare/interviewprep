import re
import uuid
from apps.experiences.models import (
    InterviewExperience,
    StudentReportedQuestion,
)

TECH_KEYWORDS = {
    "Python": [
        r"\bpython\b",
        r"\bgil\b",
        r"\bdecorator\b",
        r"\bgenerator\b",
        r"\bpytest\b",
        r"\bdunder\b",
    ],
    "Django": [
        r"\bdjango\b",
        r"\bqueryset\b",
        r"\bdrf\b",
        r"\borm\b",
        r"\bmigration\b",
    ],
    "JavaScript": [
        r"\bjavascript\b",
        r"\bclosure\b",
        r"\bprototype\b",
        r"\basync/await\b",
        r"\bevent loop\b",
    ],
    "React": [
        r"\breact\b",
        r"\bhook\b",
        r"\buseeffect\b",
        r"\busestate\b",
        r"\bvirtual dom\b",
        r"\bjsx\b",
    ],
    "SQL": [
        r"\bsql\b",
        r"\bjoin\b",
        r"\bindexing\b",
        r"\bacid\b",
        r"\bquery optimization\b",
        r"\bforeign key\b",
    ],
    "PostgreSQL": [r"\bpostgres\b", r"\bpostgresql\b", r"\bexplain analyze\b"],
    "Java": [
        r"\bjava\b",
        r"\bjvm\b",
        r"\bspring boot\b",
        r"\bgarbage collector\b",
        r"\bmultithreading\b",
    ],
    "Data Structures": [
        r"\btree\b",
        r"\bgraph\b",
        r"\bbinary search\b",
        r"\blinked list\b",
        r"\bdp\b",
        r"\bdynamic programming\b",
        r"\bleetcode\b",
    ],
    "System Design": [
        r"\bsystem design\b",
        r"\bload balancer\b",
        r"\bsharding\b",
        r"\bcaching\b",
        r"\bcdn\b",
        r"\bmicroservices\b",
    ],
    "Operating Systems": [
        r"\bdeadlock\b",
        r"\bprocess\b",
        r"\bthread\b",
        r"\bvirtual memory\b",
        r"\bpaging\b",
    ],
    "HR & Behavioral": [
        r"\bconflict\b",
        r"\bstrength\b",
        r"\bweakness\b",
        r"\bwhy this company\b",
        r"\bteamwork\b",
        r"\b5 years\b",
    ],
}


def detect_technology_and_topic(text: str, role: str) -> tuple[str, str]:
    """
    Detects technology and topic slug from question text and candidate role.
    """
    lower = text.lower()
    for tech, patterns in TECH_KEYWORDS.items():
        for pat in patterns:
            if re.search(pat, lower):
                slug = tech.lower().replace(" & ", "-").replace(" ", "-")
                return tech, slug

    # Fallback to role-based default
    if "backend" in role.lower():
        return "Backend Development", "backend-development"
    if "frontend" in role.lower():
        return "Frontend Development", "frontend-development"
    return "General Engineering", "general-engineering"


class QuestionExtractorService:
    """
    Extracts, categorizes, and registers candidate-reported questions
    from published interview experiences into the StudentReportedQuestion bank.
    """

    @classmethod
    def extract_and_sync_questions(cls, experience: InterviewExperience) -> int:
        """
        Scans all stages and questions of the experience and registers
        them as active StudentReportedQuestion items.
        """
        if (
            experience.status != InterviewExperience.STATUS_PUBLISHED
            or experience.is_hidden
        ):
            cls.deactivate_experience_questions(experience.id)
            return 0

        created_count = 0
        for stage in experience.stages.all():
            for sq in stage.questions.all():
                q_text = sq.question_text.strip()
                if len(q_text) < 10:
                    continue

                tech, topic_slug = detect_technology_and_topic(q_text, experience.role)

                # Check if this exact question is already registered from this experience
                obj, created = StudentReportedQuestion.objects.update_or_create(
                    source_experience=experience,
                    source_question=sq,
                    defaults={
                        "source_stage": stage,
                        "question_text": q_text,
                        "follow_up_text": sq.follow_up_text.strip(),
                        "role": experience.role,
                        "technology": tech,
                        "topic_slug": topic_slug,
                        "stage_type": stage.custom_stage_name or stage.stage_type,
                        "salary_range": experience.salary_range,
                        "company_name": experience.company_name,
                        "is_active": True,
                    },
                )
                if created:
                    created_count += 1

        return created_count

    @classmethod
    def deactivate_experience_questions(cls, experience_id: str | uuid.UUID) -> int:
        """
        Safely deactivates extracted questions if an experience is deleted,
        suspended, or unpublished, preventing orphaned questions.
        """
        return StudentReportedQuestion.objects.filter(
            source_experience_id=experience_id
        ).update(is_active=False)
