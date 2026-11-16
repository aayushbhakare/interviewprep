# Database Schema Blueprint

PostgreSQL is the permanent source of truth for the platform. Schema changes are strictly managed via Django ORM migrations.

---

## Implemented & Active Domain Models

### 1. `accounts` (Phase 1 Verified)
- `User`: Primary custom user model. Uses `email` as unique login identifier, `id` (UUIDField), `full_name`, `is_active`, `is_staff`, `is_superuser`, `is_verified`, `is_admin_2fa_enabled`, `admin_2fa_secret`, `created_at`, `updated_at`.
- `UserProfile`: `user` (OneToOne), `phone_number`, `target_role`, `experience_level`, `target_salary`, `current_resume_path`, `current_resume_version`.
- `EmailVerificationCode`: `user` (ForeignKey), `code_hash` (SHA-256), `expires_at`, `is_used`, `attempts_count` (locks at 5).
- `PasswordResetToken`: `user` (ForeignKey), `token_hash` (SHA-256), `expires_at`, `is_used`, `attempts_count`.
- `EmailChangeRequest`: `user` (ForeignKey), `new_email`, `code_hash`, `expires_at`, `is_used`, `attempts_count`.
- `AdminInvitation`: `email` (unique), `invited_by` (ForeignKey to User, null=True), `token_hash`, `expires_at` (48h), `is_accepted`.
- `TwoFactorCode`: `user` (ForeignKey), `code_hash`, `temp_token` (unique), `expires_at` (5m), `is_used`, `attempts_count`.
- `UserResumeVersion`: `user` (ForeignKey), `version_number`, `storage_path`, `original_filename`, `file_size_bytes`, `uploaded_at`.

### 2. `learning` (Phase 3 Verified)
- `Roadmap`: `user` (ForeignKey), `role`, `experience_level`, `target_salary`, `language`, `framework`, `database`, `custom_role_text`, `status` (preparing, ready, failed), `is_active`, `generation_error`, `generation_job_id`, `created_at`, `updated_at`.
- `RoadmapConfigurationSnapshot`: `roadmap` (OneToOne), `role`, `custom_role_text`, `experience_level`, `target_salary`, `language`, `framework`, `database`, `created_at`.
- `RoadmapPhase`: `roadmap` (ForeignKey), `phase_number`, `title`, `description`, `created_at`. Unique on `(roadmap, phase_number)`.
- `RoadmapWeek`: `phase` (ForeignKey), `week_number`, `title`, `goal`, `created_at`. Unique on `(phase, week_number)`.
- `RoadmapTopicReference`: `week` (ForeignKey), `topic_content` (ForeignKey to `content.TopicContent`, null=True), `slug`, `title`, `order`, `estimated_minutes`, `required_level`, `created_at`. Unique on `(week, order)`.
- `TopicProgress`: `user` (ForeignKey), `topic` (ForeignKey to `RoadmapTopicReference`), `status` (`not_started`, `completed`, `skipped`), `completed_at`, `updated_at`. Unique on `(user, topic)`.
- `RoadmapPracticeTask`: `week` (ForeignKey to `RoadmapWeek`), `related_topic` (ForeignKey to `RoadmapTopicReference`, null=True), `title`, `task_type` (`coding_exercise`, `sql_query`, `debugging`, `implementation`, `mini_project`, `system_scenario`, `portfolio_project`), `difficulty` (`Easy`, `Medium`, `Hard`), `estimated_minutes`, `order`, `objective`, `problem_statement`, `requirements` (JSON), `constraints` (JSON), `sample_io` (JSON), `expected_deliverable`, `starter_code`, `hints` (JSON), `created_at`.
- `PracticeTaskProgress`: `roadmap` (ForeignKey to `Roadmap`), `task` (ForeignKey to `RoadmapPracticeTask`), `status` (`not_started`, `in_progress`, `completed`), `submission_notes`, `completed_at`, `updated_at`. Unique on `(roadmap, task)`.

### 3. `content` (Initial Schema)
- `TopicContent`: `slug`, `topic_name`, `technology`, `version`, `learning_objectives`, `concept_explanation`, `how_it_works`, `examples`, `practical_implementation`, `interview_perspective`, `key_takeaways`, `is_published`.

### 4. `questions` & `quizzes` (Phase 4 Verified)

#### `questions`
- `Question`: Canonical question entity. Fields: `id` (UUID), `technology`, `topic_slug`, `category` (`output`, `debugging`, `coding`, `scenario`, `conceptual`), `difficulty` (`easy`, `medium`, `hard`), `status` (`draft`, `active`, `suspended`, `deprecated`, `review_failed`), `created_by` (ForeignKey to User, null=True), `created_at`, `updated_at`.
- `QuestionVersion`: Immutable content snapshot. Fields: `id` (UUID), `question` (ForeignKey), `version_number` (int), `prompt` (text), `code_snippet` (text, blank), `expected_answer` (text), `explanation` (text), `validation_status` (`valid`, `invalid`, `review_failed`), `is_published` (bool), `created_at`. Unique on `(question, version_number)`.
- `QuestionReport`: Issue reporting with deduplication. Fields: `id` (UUID), `question` (ForeignKey), `reported_by` (ForeignKey to User), `report_reason` (`incorrect_solution`, `unclear_problem`, `typo_grammar`, `broken_snippet`, `other`), `description` (text), `status` (`pending`, `reviewed`, `resolved`, `dismissed`), `admin_notes` (text), `created_at`, `updated_at`.
- `QuestionValidationHistory`: Validation audit log. Fields: `id` (UUID), `question` (ForeignKey), `version_number` (int), `revision_count` (int), `is_valid` (bool), `failure_reason` (text), `validation_payload` (JSONField), `created_at`.

#### `quizzes`
- `WeeklyQuizAssignment`: Roadmap-scoped quiz assignment. Fields: `id` (UUID), `student` (ForeignKey to User), `roadmap` (ForeignKey to Roadmap, `db_column="roadmap_id"`), `week_number` (int), `status` (`assigned`, `completed`), `created_at`. Unique on `(student, roadmap, week_number)`.
- `AssignmentQuestion`: Junction table capturing frozen question version snapshot. Fields: `id` (UUID), `assignment` (ForeignKey), `question` (ForeignKey), `question_version` (ForeignKey), `order` (int, 1..45). Unique on `(assignment, order)`.
- `QuizAttempt`: Quiz attempt session. Fields: `id` (UUID), `assignment` (ForeignKey), `student` (ForeignKey), `attempt_number` (int), `status` (`in_progress`, `evaluation_pending`, `evaluated`, `abandoned`), `score` (float), `correct_count` (int), `total_questions` (int, 45), `started_at` (datetime), `submitted_at` (datetime, null=True), `time_spent_seconds` (int). Unique on `(assignment, attempt_number)`.
- `AttemptAnswer`: Answer persistence per question. Fields: `id` (UUID), `attempt` (ForeignKey), `assignment_question` (ForeignKey), `user_answer` (text), `is_correct` (bool, null=True), `evaluation_notes` (text), `evaluated_at` (datetime, null=True), `updated_at` (datetime). Unique on `(attempt, assignment_question)`.

### 5. `aptitude` (Phase 5 Verified)
- `AptitudeQuestion`: Canonical aptitude question identity. Fields: `id` (UUID), `category` (`Quantitative Aptitude`, `Logical Reasoning`, `Verbal Ability`), `topic` (CharField, max_length=100), `difficulty` (`easy`, `medium`, `hard`), `status` (`approved`, `suspended`, `inactive`), `current_version_number` (int, default=1), `created_by` (ForeignKey to User, null=True), `created_at`, `updated_at`.
- `AptitudeQuestionVersion`: Immutable content snapshot. Fields: `id` (UUID), `question` (ForeignKey to `AptitudeQuestion`, `related_name="versions"`), `version_number` (int), `question_text` (text), `options` (JSONField, exactly 4 strings), `correct_option_index` (int, 0..3), `explanation` (text), `changelog` (text), `created_by` (ForeignKey to User, null=True), `created_at`. Unique on `(question, version_number)`.
- `AptitudeQuestionReport`: Student issue reporting with deduplication. Fields: `id` (UUID), `question` (ForeignKey to `AptitudeQuestion`), `reported_by` (ForeignKey to User), `reason` (`wrong_answer`, `unclear_question`, `typo_grammar`, `other`), `description` (text), `status` (`pending`, `resolved`, `dismissed`), `admin_notes` (text), `created_at`, `updated_at`.
- `AptitudeValidationHistory`: AI generation and revision audit log. Fields: `id` (UUID), `question` (ForeignKey to `AptitudeQuestion`), `version_number` (int), `revision_count` (int), `is_valid` (bool), `failure_reason` (text), `validation_payload` (JSONField), `created_at`.
- `AptitudeTestConfig`: Platform test structure and rule configuration. Fields: `id` (UUID), `daily_limit` (int, default=5), `duration_minutes` (int, default=60), `total_questions` (int, default=45), `distribution` (JSONField, default: `{"quantitative": 15, "logical": 15, "verbal": 15}`), `mixed_qualifying_cutoff` (float, default=60.0), `is_active` (bool, default=True), `updated_by` (ForeignKey to User, null=True), `updated_at`.
- `AptitudeSession`: Aptitude practice or assessment session. Fields: `id` (UUID), `student` (ForeignKey to User), `session_type` (`standalone`, `mixed_stage`), `status` (`in_progress`, `submitted`, `abandoned`), `score` (float), `total_marks` (int, 45), `percentage` (float), `correct_count` (int), `incorrect_count` (int), `total_questions` (int, 45), `time_spent_seconds` (int), `test_config_snapshot` (JSONField), `started_at` (datetime), `submitted_at` (datetime, null=True), `created_at`, `updated_at`.
- `AptitudeSessionQuestion`: Junction table capturing frozen question version snapshot for the session. Fields: `id` (UUID), `session` (ForeignKey to `AptitudeSession`, `related_name="session_questions"`), `question` (ForeignKey to `AptitudeQuestion`), `version_number` (int), `order` (int, 1..45), `question_snapshot` (JSONField). Unique on `(session, order)`.
- `AptitudeSessionAnswer`: Answer persistence per question. Fields: `id` (UUID), `session` (ForeignKey to `AptitudeSession`, `related_name="answers"`), `session_question` (ForeignKey to `AptitudeSessionQuestion`), `selected_option_index` (int, 0..3, null=True), `is_correct` (bool, null=True), `answered_at` (datetime, null=True), `updated_at`. Unique on `(session, session_question)`.

### 6. `interviews` (Initial Schema)
- `InterviewSession`: `student` (ForeignKey), `interview_type`, `role`, `experience_level`, `salary_range`, `final_result`, `resume_version_reference`, `cooling_period_until`.

### 7. `experiences` (Initial Schema)
- `InterviewExperience`: `author` (ForeignKey), `is_anonymous`, `company_name`, `role`, `experience_level`, `salary_range`, `overall_outcome`, `status`, `helpful_votes_count`, `published_version`.

### 8. `administration` & `common` (Initial Schema)
- `PlatformSetting`: `key` (unique), `value` (JSONField), `description`, `updated_by`.
- `AdminActivityLog`: `actor` (ForeignKey), `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `created_at`.
- `ProcessingJob`: `id` (UUID), `job_type`, `status` (queued, running, succeeded, failed), `payload`, `result`, `error_message`, `retry_count`, `max_retries`, `lease_expires_at`, `completed_at`.
