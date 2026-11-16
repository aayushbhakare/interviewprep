# Testing Report

This report records automated and manual test runs, pass/fail results, and verified acceptance criteria.

---

## Test Execution Summary

| Test Suite | Framework | Total Tests | Passed | Failed | Skipped | Status | Verified Date |
|---|---|---|---|---|---|---|---|
| Backend Foundation Unit & API Tests | pytest-django | 2 | 2 | 0 | 0 | **PASSED** | 2026-11-15 |
| Authentication & User Management (Phase 1) | pytest-django | 29 | 29 | 0 | 0 | **PASSED** | 2026-11-15 |
| Student Dashboard API Tests (Phase 2) | pytest-django | 3 | 3 | 0 | 0 | **PASSED** | 2026-11-16 |
| Learn Module & Roadmap Tests (Phase 3) | pytest-django | 15 | 15 | 0 | 0 | **PASSED** | 2026-11-16 |
| Shared Question Bank & Weekly Quizzes (Phase 4) | pytest-django | 12 | 12 | 0 | 0 | **PASSED** | 2026-11-16 |
| Aptitude Practice Module (Phase 5) | pytest-django | 12 | 12 | 0 | 0 | **PASSED** | 2026-11-16 |
| AI Interview Practice Module (Phase 6) | pytest-django | 15 | 15 | 0 | 0 | **PASSED** | 2026-11-16 |
| **Total Backend Test Suite** | **pytest-django** | **88** | **88** | **0** | **0** | **PASSED** | **2026-11-16** |
| Python Linting & Formatting | Ruff | 86 files | 86 | 0 | 0 | **PASSED** | 2026-11-16 |
| Frontend ESLint Code Quality | ESLint | 48 files | 48 | 0 | 0 | **PASSED** | 2026-11-16 |
| Frontend Production Build | Vite | 1683 modules | 1683 | 0 | 0 | **PASSED** | 2026-11-16 |
| Playwright E2E Tests (Phases 1 through 6) | Playwright (Chrome) | 19 | 19 | 0 | 0 | **PASSED** | 2026-11-16 |
| OpenAPI Schema Validation | drf-spectacular | 75 endpoints | 75 | 0 | 0 | **PASSED** | 2026-11-16 |

---

## Acceptance Criteria Verification Log

### Phase 6: AI-Powered Interview Practice Module
- [x] **Three Interview Tracks:** Full operational capability for Technical Interviews, HR Interviews, and Mixed Sequential Multi-Round Pipelines.
- [x] **Strict Generic Positioning:** Tailored to compensation tiers (₹3–5 LPA through ₹30+ LPA) and job roles with zero company branding, templates, or selection menus.
- [x] **Strict Binary Verdicts:** Evaluates sessions into unambiguous `INTERVIEW PASSED` or `INTERVIEW NOT CLEARED` with structured qualitative feedback. No scores, marks, or percentages.
- [x] **Independent 24-Hour Cooling:** Enforced per `(user, interview_type)`. Failing technical never locks HR or Mixed. Abandonment and passing incur 0 cooling.
- [x] **Sequential Mixed Recruitment Pipeline:** Freshers take 4 rounds (Aptitude -> Tech 1 -> Tech 2 -> HR); experienced take 3 rounds. Round 1 Aptitude requires 60% qualifying score to unlock Round 2; failing aborts pipeline with `FAIL`.
- [x] **Real-Time Voice Architecture & Zero Budget:** Web Speech STT and TTS provide zero-latency voice interaction with ₹0 API cost. Automatic 1.8s silence detection, manual "Interrupt Interviewer" button, and fallback text input.
- [x] **Audio Diagnostics PoC:** Interactive `VoicePoCModal` for candidate mic permission verification and audio test playback.
- [x] **Resume Version Snapshotting:** Preserves immutable snapshot reference of user's active resume version (`UserResumeVersion`) at session creation time.
- [x] **Staff Admin Console:** Admin interface to manage cooling hours, AI provider, cutoff, and inspect real-time token telemetry.
- [x] **Automated Tests:** 15 new backend pytest tests (88/88 total passed in 51.3s); 2 new Playwright E2E tests (19/19 full suite passed in 38.4s).
- [x] **Visual Evidence:** Captured and verified 8 high-fidelity screenshots under `phase6_evidence/`.

---

## Acceptance Criteria Verification Log

### Phase 5: Generic Aptitude Practice Module
- [x] **Cognitive Foundation Pattern Configuration:** Standardized on prevailing fresher recruitment cognitive pattern (45 MCQs: 15 Quantitative Aptitude, 15 Logical Reasoning, 15 Verbal Ability in 60 minutes with 0 negative marking).
- [x] **Strict 4-Option Multiple Choice Format:** All aptitude items are 4-option MCQs (A, B, C, D) with single correct answers and step-by-step mathematical reasoning.
- [x] **Fresher Experience Eligibility Restriction:** Restricted to freshers and entry-level candidates (`"Fresher"`, `"Less than 1 year"`). Experienced candidates (`"1–3 years"`, `"3–5 years"`, `"5+ years"`) blocked with 403 Forbidden.
- [x] **Daily Attempt Quota:** 5 submitted sessions per calendar day. Abandoned sessions discard answers and do not consume attempt quota.
- [x] **Test Taking Interface (`AptitudeTestPage.jsx`):** 60-minute server countdown timer, 45-button question palette, 4 options (A-D), debounced autosave, leave modal, and submit modal with unanswered question counter.
- [x] **Objective Evaluation & Scorecard (`AptitudeResultsPage.jsx`):** Deterministic evaluation (`is_correct = (selected == correct)`). Standalone practice **never** displays PASS/FAIL verdicts. Section breakdown and step-by-step mathematical reasoning for every question.
- [x] **Mixed Stage Exemption:** Phase 6 Mixed recruitment simulations do not consume standalone daily quota and evaluate against configurable qualifying cutoff (`mixed_qualifying_cutoff`, default 60% = PASS/FAIL).
- [x] **Admin Aptitude Management (`AdminAptitudePage.jsx`):** Search, filtering, manual question creation, version publishing, question activation/suspension, student report resolution, and platform configuration updates.
- [x] **Automated Tests:** 12 new backend pytest tests passed (73/73 total passed); 2 new Playwright E2E tests passed (17/17 total passed).
- [x] **Visual Inspection:** Captured 8 high-fidelity evidence screenshots under `phase5_evidence/` validating Hub, test taking, palette, modals, scorecard, and admin management.

---

## Acceptance Criteria Verification Log

### Phase 4: Shared Question Bank & Weekly Quiz System
- [x] **Question Categories & Difficulty:** Implemented 5 non-MCQ categories (Output Prediction, Debugging, Coding, Scenario, Conceptual) across 3 difficulties (Easy, Medium, Hard). Multiple-choice questions prohibited.
- [x] **Question Generation & Revision Loop:** Implemented schema validation, up to 3 AI revisions, deterministic offline fallback, and `QuestionValidationHistory` failure recording with `Suspended – Review Failed`.
- [x] **45-Question Weekly Distribution:** Generates assignments with exact quotas: 10 Output, 10 Debugging, 10 Coding, 10 Scenario, 5 Conceptual.
- [x] **75-Minute Countdown Timer:** Enforced server-side with client display, autotermination on expiry, and autosave tolerance.
- [x] **45-Button Question Palette:** Interactive buttons (1-45) showing Answered, Unanswered, and Current states with instant jump navigation.
- [x] **Binary Evaluation Engine:** Strict Correct / Incorrect grading (no partial credit). Score calculated as `(Correct / 45) * 100`. Question-by-question review with expected solution and explanation.
- [x] **Attempt Quotas & Safe Abandonment:** Maximum 5 submitted attempts allowed. Abandonment cancels attempt and clears answers without consuming attempt limit. Retakes blocked while an attempt is in `Evaluation Pending`.
- [x] **Roadmap Milestone Integration:** Submitting a weekly quiz dynamically increments the week's completed milestones by exactly 1.
- [x] **Admin Question Bank Operations:** Question search, filtering by category and difficulty, question creation, version publishing, suspension/activation, and student report resolution.
- [x] **Automated Tests:** 12 new backend pytest tests passed; 1 new Playwright E2E test passed. Total 61 backend and 15 E2E tests passed.

---

### Phase 3: Learn Module & Personalized Roadmap
- [x] **Setup Wizard (`/learn`):** 6-step roadmap creation flow covering Role (9 + Other custom), Experience (5 tiers), Target Salary (6 tiers + flexible skip), Language (14 options), Framework with dynamic compatibility filter, and Database (10 options).
- [x] **Dynamic Framework Clearing:** Selecting or changing a programming language automatically validates and clears incompatible frameworks in real-time.
- [x] **Background AI Generation Architecture:** Generates 5 phases, structured weeks, salary-adapted topics, and connected practice tasks via `apps/ai_services/roadmap_ai_service.py` with seamless deterministic fallback and audit logs in `AIUsageRecord`.
- [x] **Connected Hands-on Practice Roadmap:** Generates hands-on coding exercises, SQL query problems, debugging tasks, and portfolio projects reinforcing concepts taught in each week.
- [x] **Independent Progress Lifecycles:** Learning topics tracked with Not Started, Completed, and Not Verified (skipped); Practice tasks tracked independently with Not Started, In Progress, and Completed. Neither roadmap locks or auto-completes the other.
- [x] **Topic Content Viewer:** Technical modal with learning objectives, concept overview, runtime mechanics, code examples, and recruitment interview perspectives.
- [x] **Hands-on Practice Task Modal:** Displays objective, problem statement, acceptance criteria, engineering constraints, sample I/O, deliverable, starter code with copy button, hints accordion, and work log notes.
- [x] **Transactional Roadmap Replacement:** Allows student to safely replace active roadmap via confirmation modal under database transaction without dangling records.
- [x] **Automated Tests:** 15 backend tests (pytest) and 2 browser E2E tests (Playwright) passed. Total 49 backend and 14 E2E tests passed.

---

### Phase 2: Student Dashboard and Navigation Shell
- [x] **Student Dashboard (`/dashboard`):** Personalized header, 3 equal pillars (Learn, Practice, Share Experience), Continue Learning card, Recent Activity, and 4 Quick Shortcuts.
- [x] **Continue Learning State Handling:** Correctly handles empty state (compass icon, "No active roadmap yet", "Set Up Roadmap" CTA) and populated active roadmap state (role, salary band, progress bar, weekly quiz status). Does not fabricate mock progress.
- [x] **Recent Activity State Handling:** Displays clean empty state ("No recent activity yet") when no history exists and dynamically renders real user events. Does not invent fake history.
- [x] **Desktop Navigation:** Persistent navbar with brand logo, active route highlighting (`bg-brand-50`), user avatar/name, link to `/profile`, and `Sign Out`.
- [x] **Mobile Navigation:** Responsive hamburger toggle menu supporting full mobile drawer navigation across all modules and authenticated actions.
- [x] **Protected Routes:** `ProtectedRoute` wrapper intercepts unauthenticated access to `/profile`, redirecting to `/login` with return destination preserved.
- [x] **Module Entry Points:** Fully implemented landing entry points for `/learn` (Phase 3 status, setup wizard preview), `/practice` (Phase 6/7 status, AI voice & aptitude tracks), and `/experiences` (Phase 8 status, discovery taxonomy).
- [x] **Automated Regression:** 34 backend pytest tests passed; 12 Playwright browser tests passed; clean Vite production build.

---

### Phase 1: Authentication and User Management
- [x] **Registration:** Valid registration works, normalizes email, hashes passwords, enforces password requirements, rejects duplicate emails, mismatched passwords, and missing fields.
- [x] **Email Verification:** Validates correct 6-digit code, rejects incorrect/expired/reused codes, locks on 5 failed attempts, enforces 60s resend cooldown.
- [x] **Login:** Authenticates verified users with JWT, blocks unverified accounts, handles invalid credentials, supports token refresh, and blacklists refresh tokens on logout.
- [x] **Password Reset:** Timing-safe reset request, generates secure 15m reset code, resets password, and invalidates all existing user refresh sessions.
- [x] **Profile Management:** Retrieves profile, updates profile details (name, phone, role, experience, target salary), changes password, changes email via verification code, and permanently deletes account with password + "DELETE" confirmation.
- [x] **Admin Security:** Blocks public admin registration, provides `bootstrap_admin` command, enforces mandatory email 2FA code verification for staff login, supports admin-to-admin invitations, and denies students access to admin endpoints.
- [x] **Frontend User Interface:** Fully responsive forms with validation, loading indicators, and error feedback for Register, Verify Email, Login, Forgot Password, Reset Password, Profile, and Admin Portal.
- [x] **Automated Tests:** 31 backend tests (pytest) and 5 browser E2E tests (Playwright) passed.
