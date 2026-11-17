from apps.accounts.models import User
from apps.experiences.services.experience_service import ExperienceService


def seed_phase7_experiences():
    student = User.objects.filter(email="e2e_student@interviewprep.local").first()
    if not student:
        student = User.objects.create_user(
            email="e2e_student@interviewprep.local",
            password="E2EPassword123!",
            is_verified=True,
            full_name="Alex Johnson",
        )

    # Experience 1: Razorpay
    exp1 = ExperienceService.save_draft(
        user=student,
        data={
            "company_name": "Razorpay",
            "role": "Backend Platform Engineer",
            "experience_level": "1-3 Years",
            "salary_range": "₹18 - ₹30 LPA",
            "company_location": "Bengaluru, India",
            "recruitment_year": 2025,
            "job_type": "Full-time",
            "interview_mode": "Online",
            "overall_difficulty": "Hard",
            "overall_outcome": "selected",
            "additional_context": "Applied via referral for payments core infrastructure. The interview process spanned 3 weeks with high emphasis on idempotency, transactional consistency, and distributed locks.",
            "is_anonymous": False,
            "stages": [
                {
                    "stage_type": "technical_1",
                    "custom_stage_name": "Machine Coding Round",
                    "order": 1,
                    "interview_mode": "Online",
                    "difficulty": "Hard",
                    "result": "Cleared",
                    "description": "Design and implement an in-memory payment settlement ledger with thread safety.",
                    "questions": [
                        {
                            "question_text": "Implement thread-safe double entry bookkeeping system with ACID guarantees in memory.",
                            "follow_up_text": "How do you handle deadlocks when two concurrent transactions transfer funds between the same accounts in reverse order?",
                            "interviewer_approach": "Looked for ordered resource acquisition (locking accounts by sorted ID) to prevent circular waiting.",
                            "student_response": "Implemented AccountLockManager ordering locks by account ID before acquiring reentrant locks.",
                            "order": 1,
                        }
                    ],
                },
                {
                    "stage_type": "technical_2",
                    "custom_stage_name": "System Design & Distributed Data",
                    "order": 2,
                    "interview_mode": "Online",
                    "difficulty": "Hard",
                    "result": "Cleared",
                    "description": "High-level architecture for high-throughput webhook dispatch system.",
                    "questions": [
                        {
                            "question_text": "Design a webhook delivery service that guarantees at-least-once delivery with exponential backoff retry.",
                            "follow_up_text": "How do you prevent a slow merchant endpoint from blocking the entire dispatch queue?",
                            "interviewer_approach": "Probed partitioned queue architecture, circuit breakers, and rate limiting per subscriber.",
                            "student_response": "Used Kafka with per-tier latency topics and dead letter queues to isolate sluggish consumers.",
                            "order": 1,
                        }
                    ],
                },
            ],
        },
    )
    ExperienceService.publish_experience(student, str(exp1.id))
    exp1.helpful_votes_count = 14
    exp1.save(update_fields=["helpful_votes_count"])

    # Experience 2: Atlassian (Anonymous)
    exp2 = ExperienceService.save_draft(
        user=student,
        data={
            "company_name": "Atlassian",
            "role": "Full Stack Engineer",
            "experience_level": "3-5 Years",
            "salary_range": "₹30+ LPA",
            "company_location": "Remote / Bengaluru",
            "recruitment_year": 2025,
            "job_type": "Full-time",
            "interview_mode": "Online",
            "overall_difficulty": "Hard",
            "overall_outcome": "selected",
            "additional_context": "Rigorous recruitment process emphasizing team collaboration, constructive feedback, and scalable frontend architecture.",
            "is_anonymous": True,
            "stages": [
                {
                    "stage_type": "technical_1",
                    "custom_stage_name": "Data Structures & Algorithms",
                    "order": 1,
                    "interview_mode": "Online",
                    "difficulty": "Medium",
                    "result": "Cleared",
                    "description": "Tree and graph serialization with edge-case handling.",
                    "questions": [
                        {
                            "question_text": "Serialize and deserialize an N-ary tree representing document hierarchy.",
                            "follow_up_text": "How would you optimize payload size for deep collaboration documents?",
                            "interviewer_approach": "Checked clean recursion and BFS serialization format.",
                            "student_response": "Used preorder traversal with sentinel markers and child count indexing.",
                            "order": 1,
                        }
                    ],
                },
                {
                    "stage_type": "hr",
                    "custom_stage_name": "Atlassian Values & Collaboration",
                    "order": 2,
                    "interview_mode": "Online",
                    "difficulty": "Medium",
                    "result": "Cleared",
                    "description": "Deep dive into 'Open company, no bullshit' and handling architectural disputes.",
                    "questions": [
                        {
                            "question_text": "Tell me about a time you strongly disagreed with a senior engineer on technical strategy.",
                            "follow_up_text": "How did you balance team alignment with code quality?",
                            "interviewer_approach": "Looked for empathy, data-driven reasoning, and commitment once decisions were reached.",
                            "student_response": "Described benchmarking POC data and writing an RFC to let empirical results guide consensus.",
                            "order": 1,
                        }
                    ],
                },
            ],
        },
    )
    ExperienceService.publish_experience(student, str(exp2.id))
    exp2.helpful_votes_count = 28
    exp2.save(update_fields=["helpful_votes_count"])

    # Experience 3: PhonePe
    exp3 = ExperienceService.save_draft(
        user=student,
        data={
            "company_name": "PhonePe",
            "role": "Software Engineer",
            "experience_level": "Fresher",
            "salary_range": "₹10 - ₹18 LPA",
            "company_location": "Bengaluru",
            "recruitment_year": 2025,
            "job_type": "Full-time",
            "interview_mode": "Online",
            "overall_difficulty": "Medium",
            "overall_outcome": "awaited",
            "additional_context": "Campus drive recruitment with 2 technical evaluation rounds.",
            "is_anonymous": False,
            "stages": [
                {
                    "stage_type": "aptitude_test",
                    "custom_stage_name": "Coding Assessment",
                    "order": 1,
                    "interview_mode": "Online",
                    "difficulty": "Medium",
                    "result": "Cleared",
                    "description": "3 LeetCode medium questions on arrays, heaps, and dynamic programming.",
                    "questions": [
                        {
                            "question_text": "Find top K frequent elements in a streaming data sequence.",
                            "follow_up_text": "Can we optimize space when vocabulary is unbounded?",
                            "interviewer_approach": "Min-heap of size K vs Count-Min Sketch.",
                            "student_response": "Utilized a bounded min-heap keeping top K elements in O(N log K) time.",
                            "order": 1,
                        }
                    ],
                }
            ],
        },
    )
    ExperienceService.publish_experience(student, str(exp3.id))
    exp3.helpful_votes_count = 9
    exp3.save(update_fields=["helpful_votes_count"])

    print("Phase 7 sample experiences seeded successfully.")


if __name__ == "__main__":
    seed_phase7_experiences()
