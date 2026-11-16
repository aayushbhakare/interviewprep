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

## Planned Domain Endpoints

- **Learning (`/api/v1/learning/`):** Catalog, roadmap generation, replacement, topic progress.
- **Quizzes (`/api/v1/quizzes/`):** Assignment readiness, 45-question attempts, timer, autosave, submission, evaluation.
- **Aptitude (`/api/v1/aptitude/`):** Standalone & Mixed sessions, question palette, scoring, daily limit.
- **Interviews (`/api/v1/interviews/`):** Voice interview simulation, round progression, PASS/FAIL outcomes, cooling period.
- **Experiences (`/api/v1/experiences/`):** Submission, draft saving, moderation, search, filtering.
- **Admin Panel (`/api/v1/admin-panel/`):** Platform metrics, student management, moderation queues, activity logs.
