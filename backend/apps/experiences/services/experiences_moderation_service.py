import re
from typing import Any

PHONE_REGEX = re.compile(r"(?:\+91[\-\s]?)?[6-9]\d{9}\b")
EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b")
AADHAAR_REGEX = re.compile(r"\b\d{4}\s\d{4}\s\d{4}\b")
CREDENTIAL_REGEX = re.compile(
    r"\b(password|api[_-]?key|secret|token)\s*[:=]\s*\S+", re.IGNORECASE
)
SUSPICIOUS_LINK_REGEX = re.compile(
    r"(?:bit\.ly|tinyurl\.com|t\.me|telegram\.me|chat\.whatsapp\.com|discord\.gg)\S*",
    re.IGNORECASE,
)

SPAM_KEYWORDS = [
    "join my telegram",
    "whatsapp group",
    "guaranteed job",
    "paid referral",
    "crypto",
    "forex",
    "buy course",
    "earn money fast",
    "dm me for questions leak",
]

PROFANITY_KEYWORDS = [
    "bastard",
    "idiot interviewer",
    "scam company",
    "fraudsters",
    "shitty",
    "bullshit",
    "asshole",
]


class ExperienceModerationService:
    """
    Evaluates interview experience submissions for PII, abusive content,
    spam, and structural integrity using a deterministic risk-based engine.
    """

    @classmethod
    def moderate_experience(cls, experience_data: dict[str, Any]) -> dict[str, Any]:
        issues: list[str] = []
        flags = {
            "has_pii": False,
            "has_spam": False,
            "has_inappropriate_language": False,
            "has_suspicious_links": False,
        }

        # 1. Structural Checks
        company = (experience_data.get("company_name") or "").strip()
        role = (experience_data.get("role") or "").strip()
        outcome = (experience_data.get("overall_outcome") or "").strip()
        stages = experience_data.get("stages", [])

        if not company or len(company) < 2:
            issues.append("Company name is missing or too short.")
        if not role or len(role) < 2:
            issues.append("Role is missing or too short.")
        if not outcome:
            issues.append("Recruitment outcome is required.")
        if not stages:
            issues.append("At least one recruitment stage must be documented.")

        # Aggregate text corpus for content scanning
        text_corpus = [
            company,
            role,
            experience_data.get("additional_context", ""),
            experience_data.get("company_location", ""),
        ]

        for stage in stages:
            text_corpus.append(stage.get("custom_stage_name", ""))
            text_corpus.append(stage.get("description", ""))
            text_corpus.append(stage.get("additional_notes", ""))
            for q in stage.get("questions", []):
                text_corpus.append(q.get("question_text", ""))
                text_corpus.append(q.get("follow_up_text", ""))
                text_corpus.append(q.get("interviewer_approach", ""))
                text_corpus.append(q.get("student_response", ""))

        full_text = " ".join([t for t in text_corpus if t])

        # 2. PII Checks
        if PHONE_REGEX.search(full_text):
            flags["has_pii"] = True
            issues.append("Personal phone number detected in submission.")

        if EMAIL_REGEX.search(full_text):
            flags["has_pii"] = True
            issues.append("Personal email address detected in submission.")

        if AADHAAR_REGEX.search(full_text):
            flags["has_pii"] = True
            issues.append("Government identification pattern (Aadhaar) detected.")

        if CREDENTIAL_REGEX.search(full_text):
            flags["has_pii"] = True
            issues.append("Potential credentials or tokens detected.")

        # 3. Spam & Malicious Links
        if SUSPICIOUS_LINK_REGEX.search(full_text):
            flags["has_suspicious_links"] = True
            issues.append("Suspicious redirect link or invite URL detected.")

        lower_text = full_text.lower()
        for spam_term in SPAM_KEYWORDS:
            if spam_term in lower_text:
                flags["has_spam"] = True
                issues.append(f"Promotional spam phrase detected: '{spam_term}'")
                break

        # 4. Inappropriate Language
        for profanity in PROFANITY_KEYWORDS:
            if profanity in lower_text:
                flags["has_inappropriate_language"] = True
                issues.append(
                    f"Inappropriate or defamatory language detected: '{profanity}'"
                )
                break

        # 5. Meaningless content check
        if full_text.strip() and len(full_text.strip()) < 20:
            issues.append(
                "Submission content is too brief to provide useful recruitment insights."
            )

        # 6. Determine Risk Level and Action
        if flags["has_pii"] or flags["has_inappropriate_language"] or flags["has_spam"]:
            risk_level = "high"
            is_auto_approvable = False
            suggested_action = "pending_review"
        elif flags["has_suspicious_links"] or any("too brief" in i for i in issues):
            risk_level = "medium"
            is_auto_approvable = False
            suggested_action = "pending_review"
        elif issues:
            # Structural issues
            risk_level = "high"
            is_auto_approvable = False
            suggested_action = "reject"
        else:
            risk_level = "low"
            is_auto_approvable = True
            suggested_action = "auto_publish"

        return {
            "risk_level": risk_level,
            "is_auto_approvable": is_auto_approvable,
            "issues": issues,
            "flags": flags,
            "suggested_action": suggested_action,
        }
