# 10 — Development Roadmap

Build incrementally. Do not generate the entire platform in one operation.

## Phase 0 — Local foundation
- Create project root and documentation folder.
- Initialize React + Vite + JavaScript frontend.
- Initialize Django backend and custom user model before first migration.
- Install/configure DRF, SimpleJWT, drf-spectacular.
- Install PostgreSQL locally and connect Django.
- Configure `.env` / `.env.example` / `.gitignore`.
- Configure ESLint + Prettier and Ruff.
- Add health-check endpoint.
- Add pytest/pytest-django and Playwright skeleton.
- Verify frontend talks to backend.
- Verify migrations work on a clean database.

**Exit criteria:** clean local setup documented; frontend/backend run; DB connected; tests execute.

## Phase 1 — Authentication and account foundation
- Registration with name/email/password.
- Google SMTP verification code.
- Login, refresh, logout.
- Password reset.
- Profile.
- Student/admin role foundations.
- Admin bootstrap and 2FA design/implementation.
- Security tests.

**Exit criteria:** end-to-end register, verify, login, logout, reset; permission tests pass.

## Phase 2 — Shared UI shell
- Student layout/navigation/dashboard skeleton.
- Admin layout/navigation skeleton.
- Protected routes.
- Shared components and design tokens.
- Responsive behavior.
- Loading/error/empty states.

**Exit criteria:** role-based route protection and layouts work.

## Phase 3 — Learn foundation
- Learn setup flow and validation.
- Role/experience/salary/stack selections.
- Roadmap generation orchestration (initially mocked or deterministic templates if AI access is not ready).
- Phases/weeks/topics.
- Topic content/version model.
- Progress/skip/Not Verified behavior.
- Roadmap replacement safe transaction.

**Exit criteria:** create, view, navigate, update progress, skip/revisit, replace safely.

## Phase 4 — Content and exercises
- Reusable content library and versions.
- Curated references.
- AI content generation adapter.
- Automated code/SQL/schema checks.
- Topic exercises and evaluation.
- Student-reported question integration design.

**Exit criteria:** content versioning and exercise flows work; AI failures preserve state.

## Phase 5 — Question bank and weekly quizzes
- Shared question bank and versions.
- AI validation and reports.
- Quiz preparation/assignment.
- 45-question quiz UI.
- Timer, section navigation, abandon/submit.
- Evaluation pipeline and Pending state.
- Five-attempt limit and history snapshots.
- Admin question bank management.

**Exit criteria:** all quiz business rules and failure cases pass.

## Phase 6 — Aptitude
- Shared aptitude bank.
- Current applicable NQT pattern research at implementation time.
- Session selection and attempt limits.
- Test UI, timer/navigation, results/history.
- Mixed-mode qualifying logic.

**Exit criteria:** standalone and Mixed aptitude rules pass.

## Phase 7 — Share Interview Experience
- Draft editor and flexible timeline/stages.
- Anonymous/show-name.
- Publish/update moderation workflow.
- Automated low-risk moderation and admin review queue.
- Discovery/search/filter/sort.
- Helpful/report interactions.
- Student-reported questions.

**Exit criteria:** drafts, versions, moderation, anonymity, discovery, and permissions pass.

## Phase 8 — Practice interviews
Build a small voice proof of concept before full integration.
- Provider capability/quota validation.
- Secure session bootstrap.
- Voice UI and controls.
- Technical/HR interview orchestration.
- Mixed round flow and aptitude stage.
- PASS/FAIL and feedback.
- Cooling period/history.
- Resume snapshot association.

**Exit criteria:** real-time voice requirements verified; all interview rules tested.

## Phase 9 — Admin and operations
- Dashboard metrics/attention queue.
- Student management.
- Learning content management.
- Question bank and aptitude management.
- Experience moderation.
- Platform settings.
- AI model management.
- AI/system monitoring.
- Activity log.
- Maintenance controls.
- Backup/restore plan and restore test.

**Exit criteria:** admin can operate and monitor platform with role checks and audit logging.

## Phase 10 — Hardening and pre-deployment review
- Full regression.
- Security review.
- Accessibility/responsive review.
- Data retention/account deletion review.
- Performance and load checks.
- Backup/restore rehearsal.
- Provider quota/cost review.
- Documentation and known-issues review.

Deployment is a separate future stage and must not start automatically.

## Development rules
- Work one phase and a small feature at a time.
- Before coding a feature, state scope and acceptance criteria.
- After coding, run tests and report exact results.
- Do not mark a feature complete if tests were skipped or failed.
- Do not build a later module on unstable foundations.
- Use mocks when provider access is unavailable; clearly label mock behavior.
- Never fabricate a successful real AI/voice integration.
