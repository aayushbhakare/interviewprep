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

## Planned Domain Endpoints

- **Quizzes (`/api/v1/quizzes/`):** Assignment readiness, 45-question attempts, timer, autosave, submission, evaluation.
- **Aptitude (`/api/v1/aptitude/`):** Standalone & Mixed sessions, question palette, scoring, daily limit.
- **Interviews (`/api/v1/interviews/`):** Voice interview simulation, round progression, PASS/FAIL outcomes, cooling period.
- **Experiences (`/api/v1/experiences/`):** Submission, draft saving, moderation, search, filtering.
- **Admin Panel (`/api/v1/admin-panel/`):** Platform metrics, student management, moderation queues, activity logs.
