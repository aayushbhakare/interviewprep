# 05 — API Contract and Backend Conventions

## General rules

- Build REST APIs with Django REST Framework.
- Prefix all endpoints with `/api/v1/`.
- Generate OpenAPI docs using drf-spectacular.
- Use consistent status codes, validation errors, and response shapes.
- Keep views thin; business logic in services.
- Enforce permissions on the backend. Hiding a button in React is not authorization.
- Validate every input on the server.
- Make state-changing endpoints safe against duplicate submissions where appropriate.

## Suggested endpoint groups (not a final exhaustive endpoint list)

### Authentication / accounts
- `POST /api/v1/auth/register/`
- `POST /api/v1/auth/verify-email/`
- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/token/refresh/`
- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/password-reset/request/`
- `POST /api/v1/auth/password-reset/confirm/`
- `GET/PATCH /api/v1/account/profile/`
- `POST /api/v1/account/resume/`
- `GET /api/v1/account/resume/`
- `DELETE /api/v1/account/resume/`

### Learn
- `GET/POST /api/v1/learning/roadmaps/`
- `GET /api/v1/learning/roadmaps/active/`
- `POST /api/v1/learning/roadmaps/replace/`
- `GET /api/v1/learning/roadmaps/{id}/`
- `PATCH /api/v1/learning/topics/{id}/progress/`
- `GET /api/v1/content/topics/{id}/`
- `GET /api/v1/learning/weeks/{id}/quiz-status/`

### Quizzes
- `POST /api/v1/quizzes/assignments/{id}/attempts/`
- `GET /api/v1/quizzes/attempts/{id}/`
- `PATCH /api/v1/quizzes/attempts/{id}/answers/`
- `POST /api/v1/quizzes/attempts/{id}/submit/`
- `GET /api/v1/quizzes/attempts/{id}/evaluation-status/`
- `GET /api/v1/quizzes/history/`
- `POST /api/v1/questions/{id}/reports/`

### Aptitude
- `POST /api/v1/aptitude/sessions/`
- `GET /api/v1/aptitude/sessions/{id}/`
- `PATCH /api/v1/aptitude/sessions/{id}/answers/`
- `POST /api/v1/aptitude/sessions/{id}/submit/`
- `GET /api/v1/aptitude/history/`

### Practice interviews
- `POST /api/v1/interviews/sessions/`
- `GET /api/v1/interviews/sessions/{id}/`
- `POST /api/v1/interviews/sessions/{id}/rounds/{round_id}/start/`
- `POST /api/v1/interviews/sessions/{id}/rounds/{round_id}/complete/`
- `GET /api/v1/interviews/history/`

Voice transport may require a provider-specific ephemeral credential/session bootstrap endpoint. The backend must authorize the user and issue only short-lived credentials. Never return permanent provider API keys.

### Share experience
- `GET/POST /api/v1/experiences/`
- `GET/PATCH/DELETE /api/v1/experiences/{id}/`
- `POST /api/v1/experiences/{id}/publish/`
- `POST /api/v1/experiences/{id}/helpful/`
- `POST /api/v1/experiences/{id}/reports/`
- `GET /api/v1/experiences/discover/`

### Admin
Use separate `/api/v1/admin/...` endpoints with explicit admin permissions for students, content, question bank, moderation, settings, monitoring, activity log, and maintenance.


## Required workflow coverage (complete during each module implementation)

The endpoint groups above are a starting map, not a permission to omit product flows. Before a module is considered API-complete, document request/response schemas, ownership rules, status transitions, idempotency, and failure behavior for each of these:

- **Accounts:** resend/expire verification code, change email with re-verification, change password, account deletion request/confirmation, resume upload/replace/metadata/download-authorized URL, and resume-version history/reference.
- **Learn:** setup-option/catalog endpoints (including language-to-framework compatibility), roadmap-generation status, safe replacement confirmation, phase/week/topic retrieval, topic complete/skip/revisit, progress summary, topic exercise attempts/evaluation, and student-reported-question display/source labels.
- **Weekly quizzes:** assignment readiness, attempt start, answer save, timer/expiry handling, abandon, submit, evaluation status/retry, history, attempt review, and question reporting. Enforce the 45-question distribution and five-submitted-attempt limit on the server.
- **Aptitude:** eligibility, daily remaining attempts, fresh session creation, answer save, abandon, submit, result/review, history, and the separate Mixed-recruitment path that does not consume standalone daily attempts.
- **Practice:** setup validation, secure voice-session bootstrap/refresh/end, round start/complete, Mixed progression, result/feedback, history, and cooling-period eligibility. Do not persist/display interview transcripts in student result screens.
- **Experiences:** draft create/read/update/delete, publish, pending update, moderation status, discovery/search/filter/sort, helpful toggle, report, and owner-only edit/delete. Public serialization must honor anonymity.
- **Admin:** explicitly enumerate endpoints and permissions for all 11 admin navigation sections. Include invitation/bootstrap, 2FA verification/recovery, student suspend/reactivate, content/question version operations, aptitude bank operations, moderation queue/reports, settings, AI provider configuration (masked secrets only), monitoring, immutable activity log, and module maintenance controls.

Every long operation must return a durable resource/job ID and a documented status endpoint. Polling intervals/backoff, retry ownership, cancellation rules (if any), and what the user sees on timeout must be specified per operation. Never expose a generic admin endpoint without object-level permission checks.

## Response conventions

Choose and document a consistent response envelope. Example success:

```json
{
  "data": {},
  "meta": {}
}
```

Example validation error:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Please correct the highlighted fields.",
    "details": {
      "email": ["Enter a valid email address."]
    }
  }
}
```

Do not leak stack traces, secrets, internal provider payloads, or personal data in client errors.

## Status-driven long operations

For roadmap generation, quiz evaluation, content generation, moderation, and AI tasks, use explicit statuses such as:
- `queued`
- `processing`
- `ready`
- `completed`
- `pending`
- `failed`
- `temporarily_unavailable`

Return a stable resource ID and status. Frontend can poll a status endpoint with sensible backoff. Do not keep an HTTP request open indefinitely.

## Idempotency and concurrency

- Quiz submit must be idempotent: double-click/retry must not create duplicate attempts or duplicate evaluations.
- Aptitude submit must be idempotent.
- Attempt counters must be concurrency-safe.
- Roadmap replacement must be transactional and preserve old roadmap if new generation fails.
- Experience publish/update must not expose an unmoderated update.
- Use ownership checks on every user-specific resource.

## API documentation

- Annotate endpoints and serializers for drf-spectacular.
- Document authentication, permissions, request/response examples, statuses, and error cases.
- Keep OpenAPI schema generated from actual code; do not hand-maintain a disconnected API spec.
