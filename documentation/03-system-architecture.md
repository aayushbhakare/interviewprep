# 03 — System Architecture

## Architecture style

Use a **modular monolith**: one Django project and one PostgreSQL database, separated into focused Django apps. Do not create microservices initially.

## High-level request flow

Browser (React) → Axios → Django REST Framework → application/domain services → PostgreSQL / Supabase Storage / Gemini / Gmail SMTP.

All provider calls and secret-bearing operations go through Django. React must never hold permanent provider secrets.

## Repository / local folder layout

```text
interview-preparation-platform/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router/
│   │   │   └── providers/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   └── shared/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── learning/
│   │   │   ├── practice/
│   │   │   ├── aptitude/
│   │   │   ├── experiences/
│   │   │   └── admin/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── layouts/
│   │   └── assets/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── config/
│   ├── apps/
│   │   ├── accounts/
│   │   ├── learning/
│   │   ├── content/
│   │   ├── questions/
│   │   ├── quizzes/
│   │   ├── aptitude/
│   │   ├── interviews/
│   │   ├── experiences/
│   │   ├── administration/
│   │   └── ai_services/
│   ├── common/
│   ├── media/              # local development only; do not store resume files here
│   ├── requirements.txt
│   └── manage.py
├── documentation/
└── README.md
```

Resume file bytes go to Supabase Storage, not local Django media. The `media/` directory may be used for non-sensitive development-only artifacts if needed, but must not become the resume store.

## Frontend architecture

- React + Vite + JavaScript only; do not migrate to TypeScript.
- Tailwind CSS + shadcn/ui for base UI primitives.
- Build custom feature-specific components for roadmap, quiz, voice interview, and experience timeline.
- React Router for routing, nested layouts, and protected routes.
- Axios instance in `services/` with base URL, request/response handling, and consistent error processing.
- React Context API for global shared state (authenticated user, role/session, other truly shared state).
- Local component state for forms, modals, question navigation, and feature-local interactions.
- Do not introduce Redux unless a concrete need is demonstrated and approved.
- Separate student and admin route trees and layouts.
- Feature-based organization; each feature owns its pages/components/hooks/services where practical.

## Backend architecture

- Django + Django REST Framework.
- Apps own domain models, serializers, views/viewsets, URLs, permissions, and service functions.
- Keep views thin. Put business rules in service/domain modules, not giant view functions.
- Use Django ORM. PostgreSQL is the source of truth.
- Use JSONB only for genuinely variable structured payloads; do not use it instead of relational modeling for core entities.
- API prefix `/api/v1/`.
- drf-spectacular generates OpenAPI/Swagger documentation.
- Separate AI provider logic in Python modules inside `ai_services` initially. It may be extracted later without redesigning business logic.
- Keep provider adapters replaceable.

## Suggested domain ownership

- `accounts`: users, profiles, roles, verification, password recovery, resume metadata and references.
- `learning`: roadmap configuration, active roadmap, phases/weeks, topic progress, replacement workflow.
- `content`: reusable topic content and content versions.
- `questions`: shared question bank, question versions, validation/report states, seen-question tracking.
- `quizzes`: student quiz assignments, immutable attempt snapshots, answers, evaluations, attempt history.
- `aptitude`: shared aptitude bank, session assignments, answers, results, daily limits.
- `interviews`: setup, session/round orchestration, transcript/audio metadata only as permitted, evaluation, result, cooling periods, resume snapshot reference.
- `experiences`: drafts, published experience versions, stages/rounds, moderation, helpful/report interactions.
- `administration`: admin settings, admin activity logs, maintenance controls.
- `ai_services`: provider clients, prompts, structured response validation, quotas, usage records, fallback/error normalization.

## Data and provider boundaries

### PostgreSQL
Permanent source of truth for users, roles, roadmaps, content metadata and versions, shared question bank, assignments, attempts, answers, evaluations, interview outcomes, experiences, moderation, settings, and audit records.

### Supabase Storage
Private object storage for PDF resumes. PostgreSQL stores owner, object key/path, file metadata, and version association. Never store a public URL as the only access control mechanism.

### Gemini
AI generates/evaluates only. Store durable outputs and their model/prompt/version metadata in PostgreSQL. Never rely on provider conversation history as the only record.

### Gmail SMTP
Send verification, password reset, and quiz-evaluation-ready emails through a backend email service.

## Background processing approach

Do not add Celery or Redis in the initial implementation. However:
- Do not hold an HTTP request open for long AI operations.
- Model long-running work as a task/job with status, timestamps, retry count, and error state.
- Use simple controlled processing initially, with a path to a future worker/queue.
- For evaluation, preserve submitted answers first, return a pending status, and process/retry safely.
- **Recommended initial local mechanism:** a PostgreSQL-backed `ProcessingJob` table plus a Django management-command worker (run in a separate terminal during local development). Jobs must be claimable safely, have leases/timeouts, bounded retries, idempotency keys, and recoverable failure states. This avoids introducing Celery/Redis while providing a real worker process rather than relying on an HTTP request finishing background work.
- The web app must show a clear worker-unavailable/pending state if the worker is not running. Do not silently mark work complete.
- Keep the job interface independent of the worker implementation so a queue such as Celery can be added later if needed.
- Never lose user work because a provider times out.
- Do not claim a task is complete until its result is persisted.

## Configuration and versions

- Use `.env` files locally and `.env.example` placeholders.
- Django configuration via `python-decouple`.
- Vite environment variables may contain only public frontend configuration.
- Pin dependency versions in lockfiles/requirements files after selecting mutually compatible stable releases.
- Do not guess latest version numbers in documentation. At setup time, verify current stable versions and compatibility, then record them.

## No deployment work yet

Local development only. Do not configure production hosting, domains, paid infrastructure, CI/CD, or production secrets unless explicitly requested later.
