# API Documentation

All API endpoints are prefixed with `/api/v1/` and return consistent JSON structures.

Interactive OpenAPI documentation is hosted at:
- **Swagger UI:** `http://localhost:8000/api/v1/docs/`
- **OpenAPI Schema (JSON):** `http://localhost:8000/api/v1/schema/`

---

## Response Envelope Conventions

### Success Response
```json
{
  "status": "success",
  "message": "Optional human-readable message",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "validation_error",
    "message": "Specific human-readable message",
    "details": {
      "field_name": ["Specific validation error"]
    }
  }
}
```

---

## Core Platform & Dashboard (`apps/common`)

- `GET /api/v1/health/` — System health check (server status, database connection, environment mode).
- `GET /api/v1/dashboard/student/` — Student dashboard overview (active roadmap details, recent activities stream, quick shortcuts, user summary). Protected (`IsAuthenticated`).

---

## Implemented Authentication & Account Endpoints (`apps/accounts`)

### Authentication (`/api/v1/auth/`)
- `POST /api/v1/auth/register/` — Register student (name, email, password, confirm_password). Generates verification code.
- `POST /api/v1/auth/verify-email/` — Verify account using 6-digit code.
- `POST /api/v1/auth/resend-code/` — Request a fresh code (enforces 60-second cooldown).
- `POST /api/v1/auth/login/` — Authenticate and receive access + refresh JWT (verified accounts only).
- `POST /api/v1/auth/token/refresh/` — Obtain new access token using refresh token.
- `POST /api/v1/auth/logout/` — Blacklist refresh token and invalidate session.
- `POST /api/v1/auth/password-reset/request/` — Request password reset code (timing/enumeration safe).
- `POST /api/v1/auth/password-reset/confirm/` — Confirm password reset and invalidate all existing active sessions.

### Account & Profile (`/api/v1/account/`)
- `GET /api/v1/account/profile/` — Retrieve authenticated student profile.
- `PATCH /api/v1/account/profile/` — Update profile (name, phone, role, experience, target salary).
- `POST /api/v1/account/change-password/` — Change password with re-authentication and session invalidation.
- `POST /api/v1/account/change-email/request/` — Request email change, sends code to new email.
- `POST /api/v1/account/change-email/confirm/` — Verify code and commit new email address.
- `POST /api/v1/account/delete/` — Permanently delete account with password and 'DELETE' confirmation.

### Admin Authentication & Invitations (`/api/v1/admin-panel/`)
- `POST /api/v1/admin-panel/auth/login/` — Admin login (Step 1). Requires staff role; triggers 2FA code email.
- `POST /api/v1/admin-panel/auth/2fa/verify/` — Admin 2FA verification (Step 2). Issues admin JWT tokens.
- `POST /api/v1/admin-panel/invitations/` — Invite new administrator (staff permission required).
- `POST /api/v1/admin-panel/invitations/accept/` — Onboard as an admin using security token.

---

## Implemented Learning & Roadmap Endpoints (`apps/learning`)

### Learning Module (`/api/v1/learning/`)
- `GET /api/v1/learning/catalog/` — Retrieve the setup catalog including roles, experience tiers, salary bands, languages, frameworks, databases, and compatibility matrix.
- `GET /api/v1/learning/roadmaps/active/` — Retrieve the active roadmap for the authenticated student, nested with phases, weeks, learning topics, hands-on practice tasks, and live progress metrics.
- `GET /api/v1/learning/roadmaps/status/` — Retrieve generation status, preparation state, and errors for the student's active roadmap.
- `POST /api/v1/learning/roadmaps/` — Generate a new personalized roadmap from setup choices (validates language/framework matrix; errors with 409 if active roadmap already exists).
- `POST /api/v1/learning/roadmaps/replace/` — Safely replace existing active roadmap with a fresh configuration in an atomic database transaction.
- `PATCH /api/v1/learning/topics/<uuid:topic_id>/progress/` — Update individual topic status (`not_started`, `completed`, `skipped`). Returns updated metrics.
- `GET /api/v1/learning/topics/<uuid:topic_id>/content/` — Retrieve technical study content for a topic (learning objectives, runtime mechanics, code examples, interview perspectives).
- `GET /api/v1/learning/practice-tasks/<uuid:task_id>/` — Retrieve hands-on practice task objective, problem statement, requirements, constraints, sample I/O, deliverable, starter code, and hints.
- `PATCH /api/v1/learning/practice-tasks/<uuid:task_id>/progress/` — Update practice task progress (`not_started`, `in_progress`, `completed`) and save submission notes.

---

## Implemented Shared Question Bank & Weekly Quiz Endpoints (`apps/questions` & `apps/quizzes`)

### Student Question Reporting (`/api/v1/questions/`)
- `POST /api/v1/questions/reports/` — Report an issue with a question (reason, description). Deduplicates identical active reports and automatically suspends questions exceeding report threshold.
- `GET /api/v1/questions/catalog/` — Retrieve public catalog statistics by technology, category, and difficulty.

### Weekly Quiz Management (`/api/v1/quizzes/`)
- `POST /api/v1/quizzes/assignments/prepare/` — Prepare or retrieve 45-question assignment for the active roadmap week.
- `GET /api/v1/quizzes/assignments/{assignment_id}/` — Retrieve assignment metadata, question count, and submission status.
- `POST /api/v1/quizzes/attempts/start/` — Start a new quiz attempt or resume active in-progress attempt. Computes server-side 75-minute timer remaining seconds. Enforces 5 submitted attempts limit and blocks retakes while an evaluation is pending.
- `POST /api/v1/quizzes/attempts/{attempt_id}/autosave/` — Autosave student answer for a specific question. Validates timer cutoff with 60-second latency buffer.
- `POST /api/v1/quizzes/attempts/{attempt_id}/abandon/` — Abandon in-progress attempt. Discards unsubmitted answers without consuming the 5-attempt limit.
- `POST /api/v1/quizzes/attempts/{attempt_id}/submit/` — Submit quiz attempt. Triggers binary evaluation (Correct/Incorrect), awards +1 milestone to roadmap week, calculates score `(correct / 45) * 100`.
- `GET /api/v1/quizzes/attempts/{attempt_id}/results/` — Retrieve completed attempt results (scorecard, binary Correct/Incorrect breakdown, expected answers, and technical explanations).
- `GET /api/v1/quizzes/assignments/{assignment_id}/attempts/` — Retrieve chronological attempt history for an assignment.

### Admin Question Bank Operations (`/api/v1/admin-panel/questions/`)
- `GET /api/v1/admin-panel/questions/` — List and search questions with pagination and filters (technology, category, difficulty, status).
- `POST /api/v1/admin-panel/questions/` — Create new question with initial version (prompt, code snippet, expected answer, explanation).
- `GET /api/v1/admin-panel/questions/{id}/` — Retrieve question details, complete version history, and validation audit log.
- `POST /api/v1/admin-panel/questions/{id}/version/` — Publish a new immutable version for an existing question.
- `PATCH /api/v1/admin-panel/questions/{id}/status/` — Update question operational status (`active`, `suspended`, `deprecated`).
- `GET /api/v1/admin-panel/questions/reports/` — View student question issue reports queue.
- `POST /api/v1/admin-panel/questions/reports/{id}/resolve/` — Resolve or dismiss student report with resolution action and admin notes.

---

## Implemented Aptitude Practice Endpoints (`apps/aptitude`) (Phase 5 Verified)

### Student Aptitude Endpoints (`/api/v1/aptitude/`)
- `GET /api/v1/aptitude/config/` — Retrieve active aptitude test configuration (duration, total questions, section distribution), student fresher eligibility status, and daily attempt quota usage (used/limit/remaining).
- `POST /api/v1/aptitude/sessions/start/` — Start a new aptitude session or resume an active in-progress session. Enforces fresher eligibility and the 5 submitted attempts/day limit for standalone tests.
- `GET /api/v1/aptitude/sessions/{session_id}/` — Retrieve active test taking state (server-computed countdown timer, 45 questions without revealing correct answers, and currently saved selections).
- `POST /api/v1/aptitude/sessions/{session_id}/autosave/` — Autosave student MCQ selections. Validates timer cutoff with a 60-second network latency buffer.
- `POST /api/v1/aptitude/sessions/{session_id}/abandon/` — Abandon in-progress session. Discards answers and does NOT consume the daily 5-attempt limit.
- `POST /api/v1/aptitude/sessions/{session_id}/submit/` — Submit session for deterministic objective evaluation. Evaluates `(selected == correct)`, updates statistics, and locks answers.
- `GET /api/v1/aptitude/sessions/{session_id}/results/` — Retrieve completed scorecard and comprehensive question review with options, correct answer keys, and step-by-step mathematical reasoning. Never displays PASS/FAIL for standalone practice.
- `GET /api/v1/aptitude/history/` — Retrieve chronological history of past submitted aptitude sessions for the authenticated student.
- `POST /api/v1/aptitude/questions/report/` — Report an issue or typo with an aptitude question. Automatically groups duplicates and suspends questions exceeding report threshold.

### Admin Aptitude Operations (`/api/v1/admin-panel/aptitude/`)
- `GET /api/v1/admin-panel/aptitude/questions/` — List and search aptitude MCQs with multi-faceted filtering (category, difficulty, status, search).
- `POST /api/v1/admin-panel/aptitude/questions/` — Manually create a new aptitude MCQ (category, topic, difficulty, question text, 4 options, correct option index, step-by-step explanation).
- `GET /api/v1/admin-panel/aptitude/questions/{id}/` — Retrieve aptitude question detail, immutable version history, and validation audit log.
- `POST /api/v1/admin-panel/aptitude/questions/{id}/version/` — Publish an immutable version increment with changelog.
- `PATCH /api/v1/admin-panel/aptitude/questions/{id}/status/` — Update operational status (`approved`, `suspended`, `inactive`).
- `GET /api/v1/admin-panel/aptitude/reports/` — View student question issue report queue.
- `POST /api/v1/admin-panel/aptitude/reports/{id}/resolve/` — Resolve or dismiss student report with resolution action and audit notes.
- `GET /api/v1/admin-panel/aptitude/config/` — Retrieve active platform test configuration and rules.
- `PATCH /api/v1/admin-panel/aptitude/config/` — Update platform rules (daily limit, duration, total question count, section distribution, Phase 6 Mixed qualifying threshold).

---

## Implemented Interview Practice Endpoints (`apps/interviews`) (Phase 6 Verified)

### Student Interview Endpoints (`/api/v1/interviews/`)
- `GET /api/v1/interviews/eligibility/` — Check candidate eligibility and cooling status across all three tracks (`technical`, `hr`, `mixed`), returning remaining cooling seconds and active session references if any.
- `GET /api/v1/interviews/setup-data/` — Retrieve pre-populated setup fields derived from active learning roadmap (role, experience level, salary tier, tech stack) and available resume versions.
- `POST /api/v1/interviews/sessions/` — Create or resume an interview simulation session. Snapshots active resume version and enforces independent cooling period restrictions.
- `GET /api/v1/interviews/sessions/{id}/` — Retrieve interview session state, transcript turns, current round status, and question context.
- `POST /api/v1/interviews/sessions/{id}/turn/` — Submit candidate spoken or text utterance. Triggers conversational turn processing, verbal repetition/clarification handling, or generates follow-up question.
- `POST /api/v1/interviews/sessions/{id}/complete-aptitude-stage/` — Verify completed Phase 5 aptitude stage for Mixed recruitment simulations. Advances candidate to Round 2 if score $\ge 60\%$; aborts session with `FAIL` if below threshold.
- `POST /api/v1/interviews/sessions/{id}/evaluate/` — Finalize interview session and trigger binary evaluation. Produces strictly `PASS` or `FAIL` verdict and structured 6-dimension constructive feedback; applies 24-hour cooling on failure.
- `POST /api/v1/interviews/sessions/{id}/abandon/` — Abandon in-progress interview. Leaves session without failure verdict and does NOT incur a cooling period.
- `GET /api/v1/interviews/sessions/{id}/results/` — Retrieve final evaluation scorecard with binary decision, target salary tier expectations, and constructive performance breakdown.
- `GET /api/v1/interviews/history/` — List chronological past interview sessions for the authenticated student with track filter support.
- `GET /api/v1/interviews/config/` — Retrieve public platform simulation configuration and default cooling parameters.

### Admin Interview Operations (`/api/v1/admin-panel/interviews/`)
- `GET /api/v1/admin-panel/interviews/config/` — Retrieve administrative simulation parameters, cooling durations per track, AI provider settings, and mixed qualification cutoff.
- `PUT /api/v1/admin-panel/interviews/config/` — Update administrative simulation configuration parameters.
- `GET /api/v1/admin-panel/interviews/analytics/` — Retrieve operational telemetry, total session volume, overall pass rate, and AI token consumption metrics.

---

## Implemented Share Interview Experience Endpoints (`apps/experiences`) (Phase 7 Verified)

### Public Discovery & Student Endpoints (`/api/v1/experiences/`)
- `GET /api/v1/experiences/` — Public feed of published interview experiences. Supports keyword search (`search`), multi-faceted filtering (`role`, `company`, `salary_range`, `experience_level`, `outcome`, `mode`, `difficulty`, `year`), sorting (`ordering=recent` or `ordering=helpful`), and pagination.
- `GET /api/v1/experiences/taxonomy/` — Retrieve distinct filter criteria (companies, roles, salary tiers, experience levels, outcomes, modes, difficulties).
- `GET /api/v1/experiences/{id}/` — Retrieve full experience details with chronological recruitment stages, questions, follow-ups, and student responses. Anonymizes author if `is_anonymous` is true.
- `GET /api/v1/experiences/my/` — List authenticated candidate's own submissions with tab filter support (`draft`, `pending_review`, `published`, `rejected`).
- `POST /api/v1/experiences/drafts/` — Create a new private draft submission.
- `PUT /api/v1/experiences/drafts/{id}/` — Update an existing private draft submission.
- `POST /api/v1/experiences/{id}/publish/` — Submit experience for publication. Runs automated risk-based policy moderation. Low-risk auto-publishes; high-risk queues for review; structural errors reject.
- `PUT /api/v1/experiences/{id}/edit-published/` — Submit updates to an already-published experience. Keeps approved live version visible on discovery while moderation reviews the new revision.
- `DELETE /api/v1/experiences/{id}/delete/` — Delete candidate's own experience and safely deactivates extracted questions in the Learn module.
- `POST /api/v1/experiences/{id}/helpful/` — Toggle helpful vote on a published experience.
- `POST /api/v1/experiences/{id}/report/` — Submit a community issue report against an experience across 7 reason categories.

### Admin Experience Operations (`/api/v1/admin-panel/experiences/`)
- `GET /api/v1/admin-panel/experiences/` — List experience moderation queue with filters for status (`pending_review`, `published`, `rejected`, `all`), search, and active reports flag.
- `GET /api/v1/admin-panel/experiences/{id}/` — Retrieve full submission details including all stages, automated policy scanner findings, author real email/name, and version history.
- `POST /api/v1/admin-panel/experiences/{id}/action/` — Execute moderation decision (`approve`, `reject`, `suspend`, `restore`) with required justification notes.
- `GET /api/v1/admin-panel/experiences/reports/` — List community reports filed against interview experiences with status filtering.
- `POST /api/v1/admin-panel/experiences/reports/{report_id}/resolve/` — Resolve or dismiss community report (`dismiss`, `resolve_suspend`, `resolve_restore`) with admin notes.

---

## Implemented Platform Administration & Management Endpoints (`apps/administration`) (Phase 8 Verified)

All administrative endpoints require `IsPlatformAdmin` authorization (`is_authenticated`, `is_staff`, `is_active`, and non-suspended status).

### Platform Dashboard Overview
- `GET /api/v1/admin-panel/dashboard/` — Platform overview metrics (Students, Roadmaps, Quizzes, Aptitude, Mock Interviews, Experiences) and actionable "Attention Required" counts.

### Student Management
- `GET /api/v1/admin-panel/students/` — Paginated student accounts list with search (`search`), verification (`is_verified`), and suspension (`is_suspended`) filters.
- `GET /api/v1/admin-panel/students/{id}/` — Full student profile with aggregated module activity dossier.
- `POST /api/v1/admin-panel/students/{id}/suspend/` — Suspend student account with mandatory `suspension_reason` and immutable audit logging.
- `POST /api/v1/admin-panel/students/{id}/reactivate/` — Restore suspended student account.

### Learning Content Versioning
- `GET /api/v1/admin-panel/learning/topics/` — List topics by technology taxonomy (`technology_id`) and search query.
- `GET /api/v1/admin-panel/learning/topics/{id}/` — Inspect multi-section topic content and latest version number.
- `POST /api/v1/admin-panel/learning/topics/{id}/version/` — Release new version (`v = latest + 1`) of topic sections without affecting student progress.
- `POST /api/v1/admin-panel/learning/topics/{id}/toggle-status/` — Toggle topic public draft vs published visibility.

### Centralized Platform Settings
- `GET /api/v1/admin-panel/settings/` — Retrieve all platform configuration parameters across Aptitude, Quizzes, Interviews, and Security.
- `PATCH /api/v1/admin-panel/settings/{key}/` — Update specific setting parameter with validation and audit logging.

### AI Model & Provider Routing
- `GET /api/v1/admin-panel/ai-models/` — List provider routing and models for all 10 platform AI services.
- `PATCH /api/v1/admin-panel/ai-models/{service_name}/` — Update AI provider (`gemini` vs `deterministic`), model name, or fallback configuration.

### System Health, Latency & Telemetry
- `GET /api/v1/admin-panel/monitoring/` — PostgreSQL query latency in ms, backend status, AI usage spend in INR (`₹0.00`), and background processing job queue.
- `POST /api/v1/admin-panel/jobs/{id}/retry/` — Reset failed async processing job to queued status for safe retry.

### Administrative Audit Logs
- `GET /api/v1/admin-panel/activity-logs/` — Paginated immutable audit trail with filtering by action, resource type, and search.

### Maintenance Mode Controls
- `GET /api/v1/admin-panel/maintenance/` — Retrieve platform maintenance status and module lockdown flags.
- `POST /api/v1/admin-panel/maintenance/` — Update global and per-module maintenance toggles with custom student notification messages.

### Admin Accounts & Security
- `GET /api/v1/admin-panel/admins/` — List platform administrators and active privileges.
- `POST /api/v1/admin-panel/admins/{id}/deactivate/` — Deactivate admin account (enforces guard against deactivating the last active administrator).
- `POST /api/v1/admin-panel/admins/{id}/reactivate/` — Reactivate deactivated administrator account.
- `GET /api/v1/admin-panel/invitations/` — List sent staff invitations.
- `POST /api/v1/admin-panel/invitations/` — Generate 7-day single-use invitation token for staff onboarding.
- `POST /api/v1/admin-panel/invitations/{id}/revoke/` — Revoke pending staff invitation.
