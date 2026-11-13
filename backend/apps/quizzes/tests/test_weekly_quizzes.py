import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.learning.models import (
    Roadmap,
    RoadmapPhase,
    RoadmapWeek,
    RoadmapTopicReference,
    TopicProgress,
)
from apps.learning.services.progress_service import get_active_roadmap_stats
from apps.quizzes.models import WeeklyQuizAssignment, QuizAttempt
from apps.quizzes.services.quiz_service import (
    prepare_quiz_assignment,
    start_or_resume_quiz_attempt,
    autosave_quiz_answers,
    abandon_quiz_attempt,
    submit_quiz_attempt,
)

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student_user(db):
    user = User.objects.create_user(
        email="test_student_quiz@example.com",
        password="ValidPassword123!",
        is_verified=True,
    )
    return user


@pytest.fixture
def sample_roadmap(db, student_user):
    roadmap = Roadmap.objects.create(
        user=student_user,
        role="Backend Developer",
        experience_level="1-3 years",
        language="Python",
        framework="Django",
        database="PostgreSQL",
        status=Roadmap.STATUS_READY,
        is_active=True,
    )
    phase = RoadmapPhase.objects.create(
        roadmap=roadmap, phase_number=1, title="Core Architecture"
    )
    week = RoadmapWeek.objects.create(
        phase=phase, week_number=1, title="Python Mechanics"
    )

    for i in range(1, 5):
        topic = RoadmapTopicReference.objects.create(
            week=week,
            topic_slug=f"topic-{i}",
            title=f"Topic {i}",
            order=i,
        )
        TopicProgress.objects.create(
            roadmap=roadmap,
            topic=topic,
            status=TopicProgress.STATUS_COMPLETED
            if i <= 2
            else TopicProgress.STATUS_NOT_STARTED,
        )

    return roadmap


@pytest.mark.django_db
def test_prepare_quiz_assignment_exact_45_distribution(sample_roadmap):
    assignment = prepare_quiz_assignment(sample_roadmap, week_number=1)
    assert assignment.status == WeeklyQuizAssignment.STATUS_READY

    questions = list(
        assignment.assignment_questions.select_related(
            "question_version__question"
        ).all()
    )
    assert len(questions) == 45

    # Check exact category counts
    counts = {}
    for q in questions:
        cat = q.category
        counts[cat] = counts.get(cat, 0) + 1

    assert counts.get("output_prediction", 0) == 10
    assert counts.get("error_debugging", 0) == 10
    assert counts.get("coding", 0) == 10
    assert counts.get("scenario", 0) == 10
    assert counts.get("conceptual", 0) == 5


@pytest.mark.django_db
def test_start_or_resume_quiz_attempt(student_user, sample_roadmap):
    # First start: new attempt
    attempt1, resumed1 = start_or_resume_quiz_attempt(
        student_user, sample_roadmap, week_number=1
    )
    assert resumed1 is False
    assert attempt1.attempt_number == 1
    assert attempt1.status == QuizAttempt.STATUS_IN_PROGRESS
    assert attempt1.answers.count() == 45

    # Second start while in progress: resumes existing attempt
    attempt2, resumed2 = start_or_resume_quiz_attempt(
        student_user, sample_roadmap, week_number=1
    )
    assert resumed2 is True
    assert attempt1.id == attempt2.id


@pytest.mark.django_db
def test_autosave_answers_and_refresh_persistence(student_user, sample_roadmap):
    attempt, _ = start_or_resume_quiz_attempt(
        student_user, sample_roadmap, week_number=1
    )
    first_ans = attempt.answers.first()
    qid = str(first_ans.assignment_question.id)

    save_payload = [
        {
            "question_id": qid,
            "submitted_answer": "[10, 20] [10, 20]",
            "approach_explanation": "Default list parameter mutable binding.",
        }
    ]

    result = autosave_quiz_answers(str(attempt.id), student_user, save_payload)
    assert result["is_expired"] is False
    assert result["answered_count"] == 1
    assert result["unanswered_count"] == 44

    # Verify persisted in database
    first_ans.refresh_from_db()
    assert first_ans.is_answered is True
    assert first_ans.submitted_answer == "[10, 20] [10, 20]"


@pytest.mark.django_db
def test_abandon_quiz_attempt(student_user, sample_roadmap):
    attempt, _ = start_or_resume_quiz_attempt(
        student_user, sample_roadmap, week_number=1
    )
    first_ans = attempt.answers.first()
    first_ans.submitted_answer = "Draft answer"
    first_ans.is_answered = True
    first_ans.save()

    abandoned = abandon_quiz_attempt(str(attempt.id), student_user)
    assert abandoned.status == QuizAttempt.STATUS_ABANDONED
    assert abandoned.score is None

    # Answers wiped
    first_ans.refresh_from_db()
    assert first_ans.is_answered is False
    assert first_ans.submitted_answer == ""

    # Abandoned attempt does NOT consume allowance
    new_attempt, resumed = start_or_resume_quiz_attempt(
        student_user, sample_roadmap, week_number=1
    )
    assert resumed is False
    assert (
        new_attempt.attempt_number == 2
    )  # Sequential attempt number 2, while allowance (submitted count) is still 0!


@pytest.mark.django_db
def test_submit_quiz_binary_evaluation_and_roadmap_progress(
    student_user, sample_roadmap
):
    attempt, _ = start_or_resume_quiz_attempt(
        student_user, sample_roadmap, week_number=1
    )

    # Provide correct answer to first question
    first_ans = attempt.answers.first()
    snapshot = first_ans.question_snapshot
    expected = snapshot.get("expected_answer", "")

    first_ans.submitted_answer = expected
    first_ans.approach_explanation = "Correct explanation"
    first_ans.is_answered = True
    first_ans.save()

    # Pre-submission stats: 2 completed topics out of 4 topics
    pre_stats = get_active_roadmap_stats(sample_roadmap)
    assert pre_stats["display_progress"] == "2/4"

    # Submit
    evaluated_attempt = submit_quiz_attempt(str(attempt.id), student_user)
    assert evaluated_attempt.status == QuizAttempt.STATUS_EVALUATED
    assert evaluated_attempt.total_questions == 45
    assert evaluated_attempt.correct_count >= 1
    # Binary score calculation: (correct / 45) * 100
    expected_score = round((evaluated_attempt.correct_count / 45.0) * 100.0, 2)
    assert evaluated_attempt.score == expected_score

    # Unanswered questions were marked Incorrect
    unanswered_records = evaluated_attempt.answers.filter(is_answered=False)
    for u in unanswered_records:
        assert u.is_correct is False
        assert "not answered" in u.evaluation_explanation.lower()

    # Post-submission roadmap stats: increments by exactly 1 milestone!
    # Topics was 4, now total milestones is 4 + 1 = 5, completed is 2 + 1 = 3!
    post_stats = get_active_roadmap_stats(sample_roadmap)
    assert post_stats["display_progress"] == "3/5"
    assert post_stats["submitted_quizzes"] == 1


@pytest.mark.django_db
def test_retake_limit_five_attempts(student_user, sample_roadmap):
    for i in range(5):
        att, _ = start_or_resume_quiz_attempt(
            student_user, sample_roadmap, week_number=1
        )
        submit_quiz_attempt(str(att.id), student_user)

    # 6th attempt start should be rejected with ValidationError
    with pytest.raises(Exception) as exc_info:
        start_or_resume_quiz_attempt(student_user, sample_roadmap, week_number=1)
    assert "Maximum of 5 submitted attempts reached" in str(exc_info.value)


@pytest.mark.django_db
def test_retake_blocked_while_earlier_attempt_pending(student_user, sample_roadmap):
    att, _ = start_or_resume_quiz_attempt(student_user, sample_roadmap, week_number=1)
    att.status = QuizAttempt.STATUS_PENDING
    att.save(update_fields=["status"])

    with pytest.raises(Exception) as exc_info:
        start_or_resume_quiz_attempt(student_user, sample_roadmap, week_number=1)
    assert "An earlier submission is still being evaluated" in str(exc_info.value)
