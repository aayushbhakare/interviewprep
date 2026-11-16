# Project Status

**Repository:** [https://github.com/aayushbhakare/interviewprep](https://github.com/aayushbhakare/interviewprep)  
**Primary Branch:** `main`  
**Current Phase:** Phase 5 — Aptitude Practice  
**Overall Status:** Phase 0, Phase 1, Phase 2, Phase 3, Phase 4 & Phase 5 Complete & Verified  
**Last Updated:** 2026-11-16  

---

## Phase Checklist

| Phase | Description | Status | Verified Date |
|---|---|---|---|
| **Phase 0** | Project Foundation & Tooling Setup | **Verified** | 2026-11-15 |
| **Phase 1** | Complete Authentication & User Management | **Verified** | 2026-11-15 |
| **Phase 2** | Main Dashboard & Navigation Shell | **Verified** | 2026-11-16 |
| **Phase 3** | Learn Module & Personalized Roadmap | **Verified** | 2026-11-16 |
| **Phase 4** | Shared Question Bank & Weekly Quiz System | **Verified** | 2026-11-16 |
| **Phase 5** | Aptitude Practice | **Verified** | 2026-11-16 |
| **Phase 6** | Share Interview Experience | Not Started | — |
| **Phase 7** | AI Interview Practice (Voice Simulation) | Not Started | — |
| **Phase 8** | Admin Panel & Platform Operations | Not Started | — |
| **Phase 9** | Integration, Hardening & End-to-End Testing | Not Started | — |

---

## Phase 5 Milestones: Complete & Verified

- [x] Shared Aptitude Question Bank Architecture (`apps/aptitude`): Multi-tier MCQ bank across Quantitative Aptitude, Logical Reasoning, and Verbal Ability independent of salary bands, programming languages, or tech stacks.
- [x] Schema & Relational Data Models: `AptitudeQuestion`, `AptitudeQuestionVersion`, `AptitudeQuestionReport`, `AptitudeValidationHistory`, `AptitudeTestConfig`, `AptitudeSession`, `AptitudeSessionQuestion`, `AptitudeSessionAnswer` migrated with PostgreSQL index optimizations.
- [x] TCS NQT Pattern Test Configuration: Researched official TCS iON Cognitive Foundation reference pattern (65 questions, 75 mins: 20 Quant, 20 Logical, 25 Verbal, checked 2026-11-16). Standardized practice configuration: 45 MCQs (15 Quant, 15 Logical, 15 Verbal) in 60 minutes with 0 negative marking, fully admin-configurable.
- [x] Question Generation & Revision Engine (`apps/aptitude/services/question_generator.py`): Structured validation with initial check and up to 3 automated AI revisions; failed questions recorded in `AptitudeValidationHistory` as `Suspended – Review Failed`. Deterministic offline fallback engine guarantees zero-cost operation and predictable test suite execution.
- [x] Fresher Eligibility Enforcement: Restricted to freshers and entry-level candidates (`"Fresher"`, `"Less than 1 year"`). Experienced candidates (`1–3 years`, `3–5 years`, `5+ years`) denied standalone aptitude with 403 Forbidden.
- [x] Daily Standalone Practice Limit: Enforces strict 5 submitted sessions per calendar day. Abandoned sessions and Phase 6 Mixed recruitment simulation stages strictly exempted. Resets automatically at 00:00 UTC.
- [x] Test Taking Experience (`AptitudeTestPage.jsx`): 60-minute server-enforced live timer, 45-button question palette (Answered, Unanswered, Current), 4-option radio buttons (A, B, C, D), debounced autosave persistence, leave modal (abandonment clears answers without consuming attempt limit), and submit modal with unanswered question count indicator.
- [x] Objective Evaluation & Scorecard (`AptitudeResultsPage.jsx`): Deterministic MCQ evaluation (`is_correct = (selected == correct)`). Standalone practice **never** shows PASS/FAIL verdicts (practice activity, not recruitment decision). Question-by-question review with expected option and step-by-step mathematical/logical explanation.
- [x] Admin Aptitude Management (`AdminAptitudePage.jsx` & `views_aptitude.py`): Search/filter catalog, manual MCQ creation, immutable version publishing, suspension/activation, student report resolution, and platform configuration updates.
- [x] Comprehensive Testing: 12 new backend pytest tests for aptitude (73/73 total backend tests passing in 43.8s); full Playwright suite (17/17 tests passing); comprehensive visual inspection with all 8 state screenshots captured.
- [x] Zero API cost, human-style code without AI decorative comments, clean separation between frontend presentation and backend business logic.

---

## Phase 4 Milestones: Complete & Verified

- [x] Shared Question Bank Architecture (`apps/questions`): Data models (`Question`, `QuestionVersion`, `QuestionReport`, `QuestionValidationHistory`) supporting strict non-MCQ formats across Python, Django, SQL, React, etc.
- [x] 5 Structured Question Categories: Code Output Prediction, Find Error / Debugging, Coding Problems, Scenario-Based Architecture, Conceptual / Short Answer across 3 difficulty levels (Easy, Medium, Hard).
- [x] Question Generation & Revision Engine (`apps/questions/services/question_generator.py`): Structured validation with initial check and up to 3 automated AI revisions; failed questions recorded with failure reason in `QuestionValidationHistory` as `Suspended – Review Failed`. Deterministic offline fallback engine guarantees zero-cost operation and predictable test suite execution.
- [x] Weekly Quiz Assignment Engine (`apps/quizzes/services/quiz_service.py`): Generates exact 45-question assignments per roadmap week with strict distribution (10 Output, 10 Debugging, 10 Coding, 10 Scenario, 5 Conceptual), prioritizing unseen questions from the bank.
- [x] Quiz Taking Experience (`QuizTakingPage.jsx`): 75-minute live server-enforced countdown timer, 45-button question palette (Answered, Unanswered, Current), autosave persistence across page reloads, and code input editors.
- [x] Modal Dialogs: Quiz instructions modal with format overview, leave modal with warning of answer loss on abandonment without consuming attempt limit, and submit modal with unanswered question count indicator.
- [x] Binary Evaluation Engine (`apps/quizzes/services/evaluation_service.py`): Strict Correct / Incorrect grading (no partial credit). Final score calculation `(Correct / 45) * 100`. Comprehensive question-by-question review with expected solution and technical explanation.
- [x] Attempt Enforcement & Safety: Up to 5 submitted attempts allowed per weekly quiz. Retakes blocked while an attempt is in `Evaluation Pending`. Abandonment cancels active attempt without consuming a submission slot.
- [x] Roadmap Progress Integration: Submitting a weekly quiz dynamically increments the week's completed milestones by exactly 1 (e.g. 28/30 -> 28/31).
- [x] Admin Question Bank Management (`AdminQuestionBankPage.jsx` & `views_questions.py`): Catalog search, multi-faceted filtering, question creation, version publishing, question activation/suspension, and student report resolution.
- [x] Comprehensive Testing: 12 new backend pytest tests for questions and quizzes (61/61 total backend tests passing); 1 new end-to-end Playwright spec (`weekly_quiz.spec.js`) covering complete quiz lifecycle (15/15 total E2E tests passing).
- [x] Zero API cost, human-style code without AI decorative comments, clean separation between frontend presentation and backend business logic.

---

## Phase 3 Milestones: Complete & Verified

- [x] Implemented salary-tier aligned roadmap data models (`RoadmapConfigurationSnapshot`, `RoadmapPhase`, `RoadmapWeek`, `RoadmapTopicReference`, `TopicProgress`, `RoadmapPracticeTask`, `PracticeTaskProgress`).
- [x] Generated database migrations `0002_...` and `0003_roadmap_generation_error_roadmap_generation_job_id_and_more.py` with zero data loss.
- [x] Implemented dynamic catalog service supporting 9 primary software engineering roles (+ Other with custom title), 5 experience tiers, 6 salary bands (+ Skip), 14 programming languages, and 10 production databases.
- [x] Built Language/Framework compatibility matrix enforcing valid technology pairings with dynamic automatic clearing on mismatch.
- [x] AI-Powered Roadmap Generation Architecture (`apps/ai_services/roadmap_ai_service.py`): Integrates Google Gemini background generation with seamless fallback to deterministic curriculum engine; records `AIUsageRecord` for cost & latency auditability.
- [x] Connected Hands-on Practice Roadmap: Generates coding exercises, SQL query problems, debugging tasks, implementation refactoring, and portfolio projects connected directly to corresponding learning weeks.
- [x] Independent Progress Tracking: Distinct progress lifecycles for learning topics (Not Started, Completed, Not Verified/Skipped) and practice tasks (Not Started, In Progress, Completed). Neither locks or auto-completes the other.
- [x] Hands-on Practice Task Detail Modal (`PracticeTaskModal.jsx`): Renders task objective, problem statement, acceptance criteria, constraints, sample I/O, deliverable, starter code with copy button, hints accordion, and work log notes.
- [x] Built transactional roadmap replacement flow (`POST /api/v1/learning/roadmaps/replace/`) safely archiving previous roadmaps under `@transaction.atomic`.
- [x] Topic Content Modal: Detailed technical view with learning objectives, runtime mechanics, code examples, and recruitment interview perspectives.
- [x] Integrated real-time roadmap metrics into the student dashboard summary (`GET /api/v1/dashboard/student/`).
- [x] Added 15 comprehensive backend pytest tests across catalog, generation, practice tasks, independent progress updates, validation, and permissions (49/49 total backend tests passing).
- [x] Added automated Playwright E2E test specs for guest intro, multi-step wizard, topic status toggling, practice roadmap mode, practice task modal, and replacement modal (14/14 total E2E tests passing).
- [x] Clean, professional, human-style code without AI decorative comments or over-engineered abstractions.

---

## Phase 2 Milestones: Complete & Verified

- [x] Implemented student dashboard overview API endpoint (`GET /api/v1/dashboard/student/`) with authentication enforcement.
- [x] Active roadmap data integration with honest empty state and populated state handling (no fabricated progress).
- [x] Recent activity feed with empty state and dynamic event integration (no fabricated activity).
- [x] Responsive desktop and mobile navigation shell with brand identity and active route indicators (`bg-brand-50`).
- [x] Mobile hamburger menu drawer with smooth transitions and full route access.
- [x] Client-side route protection wrapper (`ProtectedRoute.jsx`) with session validation and login return redirect (`state.from`).
- [x] Three core module entry pages (`/learn`, `/practice`, `/experiences`) with transparent implementation milestones.
- [x] 34/34 backend tests passing (including 3 new dashboard unit tests).
- [x] 12/12 Playwright browser end-to-end tests passing across desktop and mobile viewports.
- [x] Configured CodeRabbit automated review specification (`.coderabbit.yaml`).

---

## Phase 1 Milestones: Complete & Verified

- [x] Student registration workflow with field validation and password confirmation
- [x] Secure email verification code generation, expiration (15m), and hashed storage (SHA-256)
- [x] Code attempt limiting (max 5) and resend cooldown (60s)
- [x] JWT login and session handling (access/refresh tokens via SimpleJWT)
- [x] Immediate blacklisting and invalidation on user logout
- [x] Password reset request and confirmation with token blacklisting
- [x] Student profile viewing and updating
- [x] Password change workflow with current password re-authentication
- [x] Email change workflow with verification of the new address
- [x] Permanent account deletion with explicit confirmation ("DELETE") and password re-authentication
- [x] Invitation-only administrator access with token expiration (48h)
- [x] Initial administrator bootstrap management command (`python manage.py bootstrap_admin`)
- [x] Mandatory administrator two-factor authentication (2FA) workflow
- [x] Frontend authentication pages: Register, Verify Email, Login, Forgot Password, Reset Password, Profile, and Admin Portal
- [x] 31/31 backend automated tests passing via `pytest`
- [x] 5/5 Playwright end-to-end tests passing via Google Chrome
