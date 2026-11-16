# Implementation Progress

This log tracks granular progress across every feature, component, API, and milestone.

---

## Progress Summary

- **Repository:** `https://github.com/aayushbhakare/interviewprep` (`main` branch)
- **Total Phases:** 11 (Phases 0 through 10)
- **Completed Phases:** 6 (Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5)
- **Current Phase:** Phase 5 — Aptitude Practice (Completed & Verified)
- **Next Phase:** Phase 6 — Share Interview Experience

---

## Milestone Progress Log

### Phase 5: Aptitude Practice Module (Completed & Verified)
- [x] Researched official TCS iON Cognitive Foundation reference pattern (65 questions, 75 mins: 20 Quant, 20 Logical, 25 Verbal, verified Nov 16, 2026). Standardized practice configuration: 45 MCQs (15 Quant, 15 Logical, 15 Verbal) in 60 minutes with 0 penalty, fully admin-configurable.
- [x] Defined models for shared aptitude question bank and test sessions (`apps/aptitude/models.py`): `AptitudeQuestion`, `AptitudeQuestionVersion`, `AptitudeQuestionReport`, `AptitudeValidationHistory`, `AptitudeTestConfig`, `AptitudeSession`, `AptitudeSessionQuestion`, `AptitudeSessionAnswer`.
- [x] Generated and applied database migration `0002_aptitudetestconfig_alter_aptitudequestion_options_and_more.py`.
- [x] Implemented `seed_data.py` providing curated baseline bank of 45 verified TCS NQT pattern MCQs across Quantitative Aptitude, Logical Reasoning, and Verbal Ability.
- [x] Implemented `question_generator.py` with structured schema validation, up to 3 AI revisions, offline deterministic fallback engine, and failure logging as `Suspended – Review Failed`.
- [x] Implemented `aptitude_bank_service.py` with unseen question selection priority, replenishment from generator, duplicate grouping, threshold suspension, and report submission.
- [x] Implemented `session_service.py` with fresher eligibility enforcement (`"Fresher"`, `"Less than 1 year"`), daily standalone attempt tracking (5 submitted sessions/day; abandoned sessions strictly exempted), start/resume session, 60-minute server timer enforcement, debounced autosave, abandonment handling, and objective deterministic MCQ evaluation.
- [x] Built student and admin endpoints:
  - `GET /api/v1/aptitude/config/`
  - `POST /api/v1/aptitude/sessions/start/`
  - `GET /api/v1/aptitude/sessions/<uuid:session_id>/`
  - `POST /api/v1/aptitude/sessions/<uuid:session_id>/autosave/`
  - `POST /api/v1/aptitude/sessions/<uuid:session_id>/abandon/`
  - `POST /api/v1/aptitude/sessions/<uuid:session_id>/submit/`
  - `GET /api/v1/aptitude/sessions/<uuid:session_id>/results/`
  - `GET /api/v1/aptitude/history/`
  - `POST /api/v1/aptitude/questions/report/`
  - Admin endpoints under `/api/v1/admin-panel/aptitude/` for questions, versions, reports, and platform config.
- [x] Built frontend components and views:
  - `aptitudeService.js`: Full Axios API client for student and admin endpoints.
  - `AptitudePracticePage.jsx`: Landing / instructions hub with eligibility badge, daily quota counter (X/5), section breakdown, and test start button.
  - `AptitudeTestPage.jsx`: Test taking interface with 60-minute countdown timer, 45-button question palette, 4 options (A-D), debounced autosave, and modal triggers.
  - `AptitudeResultsPage.jsx`: Scorecard results with section breakdown, question-by-question review, step-by-step mathematical reasoning, and zero PASS/FAIL verdicts for standalone practice.
  - `AptitudeLeaveModal.jsx`: Leave modal warning student of abandonment without consuming daily attempt allowance.
  - `AptitudeSubmitModal.jsx`: Submit confirmation dialog reporting unanswered question count.
  - `AptitudeHistoryModal.jsx`: Chronological past sessions modal.
  - `AptitudeReportModal.jsx`: In-test issue reporting modal.
  - `AdminAptitudePage.jsx`: Admin questions catalog with search/filters, add question modal, version publisher, student report resolver, and platform rules editor.
- [x] Authored and executed 12 backend pytest tests (`test_aptitude.py`), reaching 73/73 total backend tests passing (100% in 43.8s).
- [x] Authored and executed Playwright E2E spec (`aptitude_practice.spec.js`), reaching 17/17 total end-to-end tests passing (100%).
- [x] Conducted comprehensive browser visual inspection with 8 high-fidelity screenshots saved to `phase5_evidence/`.
- [x] Clean, professional code without AI decorative comments; zero new third-party dependencies introduced.

---

### Phase 4: Shared Question Bank & Weekly Quiz System (Completed & Verified)
- [x] Defined models for shared question bank (`apps/questions/models.py`): `Question`, `QuestionVersion`, `QuestionReport`, and `QuestionValidationHistory`.
- [x] Defined models for quiz lifecycle (`apps/quizzes/models.py`): `WeeklyQuizAssignment`, `AssignmentQuestion`, `QuizAttempt`, and `AttemptAnswer`.
- [x] Applied migrations `questions.0002` and `quizzes.0002` cleanly.
- [x] Implemented `seed_data.py` providing curated seed bank across all 5 non-MCQ categories (Output, Debugging, Coding, Scenario, Conceptual) and 3 difficulties (Easy, Medium, Hard).
- [x] Implemented `question_generator.py` with structured schema validation, up to 3 AI revisions, offline deterministic fallback engine, and failure logging as `Suspended – Review Failed`.
- [x] Implemented `question_bank_service.py` with duplicate grouping, threshold suspension, version snapshotting, and student report submission.
- [x] Implemented `quiz_service.py` with exact 45-question distribution generation, start/resume session, 75-minute timer server enforcement, debounced answer autosave, abandonment handling, and submission validation.
- [x] Implemented `evaluation_service.py` with strict binary grading (Correct / Incorrect), unanswered=incorrect rule, failure handling to `evaluation_pending` via `ProcessingJob(idempotency_key=...)`, and scorecard calculation `(correct / 45) * 100`.
- [x] Integrated roadmap milestone incrementing: Submitting weekly quiz increments the week's completed milestones by exactly 1 in `progress_service.py` and `RoadmapWeekSerializer`.
- [x] Built frontend components and views:
  - `quizService.js`: Full Axios API client for student and admin endpoints.
  - `QuizOverviewCard.jsx`: Weekly quiz status card on roadmap with score %, attempt count (X/5), Start, Resume, View Results, and Past Attempts buttons.
  - `QuizInstructionsModal.jsx`: Instructions modal detailing 45 questions, 75-minute countdown timer, category distribution, and binary grading rules.
  - `QuizTakingPage.jsx`: Live server-synced countdown timer, 45-button question palette (Answered, Unanswered, Current), question content and code editor, debounced autosave.
  - `QuizLeaveModal.jsx`: Leave modal warning student of abandonment answer loss without consuming attempt allowance.
  - `QuizSubmitModal.jsx`: Submit confirmation dialog reporting unanswered question count.
  - `QuizResultsPage.jsx`: Score summary card, binary Correct/Incorrect breakdown, question-by-question review with expected answers and explanations.
  - `QuizHistoryModal.jsx`: Chronological past attempts modal.
  - `QuestionReportModal.jsx`: In-quiz question issue reporting modal.
  - `AdminQuestionBankPage.jsx`: Admin search, filter tabs, question CRUD, version publisher, and student report resolver.
- [x] Authored and executed 12 backend pytest tests (`test_question_bank.py` and `test_weekly_quizzes.py`), reaching 61/61 backend tests passing (100%).
- [x] Authored and executed Playwright E2E spec (`weekly_quiz.spec.js`), reaching 15/15 total end-to-end tests passing (100%).
- [x] Clean, professional code without AI decorative comments; zero new third-party dependencies introduced.

---

### Phase 3: Learn Module & Personalized Roadmap (Completed & Verified)
- [x] Defined models for salary-wise preparation: `RoadmapConfigurationSnapshot`, `RoadmapPhase`, `RoadmapWeek`, `RoadmapTopicReference`, `TopicProgress`, `RoadmapPracticeTask`, and `PracticeTaskProgress`.
- [x] Applied migrations `0002_...` and `0003_roadmap_generation_error_roadmap_generation_job_id_and_more.py`.
- [x] Implemented `catalog_service.py` with 9 target roles, 5 experience bands, 6 salary bands, 14 languages, and 10 databases.
- [x] Built `LANGUAGE_FRAMEWORK_MATRIX` with server-side validation and dynamic frontend auto-clearing.
- [x] Implemented background AI generation architecture (`roadmap_ai_service.py`) supporting Google Gemini with seamless fallback to deterministic curriculum engine and audit logging via `AIUsageRecord`.
- [x] Implemented `roadmap_generator.py` generating 5 phases, weekly milestones, salary-tier tailored topics, and connected hands-on practice tasks with atomic replacement.
- [x] Implemented `progress_service.py` managing independent progress for learning topics (Not Started, Completed, Skipped) and hands-on practice tasks (Not Started, In Progress, Completed).
- [x] Built API endpoints:
  - `GET /api/v1/learning/catalog/`
  - `GET /api/v1/learning/roadmaps/active/`
  - `GET /api/v1/learning/roadmaps/status/`
  - `POST /api/v1/learning/roadmaps/`
  - `POST /api/v1/learning/roadmaps/replace/`
  - `PATCH /api/v1/learning/topics/<uuid:topic_id>/progress/`
  - `GET /api/v1/learning/topics/<uuid:topic_id>/content/`
  - `GET /api/v1/learning/practice-tasks/<uuid:task_id>/`
  - `PATCH /api/v1/learning/practice-tasks/<uuid:task_id>/progress/`
- [x] Built frontend components:
  - `RoadmapWizard.jsx`: 6-step setup flow with dynamic validation and preview review.
  - `RoadmapViewer.jsx`: Mode switcher between Learning Roadmap and Practice Roadmap, independent progress bars, phase/week navigation, and action buttons.
  - `TopicContentModal.jsx`: Learning objectives, concept overview, runtime mechanics, code examples, interview perspectives.
  - `PracticeTaskModal.jsx`: Problem statement, requirements, constraints, sample I/O, deliverable, starter code with copy, hints, and work log notes.
  - `RoadmapReplaceModal.jsx`: Safe replacement confirmation dialog.
  - `RoadmapIntro.jsx`: Salary-wise introductory hero and feature cards.
  - `LearnPage.jsx`: State orchestrator for guest visitors, preparing states, error recovery, and authenticated students.
- [x] Authored and executed 15 backend tests in `apps/learning/tests/test_learning.py` (49/49 total backend tests passing).
- [x] Authored and executed Playwright E2E tests in `e2e/learn_roadmap.spec.js` (14/14 total E2E tests passing).

### Phase 2: Main Dashboard and Navigation Shell (Completed & Verified)
- [x] Configured CodeRabbit automated PR review specification (`.coderabbit.yaml`).
- [x] Adopted natural, professional developer coding standards (cleaned verbose comment banners).
- [x] Implemented `StudentDashboardView` at `GET /api/v1/dashboard/student/` returning real roadmap, recent activity, and shortcuts data.
- [x] Built responsive desktop and mobile `Navbar.jsx` with active route highlights, user profile badge, and mobile drawer.
- [x] Implemented `ProtectedRoute.jsx` client-side guard preserving destination redirect on unauthenticated access.
- [x] Built full `DashboardPage.jsx` featuring three core pillars, honest Continue Learning empty/populated state, and Recent Activity timeline.
- [x] Built standalone landing entry points for `/learn`, `/practice`, and `/experiences` with clear phase status indicators.
- [x] Added 3 backend dashboard unit tests (34/34 total passing).
- [x] Added 7 Playwright E2E tests for dashboard and navigation (12/12 total passing).

### Phase 0: Project Foundation (Completed & Verified)
- [x] Read and audited all 16 Markdown blueprint files.
- [x] Initialized Django + React + PostgreSQL on port 5433.
- [x] Verified system checks, migrations, and clean builds.

### Phase 1: Authentication and User Management (Completed & Verified)
- [x] Custom User model (`accounts.User`) with email login and admin 2FA readiness.
- [x] `EmailVerificationCode` model with SHA-256 hashed storage, 15m expiration, and 5-attempt locking.
- [x] `PasswordResetToken` model with timing-safe enumeration prevention and complete session invalidation.
- [x] `EmailChangeRequest` model with new-email code verification.
- [x] `AdminInvitation` model with 48h invitation token expiration and staff role provisioning.
- [x] `TwoFactorCode` model with 5m expiration for mandatory admin 2FA.
- [x] Implemented SimpleJWT authentication with token rotation and token blacklist.
- [x] Created `bootstrap_admin` management command (`python manage.py bootstrap_admin`).
- [x] Developed complete suite of frontend pages:
  - `RegisterPage.jsx`
  - `VerifyEmailPage.jsx` (with 60s cooldown timer)
  - `LoginPage.jsx`
  - `ForgotPasswordPage.jsx`
  - `ResetPasswordPage.jsx`
  - `ProfilePage.jsx` (Details, Change Password, Change Email, Delete Account)
  - `AdminLoginPage.jsx` (Two-step 2FA login)
- [x] Authored and executed 31 automated pytest tests (100% passed).
- [x] Authored and executed 5 Playwright end-to-end tests (100% passed).
