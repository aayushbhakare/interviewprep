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
| **Total Backend Test Suite** | **pytest-django** | **49** | **49** | **0** | **0** | **PASSED** | **2026-11-16** |
| Python Linting & Formatting | Ruff | 65 files | 65 | 0 | 0 | **PASSED** | 2026-11-16 |
| Frontend ESLint Code Quality | ESLint | 26 files | 26 | 0 | 0 | **PASSED** | 2026-11-16 |
| Frontend Production Build | Vite | 1654 modules | 1654 | 0 | 0 | **PASSED** | 2026-11-16 |
| Playwright E2E Tests (Phases 1, 2 & 3) | Playwright (Chrome) | 14 | 14 | 0 | 0 | **PASSED** | 2026-11-16 |
| OpenAPI Schema Validation | drf-spectacular | 31 endpoints | 31 | 0 | 0 | **PASSED** | 2026-11-16 |

---

## Acceptance Criteria Verification Log

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
