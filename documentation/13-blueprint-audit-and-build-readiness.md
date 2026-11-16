# 13 — Blueprint Audit: Results and Fix List

**Audit date:** 10 November 2026  
**Scope:** Existing 14-file Markdown blueprint, checked against the product and technical decisions established in planning.  
**Verdict:** **Strong foundation; not yet a zero-supervision build specification.** The product is broadly covered, but several implementation contracts need to be made explicit before Antigravity can build the whole platform reliably.

## 1. Executive result

| Area | Result | What it means |
|---|---|---|
| Product vision and module boundaries | PASS | Salary-wise positioning and three independent modules are clear. |
| Learn and roadmap behavior | PASS with detail checks | Main setup, self-paced behavior, progress, replacement safety, content and exercises are documented. |
| Weekly quiz rules | PASS | Question mix, timer, abandonment, pending evaluation, attempts, history and snapshots are present. |
| Aptitude | PASS with open implementation details | Standalone/Mixed distinction, freshers-only rule, shared bank, daily limit and threshold are present. |
| Practice interviews | PASS with provider dependency | Voice-only UX, interview types, Mixed flow, PASS/FAIL, feedback and cooling period are present. |
| Share Interview Experience | PASS | Drafts, anonymity, flexible stages, moderation, discovery and student-reported questions are covered. |
| Admin panel | PASS at product level | All 11 navigation areas and major responsibilities are described. |
| Database design | PARTIAL | Entity map is good, but state machines, processing recovery and some snapshots need explicit treatment. |
| API contracts | PARTIAL | Endpoint list is a useful outline, not an implementation-ready contract; several flows are missing. |
| UI/UX | PARTIAL | Screen-level principles exist; detailed states and acceptance checks need to be built alongside each feature. |
| AI, voice and cost controls | PASS with blockers | Sensible provider abstraction and safeguards; real voice feasibility and quotas require proof-of-concept. |
| Security | PASS with unresolved policy choices | Good baseline; token, retention, file-size and sandbox choices remain open. |
| Testing | PASS with expansion needed | High-risk cases included; traceability and complete acceptance coverage should be added per milestone. |
| Antigravity instructions | PASS | Incremental implementation, approvals, tests and honest reporting are clear. |

## 2. Important corrections already applied

1. **Backups are no longer described as a finalized daily schedule.** Backup frequency and retention were not agreed. The PRD now says backups are required before production, while frequency, retention and implementation remain open.
2. **No-Celery/Redis processing now has a concrete recommended starting design.** Use a PostgreSQL-backed job table and a separate Django management-command worker for local development. This is a recommendation within the accepted no-Celery/Redis constraint, not a claim that a worker already exists.
3. **API workflow coverage has been expanded.** The API document now lists missing flows that must be specified as each module is implemented.
4. **Database state-machine requirements have been expanded.** The database document now calls out transitions, crash recovery, immutable submissions, and per-session configuration snapshots.

## 3. Must resolve before the relevant feature is built

These are genuine implementation gates, not reasons to restart product planning:

| Gate | Why it matters | When to resolve |
|---|---|---|
| Local job worker behavior | Quiz evaluation, roadmap preparation and moderation cannot reliably finish as “background work” without a worker process. | Phase 0/5 foundation |
| Gemini API entitlement, quotas, pricing and terms | A consumer Gemini Pro/Jio plan does not itself prove API access or free API quota. | Before first real AI integration |
| Real-time voice proof-of-concept | Browser voice, latency, interruption, silence detection, secure session credentials and cost must work together. | Before Practice implementation |
| Code-execution sandbox | Coding answers must not run arbitrary untrusted code on the Django host. | Before quiz/exercise coding evaluation |
| Authentication token storage/lifetimes | Affects login, refresh, browser security and admin sessions. | Phase 1 |
| Admin 2FA recovery | Mandatory 2FA without safe recovery can lock out the only admin. | Phase 1 |
| Resume upload constraints | Need size limit, robust PDF validation and safe storage lifecycle. | Before resume upload |
| Account deletion/retention | Must define what is deleted, anonymized or retained. | Before account deletion/production |
| Aptitude pattern and clock reset | Verify prevailing cognitive pattern; choose the timezone defining the daily reset. | Phase 5 |
| Mixed interview round blueprint | Define role/experience-based round templates and where aptitude is inserted for freshers. | Before Mixed interviews |
| Backup/restore policy | Frequency, retention, storage and recovery ownership are not finalized. | Before production |

## 4. Build-time items that should not block Phase 0

- Exact stable dependency versions (verify compatibility at setup).
- Supabase project/bucket and current free-tier limits.
- Gmail SMTP setup and sending limits.
- Gemini model per feature and prompt versions.
- Initial PDF size limit and validation library.
- Exact email code expiry/resend limits.
- Exact JWT access/refresh settings and browser storage.
- Exact backup frequency/retention.
- Exact cognitive assessment pattern applicable on implementation date.
- Exact AI evaluation rubrics and model selection.

Do not turn these into a new round of broad product discussions. Resolve one when its implementation phase needs it, record the answer in `12-decisions-and-open-items.md`, then continue.

## 5. Traceability rule

For every feature, Antigravity must be able to point to:

1. The product requirement in `02-product-requirements.md`.
2. The relevant model/state/snapshot in `04-database-design.md`.
3. The API contract and permissions in `05-api-contracts.md`.
4. The screen and states in `06-ui-ux-guidelines.md`.
5. The tests and acceptance criteria in `09-testing-and-quality.md`.

If one of these is missing, mark the feature **not ready**, add the missing detail, and do not quietly invent behavior.

## 6. Final Antigravity readiness checklist

- [ ] Antigravity has read the root README and all numbered documents.
- [ ] It confirms the non-negotiable stack: React/Vite/JavaScript, Django/DRF, PostgreSQL, modular monolith.
- [ ] It confirms no GitHub requirement, no deployment work, and no paid service without approval.
- [ ] It proposes Phase 0 only; it does not generate the entire application in one pass.
- [ ] It confirms the local database and custom Django user model are established before first migration.
- [ ] It includes a separate local job-worker command if background tasks are implemented.
- [ ] It gives exact acceptance criteria and test commands for every milestone.
- [ ] It marks provider integrations as mock until real credentials/quota/behavior are verified.
- [ ] It does not claim completion for unrun tests or mocked integrations.
- [ ] It updates the relevant Markdown decision and implementation docs when an approved decision changes.

## 7. What to do next

**Do not do another broad planning round.** Start Antigravity with the root README and ask it to perform only Phase 0 from `10-development-roadmap.md`. Review its proposed file structure and setup commands, then let it implement the local foundation. Decide unresolved provider/security details only when the relevant feature is next.

The blueprint is now suitable to begin Phase 0. It is not a promise that every later module can be implemented without any further technical choices; those choices are isolated above and should be made just-in-time.
