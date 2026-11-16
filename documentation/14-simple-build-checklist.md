# 14 — Simple Build Checklist for Us

Use this as the one-page progress tracker. Do not restart planning after every phase. Mark a phase complete only when its exit checks pass.

## Before starting
- [ ] Open the ZIP and keep the `documentation/` folder unchanged as the project specification.
- [ ] Give Antigravity the root `README.md` and ask it to read all documents before proposing work.
- [ ] Tell it: “Start with Phase 0 only. Do not build later phases yet.”
- [ ] Keep the project local. No GitHub or deployment required.
- [ ] No paid service, subscription, or API usage without explicit approval.

## Phase tracker

| Phase | Deliverable | Done when |
|---|---|---|
| 0. Local foundation | React + Vite + JS, Django + DRF, PostgreSQL, custom user model, env files, lint/tests, health check | Both apps run locally, DB connects, clean migrations and test commands work. |
| 1. Accounts | Register, email verification, login/logout/refresh, reset, profile, admin bootstrap/2FA | Full auth journey and permission/security tests pass. |
| 2. UI shell | Student/admin layouts, routing, dashboard, responsive design | Student and admin route access is correctly separated. |
| 3. Learn foundation | Setup wizard, roadmap structure, progress, skip/revisit, safe replacement | Roadmap behavior matches PRD and tests pass. |
| 4. Learning content | Topic content/versioning, references, exercises | Content is reusable/versioned; exercises work without affecting roadmap progress. |
| 5. Weekly quizzes | Bank, assignment, 45-question attempt, timer, submit/evaluate, history | All quiz rules and provider-failure cases pass. |
| 6. Aptitude | Shared bank, standalone sessions, Mixed threshold integration | Daily limit, abandonment, result review and Mixed rules pass. |
| 7. Share experience | Drafts, flexible stages, anonymity, moderation, discovery | Draft privacy, versioned moderation and discovery work. |
| 8. Practice | Voice proof-of-concept, Technical/HR/Mixed | Real voice requirements verified; PASS/FAIL, cooling and round flow pass. |
| 9. Admin | All 11 admin sections and monitoring | Permissions, settings, moderation, logs and maintenance controls pass. |
| 10. Hardening | Security, regression, accessibility, restore and cost review | No critical defects; backup/restore and privacy policy are reviewed. |

## At the end of every feature, ask Antigravity for this report
1. What changed? List files.
2. Which PRD requirements were implemented?
3. Which API/model/UI pieces were added?
4. Which tests were run? Give actual pass/fail counts and commands.
5. What remains mocked, incomplete or blocked?
6. Did any approved decision change? If yes, update the documentation and show the diff.
7. What is the next smallest feature?

## Stop and ask us before
- Changing the selected technology stack or architecture.
- Adding a paid service or incurring API charges.
- Changing product rules, scoring, attempt limits, PASS/FAIL or retention.
- Deleting/migrating user data destructively.
- Sending resumes or personal data to an AI provider.
- Claiming a real provider integration works when it is mocked.

## Keep decisions simple
If a detail is already in the PRD, implement it. If it is a routine technical choice within the agreed stack, choose a sensible option and document it. If it affects cost, privacy, security, destructive data behavior or product experience, ask one clear question at the time it becomes necessary.
