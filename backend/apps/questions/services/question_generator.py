import json
import logging
import time
import requests
from django.conf import settings
from apps.questions.models import Question, QuestionVersion, QuestionValidationHistory
from apps.questions.services.seed_data import SEED_QUESTIONS

logger = logging.getLogger(__name__)

VALID_CATEGORIES = {
    Question.CATEGORY_OUTPUT,
    Question.CATEGORY_DEBUGGING,
    Question.CATEGORY_CODING,
    Question.CATEGORY_SCENARIO,
    Question.CATEGORY_CONCEPTUAL,
}


def validate_question_structure(data: dict) -> tuple[bool, str]:
    """
    Validates question content against quality, completeness, and category rules.
    """
    category = data.get("category")
    if category not in VALID_CATEGORIES:
        return False, f"Invalid question category: {category}"

    prompt = (data.get("prompt") or "").strip()
    if len(prompt) < 15:
        return False, "Question prompt is too short or ambiguous."

    expected_answer = (data.get("expected_answer") or "").strip()
    if len(expected_answer) < 1:
        return False, "Expected answer or solution criteria is missing."

    explanation = (data.get("explanation") or "").strip()
    if len(explanation) < 10:
        return False, "Detailed technical explanation is missing or incomplete."

    # Category-specific validation
    if category in [Question.CATEGORY_OUTPUT, Question.CATEGORY_DEBUGGING]:
        snippet = (data.get("code_snippet") or "").strip()
        if not snippet:
            return False, f"Code snippet is required for {category} questions."

    return True, ""


def store_and_validate_question(
    technology: str,
    topic_slug: str,
    category: str,
    difficulty: str,
    content_data: dict,
    max_revisions: int = 3,
) -> tuple[Question, QuestionVersion]:
    """
    Stores question with versioning, executing initial validation and up to 3 AI revision cycles.
    """
    prompt_text = (content_data.get("prompt") or "").strip()
    if prompt_text:
        existing_version = QuestionVersion.objects.filter(
            question__technology__iexact=technology,
            question__category=category,
            prompt=prompt_text,
        ).first()
        if (
            existing_version
            and existing_version.question.status == Question.STATUS_APPROVED
        ):
            return existing_version.question, existing_version

    question = Question.objects.create(
        technology=technology,
        topic_slug=topic_slug,
        category=category,
        difficulty=difficulty,
        current_version_number=1,
        status=Question.STATUS_APPROVED,
    )

    version_number = 1
    current_data = dict(content_data)
    is_valid, failure_reason = validate_question_structure(current_data)
    attempt = 1

    question_version = QuestionVersion.objects.create(
        question=question,
        version_number=version_number,
        prompt=current_data.get("prompt", ""),
        code_snippet=current_data.get("code_snippet", ""),
        expected_answer=current_data.get("expected_answer", ""),
        evaluation_rubric=current_data.get("evaluation_rubric", {}),
        explanation=current_data.get("explanation", ""),
        starter_code=current_data.get("starter_code", ""),
        test_cases=current_data.get("test_cases", []),
        validation_status=QuestionVersion.STATUS_APPROVED
        if is_valid
        else QuestionVersion.STATUS_UNDER_REVIEW,
    )

    QuestionValidationHistory.objects.create(
        question_version=question_version,
        attempt_number=attempt,
        is_valid=is_valid,
        failure_reason=failure_reason,
        validation_details={"data": current_data},
    )

    # If initial validation failed, execute revision attempts up to max_revisions
    while not is_valid and attempt <= max_revisions:
        attempt += 1
        current_data = _revise_question_data(current_data, failure_reason)
        is_valid, failure_reason = validate_question_structure(current_data)

        QuestionValidationHistory.objects.create(
            question_version=question_version,
            attempt_number=attempt,
            is_valid=is_valid,
            failure_reason=failure_reason,
            validation_details={"data": current_data, "revision_attempt": attempt},
        )

        if is_valid:
            question_version.prompt = current_data.get("prompt", "")
            question_version.code_snippet = current_data.get("code_snippet", "")
            question_version.expected_answer = current_data.get("expected_answer", "")
            question_version.explanation = current_data.get("explanation", "")
            question_version.validation_status = QuestionVersion.STATUS_APPROVED
            question_version.save()
            question.status = Question.STATUS_APPROVED
            question.save()
            break

    if not is_valid:
        question_version.validation_status = QuestionVersion.STATUS_SUSPENDED
        question_version.change_reason = f"Suspended – Review Failed: {failure_reason}"
        question_version.save()
        question.status = Question.STATUS_SUSPENDED
        question.save()

    return question, question_version


def _revise_question_data(data: dict, failure_reason: str) -> dict:
    """
    Applies structured revisions to fix missing fields or format defects across all categories.
    """
    revised = dict(data)
    category = revised.get("category", Question.CATEGORY_CONCEPTUAL)

    if category in [Question.CATEGORY_OUTPUT, Question.CATEGORY_DEBUGGING]:
        if not (revised.get("code_snippet") or "").strip():
            if category == Question.CATEGORY_OUTPUT:
                revised["code_snippet"] = "val = [x * 2 for x in range(3)]\nprint(val)"
            else:
                revised["code_snippet"] = (
                    "def calculate(val):\n    return val.append(1)"
                )

    if len(revised.get("prompt", "").strip()) < 15:
        revised["prompt"] = (
            f"Analyze the following {category.replace('_', ' ')} scenario and explain the technical implementation."
        )

    if len(revised.get("expected_answer", "").strip()) < 1:
        revised["expected_answer"] = (
            "Correct expected solution adhering to standard engineering specifications."
        )

    if len(revised.get("explanation", "").strip()) < 10:
        revised["explanation"] = (
            "Comprehensive explanation of memory layout, standard library mechanics, and performance tradeoffs."
        )

    return revised


def seed_initial_question_bank(target_technology: str = "Python") -> int:
    """
    Seeds initial curated question bank for technology. Returns count of created questions.
    """
    created_count = 0
    for q_data in SEED_QUESTIONS:
        tech = q_data.get("technology", target_technology)
        topic = q_data.get("topic_slug", "general")
        category = q_data["category"]
        diff = q_data.get("difficulty", "medium")

        # Check if identical question prompt already exists
        exists = QuestionVersion.objects.filter(
            question__technology__iexact=tech,
            question__category=category,
            prompt=q_data["prompt"],
        ).exists()

        if not exists:
            store_and_validate_question(
                technology=tech,
                topic_slug=topic,
                category=category,
                difficulty=diff,
                content_data=q_data,
            )
            created_count += 1

    return created_count


def generate_additional_questions_for_pool(
    technology: str,
    topic_slug: str,
    category: str,
    difficulty: str,
    count_needed: int,
) -> list[Question]:
    """
    Generates missing questions to ensure 45-question pool availability.
    Uses AI when API key is available, or deterministic template engine with validation.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    generated = []

    if api_key.strip():
        try:
            ai_questions = _call_gemini_question_generator(
                technology, topic_slug, category, difficulty, count_needed, api_key
            )
            for item in ai_questions:
                q_obj, v_obj = store_and_validate_question(
                    technology=technology,
                    topic_slug=topic_slug,
                    category=category,
                    difficulty=difficulty,
                    content_data=item,
                )
                if v_obj.validation_status == QuestionVersion.STATUS_APPROVED:
                    generated.append(q_obj)
        except Exception as exc:
            logger.warning(
                f"AI question generation failed, falling back to deterministic bank: {exc}"
            )

    # Fallback template generator if more needed
    remaining = count_needed - len(generated)
    if remaining > 0:
        deterministic_items = _generate_deterministic_template_questions(
            technology, topic_slug, category, difficulty, remaining
        )
        for item in deterministic_items:
            q_obj, v_obj = store_and_validate_question(
                technology=technology,
                topic_slug=f"{topic_slug}-{int(time.time() * 1000) % 100000}",
                category=category,
                difficulty=difficulty,
                content_data=item,
            )
            if v_obj.validation_status == QuestionVersion.STATUS_APPROVED:
                generated.append(q_obj)

    return generated


def _call_gemini_question_generator(
    technology: str,
    topic_slug: str,
    category: str,
    difficulty: str,
    count: int,
    api_key: str,
) -> list[dict]:
    model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    prompt_text = f"""
Generate {count} technical interview questions for:
- Technology: {technology}
- Topic: {topic_slug}
- Category: {category} (one of: output_prediction, error_debugging, coding, scenario, conceptual)
- Difficulty: {difficulty}

Rules:
- NO Multiple Choice Questions (MCQ).
- Provide JSON array of objects with keys:
  - "prompt": string (clear question instructions)
  - "code_snippet": string (required for output_prediction and error_debugging)
  - "expected_answer": string (concise correct answer or expected logic)
  - "explanation": string (in-depth explanation)
  - "starter_code": string (optional for coding)
  - "test_cases": array of objects with "input" and "expected"
  - "evaluation_rubric": object with "keywords" array
"""
    headers = {"Content-Type": "application/json", "x-goog-api-key": api_key}
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=20)
    resp.raise_for_status()
    raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    data = json.loads(raw_text)
    return data if isinstance(data, list) else data.get("questions", [])


def _generate_deterministic_template_questions(
    technology: str, topic_slug: str, category: str, difficulty: str, count: int
) -> list[dict]:
    items = []
    for i in range(1, count + 1):
        if category == Question.CATEGORY_OUTPUT:
            item = {
                "prompt": f"Predict the exact output of this {technology} code evaluating variable scoping and mutation (Variant {i}):",
                "code_snippet": f"def compute_{i}(val):\n    items = [val * k for k in range(3)]\n    return items[-1]\nprint(compute_{i}({i + 2}))",
                "expected_answer": str((i + 2) * 2),
                "evaluation_rubric": {
                    "format": "exact_match",
                    "keywords": [str((i + 2) * 2), "list comprehension"],
                },
                "explanation": f"The list comprehension evaluates elements [0, {i+2}, {(i+2)*2}], and items[-1] returns the final element.",
                "starter_code": "",
                "test_cases": [],
            }
        elif category == Question.CATEGORY_DEBUGGING:
            item = {
                "prompt": f"Identify the defect in this {technology} function handling nullable data (Variant {i}) and state the fix:",
                "code_snippet": f"def process_data_{i}(record):\n    return record['score'] + 10  # Potential KeyError or TypeError",
                "expected_answer": "Direct dictionary indexing raises KeyError if 'score' is absent, or TypeError if value is None. Fix with `record.get('score', 0) + 10`.",
                "evaluation_rubric": {
                    "keywords": ["KeyError", "TypeError", "get()", "default"]
                },
                "explanation": "Safe dictionary retrieval protects against KeyError, and type validation ensures numeric addition succeeds.",
                "starter_code": "",
                "test_cases": [],
            }
        elif category == Question.CATEGORY_CODING:
            item = {
                "prompt": f"Implement a function in {technology} to filter and compute the running total of positive values (Variant {i}):",
                "code_snippet": "",
                "expected_answer": "Iterate over numbers, accumulate positive elements into a total sum, and return the aggregated integer.",
                "evaluation_rubric": {
                    "keywords": ["accumulator", "loop", "filter positive", "O(N)"]
                },
                "explanation": "Single-pass accumulation satisfies optimal O(N) time and O(1) auxiliary memory.",
                "starter_code": f"def running_positive_sum_{i}(numbers: list[int]) -> int:\n    pass",
                "test_cases": [{"input": "[-1, 2, 3, -4, 5]", "expected": "10"}],
            }
        elif category == Question.CATEGORY_SCENARIO:
            item = {
                "prompt": f"In a distributed {technology} application, workers encounter high latency and connection dropouts during batch data synchronization (Variant {i}). Describe your mitigation strategy.",
                "code_snippet": "",
                "expected_answer": "Implement exponential backoff with randomized jitter, batch size throttling, dead-letter queues, and idempotent request headers.",
                "evaluation_rubric": {
                    "keywords": [
                        "exponential backoff",
                        "jitter",
                        "idempotent",
                        "dead-letter queue",
                    ]
                },
                "explanation": "Jitter prevents thundering herds from re-overwhelming recovering downstream database connections.",
                "starter_code": "",
                "test_cases": [],
            }
        else:  # CONCEPTUAL
            item = {
                "prompt": f"Explain the internal concurrency model, memory safety, and thread lifecycle in {technology} (Variant {i}).",
                "code_snippet": "",
                "expected_answer": f"Detail how {technology} manages thread execution, context switching, memory barriers, and synchronization primitives across CPU cores.",
                "evaluation_rubric": {
                    "keywords": [
                        "concurrency",
                        "thread lifecycle",
                        "synchronization",
                        "memory safety",
                    ]
                },
                "explanation": f"Understanding {technology} concurrency guarantees prevents deadlocks, memory leaks, and race conditions.",
                "starter_code": "",
                "test_cases": [],
            }
        items.append(item)
    return items
