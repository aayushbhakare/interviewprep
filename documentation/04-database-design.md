# 04 — Database Design Blueprint

## Design approach

Use modular database design:
1. Establish the high-level domain map and important relationships before implementation.
2. Design detailed models for one module before implementing that module.
3. Use Django ORM and migrations for every schema change.
4. Do not create every speculative table upfront.
5. Review migrations and relationship impacts before applying them.

PostgreSQL is the source of truth and runs locally during development.

## Core entities (conceptual; refine per module)

### Identity and access
- User
- UserProfile
- Role / permission mapping
- EmailVerificationCode (store a secure hash or otherwise protect codes; never log plaintext)
- PasswordResetToken/Code
- AdminTwoFactorConfiguration / recovery mechanism (design securely)
- UserSession or refresh-token tracking if required by the chosen JWT strategy

Use a custom Django user model from the beginning, before the first migration. Email is the login identifier. Define uniqueness and normalization rules.

### Learning
- Roadmap
- RoadmapConfigurationSnapshot
- RoadmapPhase
- RoadmapWeek
- RoadmapTopicReference
- TopicProgress
- TopicContent
- TopicContentVersion
- TopicExercise
- TopicExerciseAttempt
- TopicExerciseEvaluation

One active roadmap per user. Preserve the configuration snapshot used to generate it. Topic progress belongs to a roadmap, not globally to a topic.

### Question bank and quizzes
- Question
- QuestionVersion
- QuestionValidationRecord
- QuestionReport
- StudentQuestionExposure / seen-question record
- WeeklyQuizAssignment
- WeeklyQuizAssignmentItem (question ID + exact question version)
- QuizAttempt
- QuizAttemptQuestionSnapshot
- QuizAnswer
- QuizEvaluation
- QuizEvaluationJob/Status

Shared questions are technology/topic-based and reusable. Student-specific assignments and answers are separate.

A submitted attempt must preserve:
- Exact question text/version.
- Expected answer/rubric version.
- Submitted answer/code/explanation.
- Evaluation method and relevant evaluator/prompt version.
- Final evaluation and timestamps.

Question bank edits must never mutate historical attempt snapshots.

### Aptitude
- AptitudeQuestion and versions.
- AptitudeSession and assigned question snapshots.
- AptitudeAnswer.
- AptitudeResult.
- DailyAttemptCounter or safely derivable submitted-session count with concurrency-safe enforcement.

Standalone and Mixed aptitude use the same shared bank and selection logic. Mixed aptitude must not consume standalone daily sessions.

### Interviews
- InterviewSession
- InterviewRound
- InterviewConfigurationSnapshot
- InterviewResult
- InterviewFeedback
- CoolingPeriod / eligibility state
- ResumeVersionReference
- AI provider/session metadata needed for debugging without retaining unnecessary sensitive audio/transcripts.

A Mixed process has sequential rounds and immutable round outcomes. A failed round marks later rounds Not Attempted.

### Share Experience
- InterviewExperience
- ExperienceVersion
- ExperienceStage
- ExperienceRound
- ExperienceQuestion
- ModerationRecord
- ExperienceReport
- HelpfulInteraction

Drafts are private. Published versions and pending updates need version-aware behavior so the current published version remains visible while a changed version is moderated.

### Admin and operations
- PlatformSetting (typed, validated settings).
- AdminActivityLog (append-only/read-only in admin UI).
- AIUsageRecord (provider, service, model, token/usage metadata, estimated cost where available, status).
- ProcessingJob/TaskStatus for recoverable long-running operations.
- MaintenanceState.

## Critical relationships and invariants

1. A user has at most one active roadmap.
2. Roadmap progress belongs to a specific roadmap.
3. Replacing a roadmap clears its associated progress and quiz history only after the new roadmap is successfully generated and saved and the user confirmed replacement.
4. Shared question bank entries are independent of individual students.
5. Every assigned quiz item references an exact question version.
6. Every submitted quiz attempt preserves an immutable snapshot of questions and answers.
7. Five submitted attempts maximum per weekly quiz per roadmap. Abandoned attempts do not consume an attempt. Pending evaluation does consume an attempt and blocks another retake until resolved.
8. Quiz progress counts once per week after first submission; retakes do not increase progress.
9. Aptitude daily limit counts only submitted standalone sessions. Mixed aptitude is excluded from this counter.
10. Interview records and results are immutable historical records; new interviews create new sessions.
11. Each interview records which resume version/reference was used.
12. Experience anonymity affects public display, not internal ownership/moderation identity.
13. Experience updates are versioned; pending update does not replace the visible published version until approved.
14. Admin activity records cannot be edited/deleted through the admin interface.
15. Deactivated/suspended questions are excluded from new assignments but retained where historical records reference them.

## Database constraints and indexing

Use database-level uniqueness/constraints where practical, not only frontend validation. Consider:
- Unique normalized email.
- One active roadmap per user (constraint or transaction-safe service logic).
- Unique attempt number per quiz assignment/user.
- Unique question version number per question.
- Unique daily standalone aptitude session sequence or a concurrency-safe counter.
- Unique helpful interaction per user/experience if only one vote is intended.
- Index foreign keys and common filters (user, status, created_at, role, technology, topic, company filter fields where appropriate).
- Use transactions for roadmap replacement, quiz submission, attempt counting, and mixed-round progression.
- Add concurrency tests for limits and duplicate submissions.

## Migration discipline

- Create the custom user model before initial migrations.
- Commit migration files with each schema change.
- Never delete or rewrite migrations casually after shared data exists.
- Test migrations from a clean database and through an upgrade path.
- Back up before destructive migration work.
- Use data migrations for transformations; review and test them.
- Never run destructive database operations automatically without explicit approval.


## State machines and snapshots that must be explicit

Before implementing each workflow, define allowed transitions and enforce them in services and database constraints where possible. At minimum cover:

- Email verification: pending → verified / expired; one-time code use and resend throttling.
- Roadmap generation/replacement: preparing → ready / failed; old active roadmap remains intact until the new one is committed.
- Topic progress: not started / completed / not verified (skipped); skipping never increments completed count.
- Quiz assignment: preparing / ready / temporarily unavailable. Quiz attempt: in progress → abandoned OR submitted → evaluation pending → evaluated; submitted/abandoned attempts are immutable. Retakes only after evaluation completes.
- Processing jobs: queued → running → succeeded / retryable failure / terminal failure; include attempts, lease/heartbeat, idempotency key, timestamps, and safe reclaim after worker crash.
- Aptitude session: in progress → abandoned OR submitted → evaluated; standalone and Mixed origin must be stored to enforce separate attempt counters.
- Mixed interview: pending rounds → in progress → pass/fail; after failure all later rounds become Not Attempted. Persist the selected round plan at session creation.
- Experience: draft → pending moderation → published/rejected; published version remains visible while a new version is pending.

Persist configuration snapshots for any rule that can change later (quiz duration, attempt limit, aptitude threshold, question/rubric version, interview round plan, resume version). Existing sessions must use the snapshot with which they began; admin setting changes apply to new sessions only.
