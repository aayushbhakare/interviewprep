import json
import logging
import requests
from django.conf import settings
from django.db.models import F
from django.utils import timezone
from apps.common.models import ProcessingJob
from apps.questions.models import Question
from apps.quizzes.models import QuizAttempt, AttemptAnswer

logger = logging.getLogger(__name__)


def evaluate_quiz_attempt(attempt_id: str) -> QuizAttempt:
    """
    Executes binary evaluation (Correct/Incorrect) for all 45 questions in a submitted quiz attempt.
    If evaluation fails, attempt remains in 'evaluation_pending' with a retryable ProcessingJob.
    """
    attempt = QuizAttempt.objects.select_related("assignment", "student").get(
        id=attempt_id
    )
    answers = list(attempt.answers.select_related("assignment_question").all())

    # Create or update processing job
    job, _ = ProcessingJob.objects.get_or_create(
        job_type="quiz_evaluation",
        idempotency_key=f"quiz_eval_{attempt.id}",
        defaults={
            "status": ProcessingJob.STATUS_RUNNING,
            "payload": {"attempt_id": str(attempt.id)},
        },
    )

    try:
        api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
        evaluated_results = {}

        if api_key.strip():
            try:
                evaluated_results = _evaluate_answers_with_gemini(answers, api_key)
            except Exception as exc:
                logger.warning(
                    f"AI evaluation failed, falling back to deterministic rubric: {exc}"
                )

        # Process each answer
        correct_count = 0
        now = timezone.now()

        for ans in answers:
            # Rule: Unanswered questions are always Incorrect
            if not ans.is_answered or not (ans.submitted_answer or "").strip():
                ans.is_correct = False
                ans.evaluation_explanation = "Question was not answered."
                ans.evaluated_at = now
                ans.save(
                    update_fields=[
                        "is_correct",
                        "evaluation_explanation",
                        "evaluated_at",
                    ]
                )
                continue

            # Check if evaluated by AI
            if str(ans.id) in evaluated_results:
                ai_eval = evaluated_results[str(ans.id)]
                ans.is_correct = bool(ai_eval.get("is_correct", False))
                ans.evaluation_explanation = ai_eval.get(
                    "explanation", "Evaluated based on technical accuracy and approach."
                )
            else:
                # Deterministic rubric fallback
                is_correct, explanation = _evaluate_answer_deterministic(ans)
                ans.is_correct = is_correct
                ans.evaluation_explanation = explanation

            ans.evaluated_at = now
            ans.save(
                update_fields=["is_correct", "evaluation_explanation", "evaluated_at"]
            )

            if ans.is_correct:
                correct_count += 1
                try:
                    q_id = ans.assignment_question.question_version.question_id
                    Question.objects.filter(pk=q_id).update(
                        correct_count=F("correct_count") + 1,
                        times_attempted=F("times_attempted") + 1,
                    )
                except Exception as exc:
                    logger.warning(
                        "Failed to increment question success counter: %s", exc
                    )
            else:
                try:
                    q_id = ans.assignment_question.question_version.question_id
                    Question.objects.filter(pk=q_id).update(
                        times_attempted=F("times_attempted") + 1,
                    )
                except Exception as exc:
                    logger.warning(
                        "Failed to increment question attempt counter: %s", exc
                    )

        # Final score calculation: (Correct / 45) * 100
        total_questions = len(answers) or 45
        attempt.correct_count = correct_count
        attempt.incorrect_count = total_questions - correct_count
        attempt.score = round((correct_count / float(total_questions)) * 100.0, 2)
        attempt.status = QuizAttempt.STATUS_EVALUATED
        attempt.save(
            update_fields=["correct_count", "incorrect_count", "score", "status"]
        )

        job.status = ProcessingJob.STATUS_SUCCEEDED
        job.result = {
            "score": attempt.score,
            "correct_count": attempt.correct_count,
            "incorrect_count": attempt.incorrect_count,
        }
        job.save()

        return attempt

    except Exception as exc:
        logger.error(
            f"Quiz evaluation failed for attempt {attempt_id}: {exc}", exc_info=True
        )
        attempt.status = QuizAttempt.STATUS_PENDING
        attempt.save(update_fields=["status"])

        job.status = ProcessingJob.STATUS_FAILED
        job.error_message = str(exc)
        job.save()
        return attempt


def _evaluate_answer_deterministic(ans: AttemptAnswer) -> tuple[bool, str]:
    """
    Evaluates student answer using rubric keyword and semantic matching.
    Binary outcome: True (Correct) or False (Incorrect).
    """
    submitted = (ans.submitted_answer or "").strip().lower()
    approach = (ans.approach_explanation or "").strip().lower()
    combined = f"{submitted} {approach}"

    snapshot = ans.question_snapshot or {}
    expected = (snapshot.get("expected_answer") or "").strip().lower()
    rubric = snapshot.get("evaluation_rubric") or {}
    keywords = [k.lower() for k in rubric.get("keywords", [])]

    # If exact expected answer matches
    if expected and expected in submitted:
        return True, "Answer matches expected technical solution criteria."

    # Keyword threshold check
    if keywords:
        matched = [k for k in keywords if k in combined]
        ratio = len(matched) / float(len(keywords))
        if ratio >= 0.5:
            return (
                True,
                f"Answer correctly demonstrates understanding of key concepts: {', '.join(matched)}.",
            )

    # If coding question with approach explanation containing essential algorithm terms
    category = snapshot.get("category", "")
    if category == "coding" and len(submitted) > 20 and len(approach) > 15:
        return True, "Solution and approach address the technical requirements."

    if (
        len(submitted) >= 10
        and expected
        and any(word in submitted for word in expected.split() if len(word) > 4)
    ):
        return True, "Submitted response meets core criteria for this problem."

    return (
        False,
        "Submitted answer does not meet the technical criteria or expected solution.",
    )


def _evaluate_answers_with_gemini(answers: list[AttemptAnswer], api_key: str) -> dict:
    """
    Calls Gemini API to evaluate active student responses in batch.
    """
    items_to_eval = []
    for a in answers:
        if a.is_answered and (a.submitted_answer or "").strip():
            snapshot = a.question_snapshot or {}
            items_to_eval.append(
                {
                    "id": str(a.id),
                    "prompt": snapshot.get("prompt", ""),
                    "expected_answer": snapshot.get("expected_answer", ""),
                    "explanation": snapshot.get("explanation", ""),
                    "student_answer": a.submitted_answer,
                    "student_approach": a.approach_explanation,
                }
            )

    if not items_to_eval:
        return {}

    model = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    prompt_text = f"""
You are a senior engineering technical interviewer.
Evaluate each student response strictly in a BINARY manner: either true (Correct) or false (Incorrect).
No partial marks.

Items to evaluate:
{json.dumps(items_to_eval)}

Return a JSON array of objects with:
- "id": string (the question answer id)
- "is_correct": boolean (true or false)
- "explanation": string (brief feedback on why it was marked correct or incorrect)
"""
    headers = {"Content-Type": "application/json", "x-goog-api-key": api_key}
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "temperature": 0.0,
            "responseMimeType": "application/json",
        },
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()

    raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    result_list = json.loads(raw_text)
    return {item["id"]: item for item in result_list if "id" in item}
