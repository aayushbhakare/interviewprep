import time
import json
import logging
import requests
from django.conf import settings
from apps.ai_services.models import AIUsageRecord

logger = logging.getLogger(__name__)


def generate_roadmap_with_ai(
    role: str,
    experience_level: str,
    target_salary: str | None,
    language: str,
    framework: str | None,
    database: str | None,
    custom_role: str | None = None,
    fallback_generator=None,
    user=None,
) -> list[dict]:
    """
    Request AI-driven roadmap generation using Google Gemini when configured,
    or gracefully fall back to the deterministic domain engine.
    Logs AIUsageRecord for auditability and zero cost tracking.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    display_role = custom_role if role == "Other" and custom_role else role
    salary_tier = target_salary or "Flexible Salary Tier"
    framework_name = framework or "Core Standard Architecture"
    database_name = database or "Relational Database"

    # If Gemini API Key is configured, attempt real background generation
    if api_key.strip():
        start_time = time.time()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        prompt = f"""
You are an expert technical curriculum architect and senior engineering interviewer.
Design a personalized salary-wise, non-company-centric technical interview preparation roadmap.

Student Profile:
- Role: {display_role}
- Experience: {experience_level}
- Target Salary Tier: {salary_tier}
- Programming Language: {language}
- Primary Framework: {framework_name}
- Primary Database: {database_name}

Generate a JSON object containing an array of 5 phases. Each phase contains 2 weeks.
Each week contains:
1. "week_number": int
2. "title": string
3. "goal": string
4. "topics": array of 4 objects with:
   - "title": string
   - "minutes": int (30-60)
   - "depth_level": "fundamental" | "intermediate" | "advanced"
5. "practice_tasks": array of 2 objects with:
   - "title": string
   - "task_type": "coding_exercise" | "sql_query" | "debugging" | "implementation" | "mini_project"
   - "difficulty": "Easy" | "Medium" | "Hard"
   - "estimated_minutes": int (30-90)
   - "objective": string
   - "problem_statement": string
   - "requirements": array of strings
   - "constraints": array of strings
   - "sample_io": array of objects with "input", "output", "explanation"
   - "expected_deliverable": string
   - "starter_code": string
   - "hints": array of strings

Respond ONLY with valid JSON matching the structure.
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"},
        }

        try:
            resp = requests.post(url, json=payload, timeout=8)
            latency = int((time.time() - start_time) * 1000)

            if resp.status_code == 200:
                data = resp.json()
                raw_text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
                parsed = json.loads(raw_text)
                phases = parsed.get("phases", parsed if isinstance(parsed, list) else None)

                if phases and len(phases) >= 3:
                    # Successfully parsed AI structure
                    AIUsageRecord.objects.create(
                        user=user,
                        provider="gemini",
                        feature="roadmap_generation",
                        model_name="gemini-1.5-flash",
                        prompt_tokens=data.get("usageMetadata", {}).get("promptTokenCount", 0),
                        completion_tokens=data.get("usageMetadata", {}).get("candidatesTokenCount", 0),
                        total_tokens=data.get("usageMetadata", {}).get("totalTokenCount", 0),
                        status="success",
                        latency_ms=latency,
                    )
                    return phases
            # API responded with non-200 or unexpected payload
            AIUsageRecord.objects.create(
                user=user,
                provider="gemini",
                feature="roadmap_generation",
                model_name="gemini-1.5-flash",
                status="fallback",
                latency_ms=latency,
                error_message=f"Gemini API returned status {resp.status_code}: {resp.text[:200]}",
            )
        except Exception as exc:
            latency = int((time.time() - start_time) * 1000)
            logger.warning("Gemini API call failed, using deterministic engine: %s", exc)
            AIUsageRecord.objects.create(
                user=user,
                provider="gemini",
                feature="roadmap_generation",
                model_name="gemini-1.5-flash",
                status="fallback",
                latency_ms=latency,
                error_message=str(exc)[:500],
            )

    # Deterministic domain engine fallback
    start_time = time.time()
    phases = fallback_generator(
        role=role,
        language=language,
        framework=framework,
        database=database,
        salary_tier=target_salary or "Flexible Salary Tier",
        custom_role=custom_role,
    )
    latency = int((time.time() - start_time) * 1000)

    AIUsageRecord.objects.create(
        user=user,
        provider="builtin_engine",
        feature="roadmap_generation",
        model_name="deterministic-curriculum-v1",
        status="success",
        latency_ms=latency,
    )

    return phases
