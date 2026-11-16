# 12 — Finalized Decisions and Open Items

This document consolidates the product and technical decisions agreed during planning. If a later explicit user-approved decision changes one, update this file and the relevant detailed document.

## Product decisions

- Core positioning: salary-wise, not company-wise.
- Three independent modules: Learn, Practice, Share Interview Experience.
- Registration asks name, email, password only; email verification code.
- No roadmap questions at registration.
- Learn setup occurs only when opening Learn.
- Learn salary is optional; Practice salary is required.
- One active roadmap; replacement requires confirmation and safe generation.
- Self-paced roadmap; no deadlines, pause/resume, or locked topics.
- Topic skip means Not Verified, not completed.
- Weekly quizzes are 45 non-MCQ questions with fixed category distribution.
- Quiz duration 75 minutes; max 5 submitted attempts per week/roadmap.
- Quiz evaluation pending must not be treated as wrong/zero.
- Aptitude is separate and also may be a Mixed stage; freshers only.
- Aptitude standalone initial daily limit 5 submitted sessions; Mixed doesn't consume it.
- Mixed aptitude qualifying threshold initially 60%.
- Practice interviews are voice-only; no avatar; simple profile image.
- Technical/HR/Mixed interviews; PASS/FAIL only.
- Mixed has 3–4 rounds; fail ends process; 24-hour cooling period.
- Share experiences support anonymity, drafts, flexible stages, all outcomes, risk-based moderation.
- Moderation pass is not proof of authenticity.
- Company name is only for Share Experience discovery.
- Admin starts with one role, with architecture ready for future roles.
- Admin requires invitation-only access and mandatory 2FA.

## Technical decisions

| Area | Finalized choice |
|---|---|
| Frontend | React + Vite |
| Language | JavaScript, not TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router |
| API client | Axios |
| Shared frontend state | React Context API + local component state |
| Backend | Python + Django |
| API | Django REST Framework, REST, `/api/v1/` |
| API docs | drf-spectacular |
| Database | PostgreSQL, local during development |
| ORM/schema | Django ORM + migrations |
| Architecture | Modular monolith, one Django project |
| AI code organization | Python modules inside backend initially |
| AI provider | Gemini API primary candidate, subject to quota/access/terms |
| Voice provider | Gemini Live API candidate, subject to proof of concept |
| File storage | Supabase Storage, private bucket |
| Email | Google Gmail SMTP |
| Background work | No Celery/Redis initially; design for later migration |
| Testing | pytest, pytest-django, Playwright, PostgreSQL test DB, Postman |
| Code quality | ESLint + Prettier; Ruff |
| Logging | Python/Django logging |
| Secrets | python-decouple backend; Vite public env only; `.env.example` |
| GitHub | Not required initially; local project files and Markdown docs |
| Deployment | Deferred until development is complete |

## Initial budget

₹0 initial development budget. Use local services and free tiers where available. Verify current limits and costs before using external providers. Do not incur charges without explicit approval.

## Open items to resolve at implementation time

These are not reasons to delay all planning. Resolve them just before the relevant feature:
1. Exact compatible stable dependency versions.
2. Exact Supabase project/bucket configuration and current free-tier limits.
3. Gmail account setup, 2-Step Verification, App Password, and current sending limits.
4. Gemini API access, eligible models, free-tier quotas, data terms, and current pricing.
5. Gemini Live proof-of-concept results and browser support.
6. Initial resume file-size limit and PDF validation library.
7. Exact JWT lifetimes, refresh strategy, and secure browser storage approach.
8. Exact email code expiry/resend limits.
9. Exact account deletion and retention policy before production.
10. Exact backup retention and restore procedure before production.
11. Current applicable TCS NQT pattern at the time Aptitude is implemented.
12. Safe sandbox approach for executing coding submissions.
13. Initial processing mechanism for long-running jobs without Celery/Redis.
14. Exact model/prompt versions and evaluation rubrics for each AI feature.

## Important cautions

- Free tiers can change. Never promise a service remains free.
- Consumer Gemini subscription is not API entitlement.
- Do not claim AI-generated or student-reported questions are verified facts.
- Do not claim a moderation pass proves a recruitment experience is authentic.
- Do not use AI provider output as the sole authority for critical business rules.
- Never lose submitted user data because of provider failures.
- Do not begin deployment without explicit approval.
