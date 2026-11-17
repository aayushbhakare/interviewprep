import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any
from django.conf import settings
from apps.ai_services.models import AIUsageRecord

logger = logging.getLogger(__name__)


# Standard Curated Question Matrix by Role & Type
ROLE_TECHNICAL_QUESTIONS: dict[str, list[dict[str, Any]]] = {
    "Backend Developer": [
        {
            "topic": "API Design & Protocols",
            "question_text": "How do you design an idempotent RESTful endpoint for processing financial transactions or order checkouts?",
            "expected_aspects": [
                "idempotency keys",
                "HTTP PUT vs POST",
                "database unique constraints",
                "two-phase commits",
            ],
        },
        {
            "topic": "Database Indexing & Query Optimization",
            "question_text": "Explain the difference between a B-Tree index and a Hash index. How would you diagnose a query that has suddenly become slow in production?",
            "expected_aspects": [
                "EXPLAIN ANALYZE",
                "sequential scan vs index scan",
                "range queries",
                "cardinality",
                "vacuuming",
            ],
        },
        {
            "topic": "Concurrency & State Management",
            "question_text": "In a distributed backend environment, how do you prevent race conditions when two concurrent requests update the same account balance?",
            "expected_aspects": [
                "optimistic vs pessimistic locking",
                "SELECT FOR UPDATE",
                "distributed locks",
                "Redis",
                "atomic operations",
            ],
        },
        {
            "topic": "Caching Strategies",
            "question_text": "What caching strategies do you apply to handle sudden read traffic spikes, and how do you prevent cache stampede or thundering herd problems?",
            "expected_aspects": [
                "Cache-Aside",
                "Write-Through",
                "TTL jitter",
                "mutex locking",
                "probabilistic early expiration",
            ],
        },
        {
            "topic": "Architecture & Resiliency",
            "question_text": "How do you implement graceful degradation and circuit breakers when a critical third-party payment gateway starts timing out?",
            "expected_aspects": [
                "Circuit Breaker pattern",
                "fallback states",
                "exponential backoff",
                "dead-letter queues",
                "timeouts",
            ],
        },
    ],
    "Frontend Developer": [
        {
            "topic": "Rendering & Performance",
            "question_text": "Explain how the browser rendering pipeline works from HTML parsing to composite layers. How do you optimize Core Web Vitals like LCP and CLS?",
            "expected_aspects": [
                "DOM/CSSOM",
                "reflow/repaint",
                "critical rendering path",
                "image lazy-loading",
                "content-visibility",
            ],
        },
        {
            "topic": "State Management & React Internals",
            "question_text": "How does React's Reconciliation and Virtual DOM diffing work under the hood? When does re-rendering cause performance degradation, and how do you mitigate it?",
            "expected_aspects": [
                "Fiber tree",
                "useMemo",
                "useCallback",
                "memo",
                "immutable state",
                "batching",
            ],
        },
        {
            "topic": "Asynchronous Data & Caching",
            "question_text": "How do you handle race conditions in UI data fetching when a user rapidly toggles between different filter tabs or search queries?",
            "expected_aspects": [
                "AbortController",
                "cleanup functions",
                "stale-while-revalidate",
                "debounce",
                "TanStack Query",
            ],
        },
        {
            "topic": "Security & Storage",
            "question_text": "Compare storing authentication tokens in localStorage vs httpOnly Secure SameSite cookies. How do you guard against XSS and CSRF attacks?",
            "expected_aspects": [
                "XSS injection",
                "CSRF tokens",
                "SameSite attribute",
                "Content Security Policy",
                "httpOnly",
            ],
        },
        {
            "topic": "Component Architecture",
            "question_text": "How do you design a reusable, accessible design-system component, such as an accessible modal dialog or autocomplete dropdown?",
            "expected_aspects": [
                "WAI-ARIA roles",
                "focus trap",
                "keyboard navigation",
                "portal rendering",
                "headless UI",
            ],
        },
    ],
    "Full Stack Developer": [
        {
            "topic": "End-to-End System Integration",
            "question_text": "Walk me through the complete lifecycle of a secure user login request from the frontend form submission to database token issuance and session hydration.",
            "expected_aspects": [
                "TLS handshake",
                "CORS preflight",
                "password hashing with bcrypt/argon2",
                "JWT signing",
                "cookie flags",
            ],
        },
        {
            "topic": "Database Architecture",
            "question_text": "When would you choose a relational schema with foreign key constraints versus a document-oriented NoSQL model for a high-growth platform?",
            "expected_aspects": [
                "ACID compliance",
                "normalization",
                "read vs write throughput",
                "schema evolution",
                "relational joins",
            ],
        },
        {
            "topic": "Real-time Communication",
            "question_text": "Compare WebSockets, Server-Sent Events (SSE), and Short/Long Polling. How would you choose between them for a live collaborative dashboard?",
            "expected_aspects": [
                "bi-directional vs uni-directional",
                "connection overhead",
                "HTTP/2 multiplexing",
                "reconnection logic",
            ],
        },
        {
            "topic": "Debugging & Production Monitoring",
            "question_text": "A user reports that clicking a 'Checkout' button occasionally fails with a 504 Gateway Timeout error. How do you isolate and debug this across frontend, API gateway, and database layers?",
            "expected_aspects": [
                "distributed tracing",
                "correlation IDs",
                "gateway timeouts",
                "slow query logs",
                "connection pools",
            ],
        },
        {
            "topic": "Scalability & Background Processing",
            "question_text": "How do you architect background task processing for asynchronous workloads like PDF generation or bulk emails without blocking web workers?",
            "expected_aspects": [
                "message broker",
                "worker queues",
                "idempotent retry",
                "monitoring",
                "rate limiting",
            ],
        },
    ],
}

HR_QUESTIONS: list[dict[str, Any]] = [
    {
        "topic": "Professional Introduction & Trajectory",
        "question_text": "Please introduce yourself, highlighting your educational background, core technical strengths, and what drove you to pursue this engineering career.",
        "expected_aspects": [
            "concise journey",
            "passion for problem solving",
            "relevant projects",
            "career purpose",
        ],
    },
    {
        "topic": "Team Collaboration & Conflict Resolution",
        "question_text": "Describe a scenario where you had a strong disagreement with a teammate, peer, or manager regarding a technical approach or deadline. How did you handle it?",
        "expected_aspects": [
            "listening to opposing views",
            "data-driven decisions",
            "professional composure",
            "constructive resolution",
        ],
    },
    {
        "topic": "Failure, Learning & Resilience",
        "question_text": "Tell me about a challenging project or technical problem where things did not go as planned. What was the mistake, how did you respond, and what did you learn?",
        "expected_aspects": [
            "accountability",
            "root cause identification",
            "adaptive problem solving",
            "continuous growth",
        ],
    },
    {
        "topic": "Prioritization Under Pressure",
        "question_text": "How do you manage your time and prioritize tasks when faced with conflicting deadlines, unexpected production bugs, and incomplete specifications?",
        "expected_aspects": [
            "impact vs urgency",
            "proactive stakeholder communication",
            "breaking down work",
            "maintaining quality",
        ],
    },
    {
        "topic": "Career Motivation & Workplace Readiness",
        "question_text": "What specific factors motivate you to excel in this role, and where do you envision your professional engineering growth over the next 2 to 3 years?",
        "expected_aspects": [
            "long-term alignment",
            "learning mindset",
            "delivering business value",
            "professional readiness",
        ],
    },
]


class BaseInterviewProvider(ABC):
    @abstractmethod
    def generate_questions(
        self,
        interview_type: str,
        role: str,
        experience_level: str,
        salary_range: str,
        language: str = "",
        framework: str = "",
        database: str = "",
        resume_snapshot: dict | None = None,
        round_type: str | None = None,
    ) -> list[dict[str, Any]]:
        pass

    @abstractmethod
    def process_turn(
        self,
        interview_type: str,
        role: str,
        experience_level: str,
        salary_range: str,
        tech_stack: dict,
        questions: list[dict[str, Any]],
        current_question_index: int,
        student_speech: str,
        turns_history: list[dict[str, Any]],
        resume_snapshot: dict | None = None,
    ) -> dict[str, Any]:
        pass

    @abstractmethod
    def evaluate_session(
        self,
        interview_type: str,
        role: str,
        experience_level: str,
        salary_range: str,
        tech_stack: dict,
        questions: list[dict[str, Any]],
        turns_history: list[dict[str, Any]],
        resume_snapshot: dict | None = None,
    ) -> dict[str, Any]:
        pass


class DeterministicVoiceProvider(BaseInterviewProvider):
    """
    Deterministic offline conversational provider ensuring ₹0 budget,
    instant latency, and complete test suite reproducibility.
    """

    def generate_questions(
        self,
        interview_type: str,
        role: str,
        experience_level: str,
        salary_range: str,
        language: str = "",
        framework: str = "",
        database: str = "",
        resume_snapshot: dict | None = None,
        round_type: str | None = None,
    ) -> list[dict[str, Any]]:
        if interview_type == "hr" or round_type == "hr":
            return [dict(q) for q in HR_QUESTIONS]

        # Use role-specific technical questions, fallback to Backend Developer
        pool = ROLE_TECHNICAL_QUESTIONS.get(
            role, ROLE_TECHNICAL_QUESTIONS["Backend Developer"]
        )
        questions = [dict(q) for q in pool]

        # Adapt questions based on specified tech stack
        if language and len(questions) > 0:
            questions[0]["question_text"] = (
                f"In {language}, how does memory management and garbage collection operate under heavy load?"
            )
            questions[0]["topic"] = f"{language} Runtime & Memory"

        if framework and len(questions) > 1:
            questions[1]["question_text"] = (
                f"How do you structure middlewares, dependency injection, and state handling in {framework} for production stability?"
            )
            questions[1]["topic"] = f"{framework} Architecture"

        if database and len(questions) > 2:
            questions[2]["question_text"] = (
                f"In {database}, how do transaction isolation levels (Read Committed vs Serializable) affect write locks and consistency?"
            )
            questions[2]["topic"] = f"{database} Concurrency & ACID"

        # If a resume project is present, tailor question 5 to project experience
        if (
            resume_snapshot
            and resume_snapshot.get("original_filename")
            and len(questions) > 4
        ):
            questions[4]["question_text"] = (
                "Looking at your technical experience, describe the most complex architectural decision you made in a recent project and how you validated it."
            )
            questions[4]["topic"] = "Project Architecture & Trade-offs"

        return questions

    def process_turn(
        self,
        interview_type: str,
        role: str,
        experience_level: str,
        salary_range: str,
        tech_stack: dict,
        questions: list[dict[str, Any]],
        current_question_index: int,
        student_speech: str,
        turns_history: list[dict[str, Any]],
        resume_snapshot: dict | None = None,
    ) -> dict[str, Any]:
        text = (student_speech or "").strip()
        lower = text.lower()

        # Check for verbal clarification / repeat requests
        repeat_patterns = [
            "repeat",
            "clarify",
            "say that again",
            "pardon",
            "could you explain",
            "what do you mean",
        ]
        if any(p in lower for p in repeat_patterns):
            curr_q = (
                questions[current_question_index]["question_text"]
                if current_question_index < len(questions)
                else ""
            )
            return {
                "interviewer_speech": f"Certainly. To clarify the question: {curr_q}. Please share your thoughts on the core concepts and design decisions involved.",
                "status": "clarification",
                "next_question_index": current_question_index,
                "is_completed": False,
            }

        # Check for admission of not knowing
        idk_patterns = [
            "i don't know",
            "i do not know",
            "not sure",
            "no idea",
            "pass",
            "skip",
            "haven't worked with",
            "not familiar",
        ]
        is_idk = any(p in lower for p in idk_patterns)

        # Count how many follow-ups for this current question index have occurred
        recent_turns_for_q = [
            t
            for t in turns_history
            if t.get("question_index") == current_question_index
            and t.get("role") == "interviewer"
        ]
        follow_up_count = len(recent_turns_for_q)

        # If student said "I don't know" or has already answered a follow-up, advance to next question
        should_advance = is_idk or follow_up_count >= 1 or len(text.split()) >= 30

        if should_advance:
            next_idx = current_question_index + 1
            if next_idx >= len(questions):
                return {
                    "interviewer_speech": "Thank you for sharing your perspective throughout this session. That completes all our questions for this round. I will now compile your evaluation report.",
                    "status": "completed",
                    "next_question_index": next_idx,
                    "is_completed": True,
                }
            next_q = questions[next_idx]["question_text"]
            ack = (
                "Understood, thank you. Let's move on to the next topic."
                if not is_idk
                else "No problem at all, let's explore another area."
            )
            return {
                "interviewer_speech": f"{ack} {next_q}",
                "status": "next_question",
                "next_question_index": next_idx,
                "is_completed": False,
            }

        # Otherwise, ask a targeted follow-up probing question
        curr_q_obj = questions[current_question_index]
        aspects = curr_q_obj.get(
            "expected_aspects", ["key trade-offs", "operational pitfalls"]
        )
        probe_aspect = aspects[0] if aspects else "the main edge cases"
        return {
            "interviewer_speech": f"That's an interesting point. Could you dive deeper into how you handle {probe_aspect} in that scenario, and what trade-offs you would consider?",
            "status": "follow_up",
            "next_question_index": current_question_index,
            "is_completed": False,
        }

    def evaluate_session(
        self,
        interview_type: str,
        role: str,
        experience_level: str,
        salary_range: str,
        tech_stack: dict,
        questions: list[dict[str, Any]],
        turns_history: list[dict[str, Any]],
        resume_snapshot: dict | None = None,
    ) -> dict[str, Any]:
        student_turns = [
            t
            for t in turns_history
            if t.get("role") == "student" or t.get("speaker") == "student"
        ]
        total_answers = len(student_turns)
        total_words = sum(len(t.get("content", "").split()) for t in student_turns)

        # Analyze depth & engagement
        idk_count = sum(
            1
            for t in student_turns
            if any(
                p in t.get("content", "").lower()
                for p in ["i don't know", "i do not know", "no idea", "pass", "skip"]
            )
        )

        substantive_answers = total_answers - idk_count
        is_pass = substantive_answers >= max(2, int(len(questions) * 0.5)) and (
            total_words >= 35 or len(questions) <= 2
        )

        if is_pass:
            result = "pass"
            summary = (
                f"Candidate demonstrated solid technical readiness for the {role} position ({salary_range} tier). "
                "Responses were articulate, structured, and evidenced practical comprehension of core principles."
            )
        else:
            result = "fail"
            summary = (
                f"Candidate did not meet the expected depth of knowledge required for the {role} position at the {salary_range} compensation level. "
                "Several answers lacked architectural clarity, concrete trade-off reasoning, or necessary technical depth."
            )

        feedback = {
            "overall_result": "PASS" if is_pass else "FAIL",
            "summary": summary,
            "technical_knowledge": (
                "Showed familiarity with key paradigms, though deeper familiarity with system edge cases and performance tuning is recommended."
                if interview_type != "hr"
                else "N/A (HR Behavioral Assessment)"
            ),
            "communication": "Articulate and professional verbal cadence. Maintained clear pacing during responses.",
            "problem_solving": (
                "Applied logical steps when decomposing requirements. Could benefit from presenting structured alternatives before settling on a solution."
            ),
            "key_weaknesses": [
                "Depth in production edge cases and error recovery workflows.",
                "Explaining quantitative performance trade-offs under scale.",
            ],
            "areas_for_improvement": [
                f"Core {role} systems architecture relevant to the {salary_range} benchmark.",
                "Structured answer frameworks (e.g., Problem-Action-Result / STAR method).",
            ],
            "improvement_suggestions": [
                f"Practice explaining architectural trade-offs out loud for {role} systems.",
                "Review failure scenarios and recovery strategies for distributed components.",
                "Structure technical answers by stating assumptions, outlining options, and justifying the selected approach.",
            ],
            "better_approaches": [
                "When asked about distributed state or concurrency, immediately identify the contention point, state your consistency requirement, and contrast optimistic vs pessimistic locking.",
                "For behavioral questions, frame responses using the STAR method (Situation, Task, Action, Result) with quantified business or engineering impact.",
            ],
        }

        return {
            "final_result": result,
            "feedback": feedback,
        }


class GeminiVoiceProvider(BaseInterviewProvider):
    """
    Google Gemini 2.0 Flash provider for live conversational turns and evaluation.
    Gracefully falls back to DeterministicVoiceProvider upon network or quota failure.
    """

    def __init__(self):
        self.fallback = DeterministicVoiceProvider()
        self.api_key = getattr(settings, "GEMINI_API_KEY", "")
        self.model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.0-flash")

    def _call_gemini_json(
        self, prompt: str, feature: str = "interview_turn", user=None
    ) -> dict | None:
        if not self.api_key:
            return None

        import urllib.request
        import urllib.error
        import time

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        headers = {"Content-Type": "application/json", "x-goog-api-key": self.api_key}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.4,
                "responseMimeType": "application/json",
            },
        }

        start_time = time.time()
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                latency_ms = int((time.time() - start_time) * 1000)
                body = json.loads(response.read().decode("utf-8"))
                usage = body.get("usageMetadata", {})
                prompt_tokens = usage.get("promptTokenCount", 0)
                completion_tokens = usage.get("candidatesTokenCount", 0)
                total_tokens = usage.get("totalTokenCount", 0)

                AIUsageRecord.objects.create(
                    user=user,
                    provider="gemini",
                    feature=feature,
                    model_name=self.model_name,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    estimated_cost_usd=(total_tokens / 1_000_000.0) * 0.15,
                    status="success",
                    latency_ms=latency_ms,
                )

                candidates = body.get("candidates", [])
                if candidates:
                    text_content = (
                        candidates[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                    )
                    clean_text = re.sub(
                        r"^```(?:json)?\s*|\s*```$", "", text_content.strip()
                    )
                    return json.loads(clean_text)
        except Exception as exc:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.warning(
                "Gemini API call failed (%s). Falling back to deterministic engine.",
                exc,
            )
            AIUsageRecord.objects.create(
                user=user,
                provider="gemini",
                feature=feature,
                model_name=self.model_name,
                status="failed",
                latency_ms=latency_ms,
                error_message=str(exc)[:500],
            )
        return None

    def generate_questions(
        self,
        interview_type: str,
        role: str,
        experience_level: str,
        salary_range: str,
        language: str = "",
        framework: str = "",
        database: str = "",
        resume_snapshot: dict | None = None,
        round_type: str | None = None,
    ) -> list[dict[str, Any]]:
        prompt = f"""
Generate 5 interview questions for a candidate:
- Interview Type: {interview_type} (Round: {round_type or 'Main'})
- Job Role: {role}
- Experience Level: {experience_level}
- Target Salary Range: {salary_range}
- Technical Stack: Language={language}, Framework={framework}, Database={database}

Return a JSON array of objects with keys:
- "topic": short topic title
- "question_text": concise, professional question statement
- "expected_aspects": array of 3-4 key concepts expected in an answer
"""
        res = self._call_gemini_json(prompt, feature="generate_interview_questions")
        if isinstance(res, list) and len(res) >= 3:
            return res

        return self.fallback.generate_questions(
            interview_type,
            role,
            experience_level,
            salary_range,
            language,
            framework,
            database,
            resume_snapshot,
            round_type,
        )

    def process_turn(
        self,
        interview_type: str,
        role: str,
        experience_level: str,
        salary_range: str,
        tech_stack: dict,
        questions: list[dict[str, Any]],
        current_question_index: int,
        student_speech: str,
        turns_history: list[dict[str, Any]],
        resume_snapshot: dict | None = None,
    ) -> dict[str, Any]:
        curr_q = (
            questions[current_question_index]["question_text"]
            if current_question_index < len(questions)
            else ""
        )
        prompt = f"""
Act as a professional technical interviewer for a candidate:
- Role: {role} ({experience_level}, target compensation: {salary_range})
- Current Question: "{curr_q}"
- Candidate Spoken Answer: "{student_speech}"
- Current Question Index: {current_question_index} of {len(questions)} total questions

Evaluate the answer internally and determine whether to:
1. Ask a short, relevant probing follow-up (if partial answer).
2. Move to next question (if good answer, or student says 'I don't know').
3. Clarify/repeat (if student asked to clarify/repeat).
4. Conclude interview (if last question answered).

Return a JSON object with:
- "interviewer_speech": string (what the interviewer will say aloud to the candidate, professional and concise)
- "status": "follow_up" | "next_question" | "clarification" | "completed"
- "next_question_index": integer
- "is_completed": boolean
"""
        res = self._call_gemini_json(prompt, feature="interview_voice_turn")
        if (
            isinstance(res, dict)
            and "interviewer_speech" in res
            and "next_question_index" in res
        ):
            return res

        return self.fallback.process_turn(
            interview_type,
            role,
            experience_level,
            salary_range,
            tech_stack,
            questions,
            current_question_index,
            student_speech,
            turns_history,
            resume_snapshot,
        )

    def evaluate_session(
        self,
        interview_type: str,
        role: str,
        experience_level: str,
        salary_range: str,
        tech_stack: dict,
        questions: list[dict[str, Any]],
        turns_history: list[dict[str, Any]],
        resume_snapshot: dict | None = None,
    ) -> dict[str, Any]:
        prompt = f"""
Evaluate this completed interview session:
- Role: {role}
- Experience: {experience_level}
- Target Salary: {salary_range}
- Turns transcript: {json.dumps(turns_history[:15])}

Provide a strictly binary overall result: "PASS" or "FAIL".
Return a JSON object with:
- "final_result": "pass" | "fail"
- "feedback":
  - "overall_result": "PASS" | "FAIL"
  - "summary": string
  - "technical_knowledge": string
  - "communication": string
  - "problem_solving": string
  - "key_weaknesses": array of 2-3 strings
  - "areas_for_improvement": array of strings
  - "improvement_suggestions": array of strings
  - "better_approaches": array of strings
"""
        res = self._call_gemini_json(prompt, feature="evaluate_interview_session")
        if isinstance(res, dict) and "final_result" in res and "feedback" in res:
            return res

        return self.fallback.evaluate_session(
            interview_type,
            role,
            experience_level,
            salary_range,
            tech_stack,
            questions,
            turns_history,
            resume_snapshot,
        )


def get_interview_ai_provider() -> BaseInterviewProvider:
    """
    Returns active interview AI provider.
    Uses Gemini when API key is present and configured, otherwise Deterministic engine.
    """
    if getattr(settings, "GEMINI_API_KEY", ""):
        return GeminiVoiceProvider()
    return DeterministicVoiceProvider()
