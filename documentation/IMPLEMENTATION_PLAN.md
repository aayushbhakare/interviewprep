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

### Phase 3: Learn Module Foundation
1. Step-by-step setup wizard (Role, Experience, optional Salary range, Language, Framework, Database).
2. Language-to-framework compatibility validation.
3. Active roadmap generation and persistent configuration snapshot.
4. Phases, weeks, and topic structures; unrestricted self-paced navigation.
5. Topic completion tracking and "Not Verified" skip logic.
6. Roadmap replacement confirmation and transactional protection.

### Phase 4: Learning Content and Topic Exercises
1. Versioned topic content structure (objectives, explanations, internals, examples, practical code, interview perspective).
2. Topic-level coding and scenario exercises (deterministic test case verification and AI evaluation adapter).
3. Student-reported interview question integration with clear provenance labels.

### Phase 5: Shared Question Bank and Weekly Quizzes
1. Shared question bank organized by technology, topic, category, and difficulty.
2. Weekly quiz assignment with exact 45-question distribution (10 Output, 10 Debugging, 10 Coding, 10 Scenario, 5 Conceptual).
3. 75-minute persistent timer, question palette, section navigation, leave confirmation, and auto-submission.
4. Asynchronous evaluation pipeline with PostgreSQL `ProcessingJob`, retry handling, and `Evaluation Pending` state.
5. Maximum 5 submitted attempts per week/roadmap, immutable attempt snapshots, and question reporting system.

### Phase 6: Aptitude Practice
1. Shared aptitude question bank aligned with current TCS NQT pattern.
2. Standalone aptitude tests with daily 5 submitted-session limit.
3. Immediate results, score review, and answer explanations.
4. Mixed recruitment aptitude qualifying stage integration (default 60% threshold, separate attempt counter).

### Phase 7: AI Interview Simulation
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
