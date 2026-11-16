# Interview Preparation Platform — Antigravity Blueprint

This folder is the authoritative product and engineering blueprint for building the Interview Preparation Platform.

## Read these documents in order

1. `01-project-overview.md`
2. `02-product-requirements.md`
3. `03-system-architecture.md`
4. `04-database-design.md`
5. `05-api-contracts.md`
6. `06-ui-ux-guidelines.md`
7. `07-ai-and-voice-integration.md`
8. `08-security-and-privacy.md`
9. `09-testing-and-quality.md`
10. `10-development-roadmap.md`
11. `11-antigravity-operating-instructions.md`
12. `12-decisions-and-open-items.md`

## Audit and build checklist

After reading the original requirements, read `13-blueprint-audit-and-build-readiness.md` and use `14-simple-build-checklist.md` to track milestones. The audit identifies which decisions are settled and which should be resolved just before implementation.

## Authority and conflict resolution

- Product behavior and business rules in `02-product-requirements.md` are authoritative.
- Architecture constraints in `03-system-architecture.md` are authoritative unless a later explicit user-approved decision changes them.
- `12-decisions-and-open-items.md` records finalized decisions and items that must be verified or decided during implementation.
- If code, generated suggestions, or an external tutorial conflicts with these documents, follow these documents.
- Do not silently change product rules. Record a proposed change and ask for approval.

## How to use with Antigravity

Open the project folder in Antigravity and provide `11-antigravity-operating-instructions.md` as the primary operating instruction. Ask it to read the remaining documents before creating code. Build one milestone at a time and require the tests and acceptance criteria to pass before proceeding.

## Important project principle

The platform is **salary-wise, not company-wise**. The product prepares and evaluates students against an expected interview standard for their target salary range. Company names are collected only for Share Interview Experience discovery and filtering, not for Learn or Practice.

## Initial budget and development assumptions

- Initial development budget: ₹0.
- Build locally first. Deployment is deliberately deferred.
- Local PostgreSQL runs on the developer's Mac.
- Supabase Storage is used for private resume files.
- Google SMTP is the planned email transport.
- Gemini API is the primary AI provider, subject to actual API access, model capabilities, quotas, terms, and cost.
- Gemini Live API is the first candidate for real-time voice interviews, subject to a working proof of concept.
- Gemini consumer subscription does not imply API access or free API usage.
- Keep all external provider integrations replaceable.
- Do not enable paid services or incur costs without explicit approval.

## Non-goal

Do not attempt to generate the entire application in one giant code-generation operation. Implement, test, review, and stabilize each milestone.
