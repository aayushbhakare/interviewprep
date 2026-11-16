# 09 — Testing and Quality Strategy

## Tools

- Backend: pytest + pytest-django.
- Browser/end-to-end: Playwright.
- Database: PostgreSQL test database.
- Manual API checks: Postman.
- Frontend lint/format: ESLint + Prettier.
- Python lint/format: Ruff.
- API documentation: drf-spectacular.

## Test pyramid

1. Unit tests for business rules and service functions.
2. API/integration tests for serializers, permissions, transactions, and database behavior.
3. Playwright end-to-end tests for user workflows.
4. Manual exploratory checks for voice, provider integrations, accessibility, and responsive behavior.

Do not rely only on happy-path tests.

## Required high-risk test cases

### Authentication
- Registration validation and duplicate email.
- Verification code valid/invalid/expired/reused.
- Login/logout/refresh.
- Password reset.
- Student/admin permission separation.
- Rate limits.

### Roadmap
- Create roadmap with valid setup.
- Optional salary omitted.
- Exactly one language/framework/database.
- Changing language clears framework.
- Topic complete/skip/revisit.
- Progress calculation including quiz submission.
- Quiz submission counts once; retakes do not increase progress.
- New roadmap confirmation.
- Generation failure preserves old roadmap and history.
- Concurrent replacement/submission safety.

### Weekly quiz
- Exactly 45 questions with required category counts.
- No MCQs.
- Timer and auto-submit.
- Leave cancel preserves answers.
- Leave confirm abandons and consumes no attempt.
- Submitted unanswered questions are incorrect.
- Duplicate submit does not create duplicate attempts.
- Five submitted attempts maximum.
- Pending evaluation blocks retake.
- Provider failure does not produce zero/wrong result.
- Historical snapshot unchanged after question version update.
- Only owner can see attempt/history.

### Aptitude
- Daily 5-session limit for standalone submitted sessions.
- Abandoned sessions do not consume limit.
- Mixed aptitude excluded from standalone count.
- Threshold 60% default and admin configurable.
- Fresh question set selection.
- Review answers and results.
- Concurrent submission cannot bypass daily limit.

### Interviews
- Technical/HR/Mixed setup validation.
- Salary required in Practice.
- Tech stack required for Technical/Mixed but not HR.
- Voice connection failure and recovery.
- Manual interruption and Done Speaking behavior.
- Mixed rounds sequential.
- Fail stops later rounds.
- Cooling period is 24 hours for the failed type only.
- Resume snapshot retained.
- PASS/FAIL only in result UI; no prohibited detailed breakdown.

### Experiences
- Draft private.
- Anonymous public display hides name.
- Show my name displays correct public identity.
- All outcomes accepted.
- Flexible stages and multiple rounds.
- Published version remains visible while update is under review.
- Low-risk auto-publish; high-risk review.
- Moderation pass is not represented as authenticity verification.
- Reports and helpful interactions.
- Company filter only applies to experiences.

### Security
Follow `08-security-and-privacy.md` acceptance checklist.

## Playwright journeys

Build Playwright tests as features are delivered, not all at the end. Start with:
1. Register → verify → login.
2. Create roadmap → complete topic → verify progress.
3. Start quiz → answer → submit → see pending/result state.
4. Start aptitude → answer → submit → review.
5. Create experience draft → publish → see moderation state.
6. Admin login → review flagged experience.
7. Student A cannot access Student B's data.

Voice tests may need mocked provider sessions for reliable CI/local automation, plus separate manual real-provider proof-of-concept checks.

## Test data and external services

- Use isolated test database and synthetic test users.
- Mock Gemini, Gmail SMTP, and Supabase for deterministic automated tests.
- Add a small number of opt-in integration tests against real providers only when credentials and quota are intentionally configured.
- Never make normal test suite depend on internet or paid API availability.
- Never use real personal resumes or student data in test fixtures.

## Quality gates

A milestone is not complete until:
- Lint/format checks pass.
- Relevant unit/API tests pass.
- Relevant Playwright journeys pass.
- API schema is updated.
- No secrets or sensitive data are exposed.
- Acceptance criteria are checked.
- Known limitations are documented.
