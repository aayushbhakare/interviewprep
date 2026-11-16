# Implementation Plan

This document defines the sequential execution plan across all phases of the Interview Preparation Platform.

---

## Architecture & Technology Foundation

- **Frontend:** React + Vite + JavaScript (no TypeScript) + Tailwind CSS + shadcn/ui + React Router + Axios + React Context API
- **Backend:** Python + Django + Django REST Framework + SimpleJWT + drf-spectacular + PostgreSQL
- **Architecture:** Modular Monolith in a single repository with domain-based Django applications (`accounts`, `learning`, `content`, `questions`, `quizzes`, `aptitude`, `interviews`, `experiences`, `administration`, `ai_services`, `common`)
- **External Interfaces:**
  - AI Services: Gemini API provider adapter (abstracted behind backend interfaces)
  - Real-time Voice: Candidate Gemini Live API or fallback provider adapter
  - Email: Google Gmail SMTP
  - Resume Storage: Supabase Storage private bucket (abstracted storage service)
  - Processing: PostgreSQL-backed `ProcessingJob` engine without Celery/Redis for initial local processing

---

## Phase Execution Sequence

### Phase 0: Project Foundation (In Progress)
1. Repository structure setup (`frontend/`, `backend/`, `documentation/`, root configs).
2. Django project configuration with custom User model in `accounts` before first migration.
3. PostgreSQL database connection and migration setup.
4. Health check endpoint (`GET /api/v1/health/`) and drf-spectacular documentation (`/api/v1/docs/`).
5. Vite + React frontend initialization with Tailwind CSS, Axios, and React Router.
6. Linting, formatting, and pytest configuration.

### Phase 1: Authentication and User Management
1. Custom User model, profile, email verification codes, password hashing and reset workflows.
2. JWT token management (SimpleJWT), session handling, and rate limiting.
3. Admin invitation and mandatory 2FA mechanism.
4. Supabase Storage client adapter for private PDF resume handling with interview snapshot references.
5. Automated API and unit tests for authentication and authorization.

### Phase 2: Main Dashboard and Navigation
1. Student dashboard layout with three equal entry points (Learn, Practice, Share Interview Experience).
2. "Continue Learning" section for active roadmap and progress.
3. "Recent Activity" and experience drafts quick-access.
4. Responsive navigation shell with role-based route guards.

### Phase 3: Learn Module & Personalized Roadmap (Completed & Verified)
1. Step-by-step setup wizard (Role, Experience, optional Salary range, Language, Framework, Database).
2. Language-to-framework compatibility matrix validation with dynamic frontend auto-clearing.
3. Background AI generation architecture (`roadmap_ai_service.py`) supporting Google Gemini API with seamless fallback to deterministic curriculum engine.
4. Deterministic active roadmap generation and persistent configuration snapshot (`RoadmapConfigurationSnapshot`, `RoadmapPhase`, `RoadmapWeek`, `RoadmapTopicReference`).
5. Connected Hands-on Practice Roadmap generation (`RoadmapPracticeTask`, `PracticeTaskProgress`) with coding exercises, SQL tasks, and portfolio projects.
6. Independent progress tracking for learning topics (Not Started, Completed, Not Verified/Skipped) and practice tasks (Not Started, In Progress, Completed).
7. Topic content and practice task detail modals with starter code, constraints, requirements, and work log notes.
8. Roadmap replacement confirmation and atomic database transactional protection.

### Phase 4: Learning Content and Topic Exercises
1. Versioned topic content structure (objectives, explanations, internals, examples, practical code, interview perspective).
2. Topic-level coding and scenario exercises (deterministic test case verification and AI evaluation adapter).
3. Student-reported interview question integration with clear provenance labels.

### Phase 4: Shared Question Bank and Weekly Quizzes (Completed & Verified)
1. Shared question bank organized by technology, topic, category (5 non-MCQ formats), and difficulty.
2. AI-assisted question generation with schema validation and 3-attempt automated revision loop, backed by offline deterministic fallback engine.
3. Weekly quiz assignment generation with exact 45-question distribution (10 Output, 10 Debugging, 10 Coding, 10 Scenario, 5 Conceptual).
4. 75-minute persistent server-enforced timer, 45-button question palette, answer autosave across reloads, leave and submission dialogs.
5. Strict binary evaluation engine (Correct / Incorrect), zero partial credit, immutable question version snapshots, and question reporting system.
6. Maximum 5 submitted attempts per weekly quiz, abandonment without consuming attempt limit, and milestone increment (+1 on roadmap week upon quiz submission).
7. Admin Question Bank catalog with search, filtering, question CRUD, version publishing, suspension/activation, and student report resolution.

### Phase 5: Aptitude Practice (Completed & Verified)
1. Shared aptitude question bank across Quantitative, Logical, and Verbal tracks with 4-option MCQs.
2. Official TCS iON Cognitive Foundation reference pattern research & test config (45 MCQs: 15 Quant, 15 Logical, 15 Verbal in 60 mins).
3. AI question generator with schema validation, 3-attempt automated revision loop, and deterministic fallback synthesis.
4. Fresher experience eligibility enforcement (`"Fresher"`, `"Less than 1 year"` eligible; experienced rejected with 403 Forbidden).
5. Standalone practice tests with 5 submitted sessions per calendar day limit (abandoned sessions strictly exempted).
6. 60-minute countdown timer, 45-button question palette, debounced autosave, leave modal, and submit modal with unanswered count.
7. Objective deterministic evaluation (`is_correct = (selected == correct)`), question review, step-by-step mathematical reasoning.
8. Standalone practice tests never issue PASS/FAIL verdicts; qualifying PASS/FAIL strictly reserved for Phase 6 Mixed Stage simulation.
9. Admin Aptitude Management portal with search/filter, question CRUD, version publishing, suspension/activation, student report resolution, and platform configuration updates.
10. Full backend (73 passing tests) and Playwright E2E coverage (17 passing tests) with browser visual inspection.

### Phase 6: Share Interview Experience
1. Real-time voice architecture evaluation and proof of concept.
2. Technical, HR, and sequential Mixed recruitment interviews.
3. Voice UI states (Listening, Thinking, Speaking), manual interruption, and Done Speaking backup.
4. PASS/FAIL scoring and category-level feedback; 24-hour cooling period for failed interview types.
5. Associated resume snapshots and session history.

### Phase 8: Share Interview Experience
1. Structured recruitment journey submission (Application, Screening, Aptitude, Technical Rounds, HR, Outcome).
2. Anonymous vs. Public author options; draft saving, editing, and deletion.
3. Automated risk-based moderation workflow and admin review queue.
4. Discovery with search, sorting (Recent, Helpful), and filtering (Salary, Role, Experience, Company, Outcome, Round).
5. Community helpful votes and reporting mechanisms.

### Phase 9: Admin Panel & Platform Operations
1. Comprehensive admin dashboard across all 11 blueprint sections.
2. Student management, content versioning, question bank approval, and moderation queues.
3. Dynamic platform settings, immutable admin activity logs, AI model management, and system monitoring.
4. Maintenance mode toggles per module.

### Phase 10: Complete Testing, Hardening & Pre-Release
1. End-to-end user journeys using Playwright.
2. Security audit against the PRD checklist (IDOR, permissions, rate limits, secret masking, sanitization).
3. Performance verification, backup/restore procedures, and final documentation.
