# Technical Decisions Log

This log records architecture and technical decisions made during implementation.

---

## Decisions Record

### TD-001: Monorepo Structure
- **Decision:** Use a single monorepo with `frontend/`, `backend/`, and `documentation/` directories.
- **Rationale:** Aligns with PRD and Blueprint architecture; keeps domain contracts and documentation tightly synchronized.

### TD-002: PostgreSQL 18 Local Configuration
- **Decision:** Run PostgreSQL 18 locally on port `5433` (database: `interview_platform`).
- **Rationale:** Avoids conflict with existing host PostgreSQL service on port 5432 while utilizing native Homebrew PostgreSQL 18.4 with trust authentication.

### TD-003: Custom User Model Before Initial Migration
- **Decision:** Define custom `User` model inheriting from `AbstractBaseUser` and `PermissionsMixin` in `apps.accounts` before creating the first migration.
- **Rationale:** Django standard requirement; changing `AUTH_USER_MODEL` later causes catastrophic migration incompatibility.

### TD-004: Standardized API Response Format
- **Decision:** All `/api/v1/` endpoints adhere to `{ "status": "success", "data": ... }` and `{ "status": "error", "error": { "code": ..., "message": ..., "details": ... } }`.
- **Rationale:** Ensures predictability across React frontend services and API consumers.

### TD-005: Job Queue via PostgreSQL `ProcessingJob`
- **Decision:** Background evaluation and generation jobs will be tracked in a database table `ProcessingJob` without introducing Celery or Redis in initial phases.
- **Rationale:** Fulfills ₹0 budget and architectural simplicity constraint while providing robust, inspectable state recovery and idempotency.

### TD-006: External Service Provider Adapters
- **Decision:** All AI, email, and storage services are accessed via abstract interfaces in backend services, with automatic fallbacks for local offline development.
- **Rationale:** Ensures zero unintentional billing, protects against provider outages, and decouples business logic from vendor SDKs.

### TD-007: Dual Connected Roadmaps with Independent Progress Tracking
- **Decision:** Generate both a conceptual Learning Roadmap and a hands-on Practice Roadmap (coding exercises, SQL query problems, debugging tasks, and mini-projects) connected by week and topic references, while maintaining separate progress tracking without auto-completion coupling.
- **Rationale:** Ensures students genuinely write code and solve engineering problems rather than passively reading explanations; prevents false completion metrics.

### TD-008: Strict Non-MCQ Question Formats
- **Decision:** The question bank and weekly quiz system prohibit multiple-choice questions (MCQs), standardizing on 5 active formats: Code Output Prediction, Find Error / Debugging, Coding Problems, Scenario-Based Architecture, Conceptual / Short Answer.
- **Rationale:** Real technical recruitment interviews assess code reasoning, error diagnosis, and architectural thinking rather than guessing from four options.

### TD-009: Binary Evaluation Engine Without Partial Credit
- **Decision:** Weekly quiz questions are evaluated strictly as binary Correct or Incorrect. Unanswered questions are graded Incorrect. Final score is computed strictly as `(Correct / 45) * 100`.
- **Rationale:** Establishes clear, unambiguous technical interview standards and prevents ambiguity in automated evaluation rubrics.

### TD-010: 75-Minute Server-Enforced Timer with Latency Tolerance
- **Decision:** Quiz attempts strictly calculate remaining seconds from `started_at` timestamp on the server. Autosave and submission validate that elapsed time does not exceed 4,500 seconds (+60 seconds network buffer).
- **Rationale:** Prevents client-side clock manipulation while gracefully handling real-world network fluctuations.

### TD-011: Question Version Snapshotting & Safe Attempt Abandonment
- **Decision:** Assignments link to frozen `QuestionVersion` records rather than mutable `Question` records. Abandoning an in-progress quiz deletes attempt answers without consuming one of the 5 allowed submission attempts.
- **Rationale:** Guarantees historical score integrity even if a question is revised in the bank, and permits students to step away without being unfairly penalized.

### TD-012: MCQ Architecture for Aptitude Practice
- **Decision:** While technical weekly quizzes strictly prohibit multiple-choice questions (MCQs), aptitude practice standardizes on 4-option MCQs (A, B, C, D) with exactly one valid option.
- **Rationale:** Standard cognitive fresher recruitment assessments evaluate speed, mental math, and elimination strategies strictly via timed MCQs.

### TD-013: Standardized Fresher Cognitive Assessment Pattern
- **Decision:** Establish a generic fresher cognitive assessment structure and configure platform practice sessions to 45 questions in 60 minutes (15 Quantitative, 15 Logical, 15 Verbal) with 0 negative marking, dynamically configurable by administrators in `AptitudeTestConfig`.
- **Rationale:** Provides realistic, balanced 60-minute training sessions with equal emphasis across all three cognitive pillars (Quantitative Aptitude, Logical Reasoning, Verbal Ability) without being tied to any single company's branding.

### TD-014: Fresher Experience Eligibility Restriction
- **Decision:** Restrict standalone aptitude practice strictly to students with profile or active roadmap experience levels of `"Fresher"` or `"Less than 1 year"`. Experienced candidates (`"1–3 years"`, `"3–5 years"`, `"5+ years"`) are blocked on the backend with 403 Forbidden.
- **Rationale:** Experienced industry recruitment evaluates system design, project impact, and live coding, whereas aptitude screening tests are uniquely required for campus/entry-level freshers.

### TD-015: No PASS/FAIL Verdicts for Standalone Practice Sessions
- **Decision:** Standalone aptitude practice tests **never** issue recruitment PASS/FAIL verdicts. They display overall percentage, accuracy, section breakdowns, and detailed mathematical solutions. PASS/FAIL qualification is strictly reserved for Phase 6 Mixed recruitment simulations using `mixed_qualifying_cutoff`.
- **Rationale:** Standalone practice is a formative self-paced learning tool; imposing recruitment pass/fail verdicts on self-study runs creates unnecessary stress and distorts diagnostic progress.
