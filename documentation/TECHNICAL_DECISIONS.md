# Technical Decisions Log

This log records architecture and technical decisions made during implementation.

---

## Decisions Record

### TD-001: Monorepo Structure
- **Decision:** Use a single monorepo with `frontend/`, `backend/`, and `documentation/` directories.
- **Rationale:** Aligns with PRD and Blueprint architecture; keeps domain contracts and documentation tightly synchronized.

### TD-002: PostgreSQL 18 Local Configuration
- **Decision:** Run PostgreSQL 18 locally on port `5433` (database: `interview_platform`).
- **Rationale:** Avoids conflict with existing host PostgreSQL service on port 5432 while utilizing native Homebrew PostgreSQL 18.4 with trust authentication.

### TD-003: Custom User Model Before Initial Migration
- **Decision:** Define custom `User` model inheriting from `AbstractBaseUser` and `PermissionsMixin` in `apps.accounts` before creating the first migration.
- **Rationale:** Django standard requirement; changing `AUTH_USER_MODEL` later causes catastrophic migration incompatibility.

### TD-004: Standardized API Response Format
- **Decision:** All `/api/v1/` endpoints adhere to `{ "status": "success", "data": ... }` and `{ "status": "error", "error": { "code": ..., "message": ..., "details": ... } }`.
- **Rationale:** Ensures predictability across React frontend services and API consumers.

### TD-005: Job Queue via PostgreSQL `ProcessingJob`
- **Decision:** Background evaluation and generation jobs will be tracked in a database table `ProcessingJob` without introducing Celery or Redis in initial phases.
- **Rationale:** Fulfills ₹0 budget and architectural simplicity constraint while providing robust, inspectable state recovery and idempotency.

### TD-006: External Service Provider Adapters
- **Decision:** All AI, email, and storage services are accessed via abstract interfaces in backend services, with automatic fallbacks for local offline development.
- **Rationale:** Ensures zero unintentional billing, protects against provider outages, and decouples business logic from vendor SDKs.

### TD-007: Dual Connected Roadmaps with Independent Progress Tracking
- **Decision:** Generate both a conceptual Learning Roadmap and a hands-on Practice Roadmap (coding exercises, SQL query problems, debugging tasks, and mini-projects) connected by week and topic references, while maintaining separate progress tracking without auto-completion coupling.
- **Rationale:** Ensures students genuinely write code and solve engineering problems rather than passively reading explanations; prevents false completion metrics.

### TD-008: Strict Non-MCQ Question Formats
- **Decision:** The question bank and weekly quiz system prohibit multiple-choice questions (MCQs), standardizing on 5 active formats: Code Output Prediction, Find Error / Debugging, Coding Problems, Scenario-Based Architecture, Conceptual / Short Answer.
- **Rationale:** Real technical recruitment interviews assess code reasoning, error diagnosis, and architectural thinking rather than guessing from four options.

### TD-009: Binary Evaluation Engine Without Partial Credit
- **Decision:** Weekly quiz questions are evaluated strictly as binary Correct or Incorrect. Unanswered questions are graded Incorrect. Final score is computed strictly as `(Correct / 45) * 100`.
- **Rationale:** Establishes clear, unambiguous technical interview standards and prevents ambiguity in automated evaluation rubrics.

### TD-010: 75-Minute Server-Enforced Timer with Latency Tolerance
- **Decision:** Quiz attempts strictly calculate remaining seconds from `started_at` timestamp on the server. Autosave and submission validate that elapsed time does not exceed 4,500 seconds (+60 seconds network buffer).
- **Rationale:** Prevents client-side clock manipulation while gracefully handling real-world network fluctuations.

### TD-011: Question Version Snapshotting & Safe Attempt Abandonment
- **Decision:** Assignments link to frozen `QuestionVersion` records rather than mutable `Question` records. Abandoning an in-progress quiz deletes attempt answers without consuming one of the 5 allowed submission attempts.
- **Rationale:** Guarantees historical score integrity even if a question is revised in the bank, and permits students to step away without being unfairly penalized.

### TD-012: MCQ Architecture for Aptitude Practice
- **Decision:** While technical weekly quizzes strictly prohibit multiple-choice questions (MCQs), aptitude practice standardizes on 4-option MCQs (A, B, C, D) with exactly one valid option.
- **Rationale:** Standard cognitive fresher recruitment assessments evaluate speed, mental math, and elimination strategies strictly via timed MCQs.

### TD-013: Standardized Fresher Cognitive Assessment Pattern
- **Decision:** Establish a generic fresher cognitive assessment structure and configure platform practice sessions to 45 questions in 60 minutes (15 Quantitative, 15 Logical, 15 Verbal) with 0 negative marking, dynamically configurable by administrators in `AptitudeTestConfig`.
- **Rationale:** Provides realistic, balanced 60-minute training sessions with equal emphasis across all three cognitive pillars (Quantitative Aptitude, Logical Reasoning, Verbal Ability) without being tied to any single company's branding.

### TD-014: Fresher Experience Eligibility Restriction
- **Decision:** Restrict standalone aptitude practice strictly to students with profile or active roadmap experience levels of `"Fresher"` or `"Less than 1 year"`. Experienced candidates (`"1–3 years"`, `"3–5 years"`, `"5+ years"`) are blocked on the backend with 403 Forbidden.
- **Rationale:** Experienced industry recruitment evaluates system design, project impact, and live coding, whereas aptitude screening tests are uniquely required for campus/entry-level freshers.

### TD-015: No PASS/FAIL Verdicts for Standalone Practice Sessions
- **Decision:** Standalone aptitude practice tests **never** issue recruitment PASS/FAIL verdicts. They display overall percentage, accuracy, section breakdowns, and detailed mathematical solutions. PASS/FAIL qualification is strictly reserved for Phase 6 Mixed recruitment simulations using `mixed_qualifying_cutoff`.
- **Rationale:** Standalone practice is a formative self-paced learning tool; imposing recruitment pass/fail verdicts on self-study runs creates unnecessary stress and distorts diagnostic progress.

### TD-016: Strict Generic Recruitment Standards (Salary & Role Wise, Never Company Wise)
- **Decision:** All interview practice simulations, questions, follow-ups, and rubrics are calibrated strictly to target job roles and salary bands (₹3–5 LPA to ₹30+ LPA) with zero company-specific branding, company selection, or question templates.
- **Rationale:** Prepares candidates for general market expectations and engineering depth rather than narrow company-specific trivia, supporting widespread employability.

### TD-017: Purely Binary PASS/FAIL Simulation Verdicts
- **Decision:** Interview practice results produce strictly binary `PASS` or `FAIL` verdicts accompanied by 6-dimension qualitative feedback (Technical Depth, Communication, Problem Solving, Weaknesses, Priorities, and Recommendations). Numerical marks, scores, and percentages are prohibited on interview scorecards.
- **Rationale:** Mimics authentic hiring committee decision-making where a candidate is either hired or rejected; prevents false precision and counterproductive obsession with fractional percentage points.

### TD-018: Independent 24-Hour Cooling Periods
- **Decision:** An unsuccessful interview simulation incurs a 24-hour cooling period strictly isolated to that specific interview track (`technical`, `hr`, `mixed`). Failing a technical round never blocks an HR or Mixed session. Passing or abandoning incurs 0 cooling.
- **Rationale:** Ensures focused revision and deliberate practice without completely locking candidates out of complementary preparation tracks.

### TD-019: Browser Native Web Speech API with ₹0 Operational Budget
- **Decision:** Implement real-time voice speech-to-text (STT) and text-to-speech (TTS) entirely using browser-native APIs (`webkitSpeechRecognition` / `SpeechSynthesis`) combined with backend `DeterministicVoiceProvider` fallback.
- **Rationale:** Eliminates external audio streaming latency and paid third-party vendor dependencies, maintaining ₹0 operational budget with 100% test reliability.

### TD-020: Mixed Recruitment Gated Round Advancement
- **Decision:** Mixed recruitment multi-round processes gate round progression: scoring $\ge 60\%$ in Round 1 Cognitive Aptitude automatically unlocks Round 2; scoring $< 60\%$ immediately halts the pipeline with an objective `FAIL` verdict.
- **Rationale:** Replicates the actual corporate recruitment funnel where aptitude screening is a prerequisite for technical and managerial interview evaluation.

### TD-021: Permitted Company Attribution Strictly Isolated to Share Experience
- **Decision:** Company names are permitted and collected solely within the Share Interview Experience module to provide authentic real-world peer discovery context. All other preparation curricula (Learning, Practice, Quizzes, Aptitude, Voice Mock Interviews) strictly remain generic, role-wise, and salary-wise.
- **Rationale:** Gives students transparent insight into actual hiring processes without transforming the platform into a company-specific question crammer.

### TD-022: Flexible Multi-Stage Journey Data Model
- **Decision:** Model recruitment stages using a flexible parent-child relation (`ExperienceStage` ordered by an integer `order`) rather than a fixed column set or rigid enum sequence.
- **Rationale:** Allows authentic documentation of diverse real-world hiring processes (e.g. 1-round startups vs 5-round enterprises) with custom reordering and ad-hoc round types.

### TD-023: Deterministic Zero-Cost Risk-Based Moderation Engine
- **Decision:** Implement content moderation through a deterministic regex and keyword engine (`experiences_moderation_service.py`) running synchronously on submission, classifying risk into low (auto-publish), medium/high (admin queue), and structural (reject).
- **Rationale:** Guarantees instantaneous low-risk publication, ₹0 external API costs, and reliable protection against PII leakage, promotional spam, and abusive language.

### TD-024: Safe Dual-State Versioning for Published Experience Edits
- **Decision:** When a student edits an already-published experience, the approved live version remains published and discoverable to peers while the new revision is stored in `ExperienceVersion` and queued for review.
- **Rationale:** Prevents denial-of-service or sudden disappearance of high-value community stories during re-review of minor updates.

### TD-025: Student-Reported Question Extraction & Learn Provenance Attribution
- **Decision:** Automatically index eligible questions from published experiences into `StudentReportedQuestion`, categorizing by technology and rendering them inside relevant topic learning views stamped with `provenance_label: "Student Reported Interview Question"`.
- **Rationale:** Connects peer intelligence directly into candidate study roadmaps while clearly differentiating peer-reported questions from verified platform quiz items.

### TD-026: Centralized Single Admin Console Layout (`AdminLayout`)
- **Decision:** Consolidate all 12 platform operational views into a unified responsive layout with sidebar navigation, replacing separate loose admin buttons in the top navbar with a single `Admin Console` entrypoint.
- **Rationale:** Resolves navbar clutter, unifies administrative workflows, and gives staff an integrated control center.

### TD-027: Last Active Admin Self-Lockout Prevention Guard
- **Decision:** Enforce both frontend button disabled state and backend transactional check preventing deactivation or privilege revocation of the last remaining active administrator account.
- **Rationale:** Guarantees platform operational continuity by eliminating catastrophic accidental lockouts.

### TD-028: Non-Destructive Maintenance Middleware with Staff Exemption
- **Decision:** Implement `MaintenanceModeMiddleware` inspecting global and per-module maintenance toggles. Halts candidate session creation with HTTP 503 while strictly exempting authenticated staff members.
- **Rationale:** Enables staff administrators to test and verify platform features during scheduled maintenance without locking themselves out.

### TD-029: Topic Content Versioning Independent of Topic Completion Identity
- **Decision:** Topic completions in `StudentTopicProgress` associate with the permanent canonical `Topic` identity rather than a specific content version snapshot (`TopicContent`).
- **Rationale:** Enables administrators to continuously improve and publish updated multi-section topic guides without invalidating candidates' earned progress or disrupting ongoing practice roadmaps.

### TD-030: Telemetry Cost Accounting Exclusively in Indian Rupees (INR)
- **Decision:** Format and track all platform AI usage, token telemetry, and estimated costs strictly in Indian Rupees (`₹0.00`) adhering to the ₹0 budget mandate.
- **Rationale:** Consistent with platform localization and budget compliance requirements, avoiding confusing dollar currency formatting.
