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

### 2. `learning` (Initial Schema)
- `Roadmap`: `user` (ForeignKey), `role`, `experience_level`, `target_salary`, `language`, `framework`, `database`, `status` (preparing, ready, failed), `is_active`, `created_at`, `updated_at`.

### 3. `content` (Initial Schema)
- `TopicContent`: `slug`, `topic_name`, `technology`, `version`, `learning_objectives`, `concept_explanation`, `how_it_works`, `examples`, `practical_implementation`, `interview_perspective`, `key_takeaways`, `is_published`.

### 4. `questions` & `quizzes` (Initial Schema)
- `Question`: `technology`, `topic_slug`, `category`, `difficulty`, `current_version_number`.
- `QuestionVersion`: `question` (ForeignKey), `version_number`, `prompt`, `rubric`, `expected_output`, `validation_status`.
- `WeeklyQuizAssignment`: `student` (ForeignKey), `week_number`, `roadmap_id`, `status`.
- `QuizAttempt`: `assignment` (ForeignKey), `student` (ForeignKey), `attempt_number` (1..5), `status`, `score`, `correct_count`, `total_questions` (45).

### 5. `aptitude` (Initial Schema)
- `AptitudeQuestion`: `category`, `question_text`, `options`, `correct_option_index`, `explanation`, `is_active`.
- `AptitudeSession`: `student` (ForeignKey), `session_type`, `status`, `score`, `total_marks`, `percentage`.

### 6. `interviews` (Initial Schema)
- `InterviewSession`: `student` (ForeignKey), `interview_type`, `role`, `experience_level`, `salary_range`, `final_result`, `resume_version_reference`, `cooling_period_until`.

### 7. `experiences` (Initial Schema)
- `InterviewExperience`: `author` (ForeignKey), `is_anonymous`, `company_name`, `role`, `experience_level`, `salary_range`, `overall_outcome`, `status`, `helpful_votes_count`, `published_version`.

### 8. `administration` & `common` (Initial Schema)
- `PlatformSetting`: `key` (unique), `value` (JSONField), `description`, `updated_by`.
- `AdminActivityLog`: `actor` (ForeignKey), `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `created_at`.
- `ProcessingJob`: `id` (UUID), `job_type`, `status` (queued, running, succeeded, failed), `payload`, `result`, `error_message`, `retry_count`, `max_retries`, `lease_expires_at`, `completed_at`.
