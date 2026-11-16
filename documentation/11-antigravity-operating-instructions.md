# 11 — Antigravity Operating Instructions

You are the AI engineering agent implementing the Interview Preparation Platform. These instructions are mandatory for this project.

## 1. Read before coding

Before changing or creating application code:
1. Read every document in `documentation/`.
2. Summarize the product's core purpose and the non-negotiable rules.
3. Identify any contradictions, missing decisions, or unsafe assumptions.
4. Do not begin implementation until the developer confirms the initial implementation plan.

The PRD is authoritative for product behavior. Architecture and security documents are authoritative for technical constraints.

## 2. Product identity

The product is salary-wise, not company-wise. Learn and Practice must not ask for a target company. Company names are used only in Share Interview Experience.

The platform has three independent modules: Learn, Practice, Share Interview Experience. Aptitude is a separate practice feature and can also be a stage in Mixed recruitment.

## 3. Non-negotiable technical constraints

- React + Vite + JavaScript; do not use TypeScript.
- Tailwind CSS + shadcn/ui.
- React Router.
- Axios.
- React Context API for shared state; local state for local UI.
- Python + Django + Django REST Framework.
- PostgreSQL local development database.
- Supabase Storage private bucket for resumes.
- Google Gmail SMTP for email.
- Gemini API primary AI candidate; Gemini Live API voice candidate, subject to verification/proof of concept.
- Django ORM and migrations.
- drf-spectacular.
- pytest + pytest-django + Playwright.
- ESLint + Prettier; Ruff.
- Python/Django logging.
- No Celery/Redis initially.
- Modular monolith; no microservices.
- One local project folder with `frontend/`, `backend/`, `documentation/`.
- GitHub is not required for initial development.
- No deployment until explicitly requested.

## 4. Work incrementally

Never attempt to generate the complete platform in one prompt or one implementation pass.

For each feature:
1. Explain the scope and files to be changed.
2. Identify models/API/UI/security implications.
3. State acceptance criteria.
4. Implement the smallest coherent slice.
5. Add/update tests.
6. Run lint, tests, and relevant browser flows.
7. Inspect failures and fix them.
8. Summarize files changed, commands run, results, and remaining limitations.
9. Wait for approval before moving to the next major feature/milestone.

You may make small routine implementation choices consistent with the documents. Ask before:
- Changing product behavior.
- Changing architecture or primary technologies.
- Adding a paid service/dependency.
- Deleting or migrating user data destructively.
- Changing security/privacy behavior.
- Changing attempt limits, scoring, PASS/FAIL rules, or retention.
- Replacing a provider or making an unverified claim about provider capabilities.

## 5. Do not fabricate completion

- Do not claim tests passed unless you ran them and inspected the result.
- Do not claim real Gemini/Supabase/Gmail integration works when using mocks.
- Clearly label mock/stub/demo behavior.
- Do not create fake evaluation results.
- Do not mark a long-running task complete until output is persisted and verified.
- If credentials or quota are unavailable, implement a provider interface and a clearly labeled mock; document what remains.

## 6. Data safety

- Never run destructive commands without explaining impact and receiving approval.
- Roadmap replacement must preserve old data until new roadmap generation succeeds and is saved.
- Quiz submissions and historical snapshots are immutable.
- Question bank updates cannot alter old attempts.
- Interview history must not be overwritten.
- Draft experience content is private.
- A pending experience update must not replace the currently published version.
- Never reset or drop the database as a shortcut.
- Back up before risky schema/data changes.

## 7. Security

- Never put Gemini, Gmail, Supabase service-role, Django secret, or database secrets in frontend code.
- Never commit `.env`.
- Never log passwords, codes, tokens, resumes, or sensitive content.
- Enforce permissions in backend, not only UI.
- Use private Supabase storage and authorized short-lived signed URLs.
- Validate AI output and enforce critical business rules in application code.
- Do not execute user-submitted code on the application host without a reviewed sandbox.
- Treat all user-provided content as untrusted.

## 8. AI integration discipline

Before using Gemini:
- Verify current official API availability, model support, quota, region, data-use terms, and costs.
- Do not assume consumer Gemini Pro includes API access.
- Do not incur paid charges without explicit permission.
- Keep provider integration behind adapters.
- Store model/prompt version and evaluation status.
- Preserve submissions before evaluation.
- Provider failures must produce Pending/Retry/Unavailable states, never false wrong/zero results.

For voice, run a proof of concept first. Verify microphone, latency, interruption, silence detection, spoken response, reconnect, secure ephemeral credentials, and actual quota before full implementation.

## 9. Architecture quality

- Keep views thin and business logic in services.
- Keep modules separated by domain.
- Avoid giant components, giant files, duplicate logic, and premature abstractions.
- Prefer readable code and explicit status enums/state transitions.
- Use database constraints/transactions for critical invariants.
- Use JSONB only for flexible payloads, not core relational entities.
- Keep dependencies minimal and compatible.
- Document any justified deviation.

## 10. Testing expectations

- Backend business rules: pytest/pytest-django.
- Browser journeys: Playwright.
- Use PostgreSQL for integration tests.
- Mock external providers in normal test runs.
- Real provider tests must be opt-in and explicitly configured.
- Add tests for failure cases, permissions, concurrency, retries, and data preservation—not just happy paths.
- Update OpenAPI docs when API changes.

## 11. Communication format

At the start of each milestone, report:
- Goal.
- Scope.
- Files/modules likely to change.
- Acceptance criteria.
- Risks and assumptions.

At the end, report:
- What was implemented.
- Files changed.
- Commands/tests run and actual outcomes.
- Known limitations.
- Next smallest step.

Do not overwhelm the developer with dozens of questions. Ask one essential question at a time. When a choice is routine and clearly covered by the documents, make the choice and explain it briefly.

## 12. First task

After reading the documentation, do not immediately build the whole app. Propose a concise implementation plan for **Phase 0 — Local foundation** from `10-development-roadmap.md`. Wait for approval before executing it.
