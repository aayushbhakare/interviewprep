# 02 — Product Requirements Document (PRD)

This document is the authoritative description of product behavior. Do not invent or silently alter requirements.

# A. Registration, login, and dashboard

## Registration
- Collect name, email, and password only.
- Verify email with a one-time code.
- Do not ask roadmap or interview setup questions during registration.
- After registration, user can log in using email and password.
- Password reset must use a secure verification flow.

## First login and dashboard
Show three equally important entry points:
- Learn
- Practice
- Share Interview Experience

Also show:
- Continue Learning with active roadmap and progress, when present.
- Recent Activity, such as latest quiz/interview results.
- Quick access to experience submissions/drafts.

Avoid notification bells, unnecessary charts, and excessive dashboard statistics.

## Navigation
Student navigation:
- Dashboard
- Learn
- Practice
- Share Interview Experience
- Profile & Settings

Admin navigation:
- Dashboard
- Student Management
- Learning Content
- Question Bank
- Aptitude Management
- Interview Experience Moderation
- Platform Settings
- AI Model Management
- AI & System Monitoring
- Admin Activity Log
- Maintenance Controls

## Profile and resume
- Profile supports name, email, optional profile/contact details, password/email changes with verification, account deletion, and logout.
- Resume upload is optional.
- Initial supported format: PDF.
- User can preview, download, replace, and delete resume.
- Resume is stored privately in Supabase Storage.
- Each interview retains a snapshot/reference to the resume version used at that time. Replacing the current resume must not rewrite historical interview context.

# B. Learn module

## Setup flow
Ask only when the user opens Learn:
1. Target role.
2. Experience level.
3. Optional target salary range.
4. One programming language.
5. One compatible framework.
6. One database.
7. Review summary and generate roadmap.

Roles:
- Backend Developer
- Frontend Developer
- Full Stack Developer
- Java Developer
- Python Developer
- Software Tester / QA Engineer
- Data Analyst
- Data Engineer
- DevOps Engineer
- Other (custom text field)

Experience:
- Fresher
- Less than 1 year
- 1–3 years
- 3–5 years
- 5+ years

Optional salary:
- Below ₹3 LPA
- ₹3–5 LPA
- ₹5–7 LPA
- ₹7–10 LPA
- ₹10–15 LPA
- ₹15+ LPA
- Skip for now

Technology selection:
- Show the full programming language list regardless of role.
- Examples: Python, Java, JavaScript, TypeScript, C, C++, C#, PHP, Go, Ruby, Kotlin, Swift, Rust, Other.
- Exactly one language.
- Then show compatible frameworks; exactly one.
- If language changes, clear the previous framework and require a compatible framework selection.
- Other fields are available where the listed options do not fit.
- Database list is available regardless of role/framework; exactly one selection.
- Examples: MySQL, PostgreSQL, MongoDB, SQLite, Microsoft SQL Server, Oracle Database, Redis, MariaDB, Firebase, Other.
- Do not offer multi-select, “No Framework”, or “Not Sure Yet”.

If the user has a Learn roadmap, Practice setup may prefill role, experience, stack, and salary, but user can edit them.

## Roadmap
- Only one active roadmap per student.
- Roadmap is self-paced: no deadlines, expiry, daily-hours requirement, pause/resume feature, or time pressure.
- Organize roadmap into phases and weeks. Adapt phases to the selected role and stack.
- Example backend phases: Programming Fundamentals; Core Programming; Framework; Database; Backend Development; Projects; Interview Preparation.
- Backend skills default to beginner unless user-provided experience indicates otherwise.
- Roadmap content is open immediately; no locked weeks/topics.
- Users can navigate in any order.
- Topic completion is tracked by checkboxes and autosaved.
- User may skip topics they already know. Skipped topics are marked **Not Verified**, not completed. They remain in their original week; later topics do not shift.
- User can revisit and verify skipped knowledge later.
- Each week shows progress as completed items / total items. Each topic and that week's submitted quiz each count as one item.
- Example: 30 topics + quiz = 31 items. If 28 topics are complete and quiz not submitted, progress is 28/31.
- Quiz submission counts as complete even while evaluation is Pending. Abandoned quiz does not count. Retakes do not add progress.
- Weekly quiz is integrated into the roadmap. It is not a separate module.
- Quiz may be attempted without completing all topics and is not required to move to another week.

## Replacing the active roadmap
When user chooses Create New Roadmap while one exists:
- Show a clear confirmation warning that the current roadmap, learning progress, and associated quiz history will be replaced/deleted.
- Cancel leaves existing data untouched.
- Confirm is sufficient; no typed DELETE phrase.
- Do not destroy old data before the new roadmap has been successfully generated and saved. If generation fails, preserve the existing roadmap.
- No previous-roadmap archive/history section. Replacement starts a fresh roadmap and fresh quiz allocation/attempt limits.

## Learning topic content
Use a flexible structure. Sections may include:
- Learning objective.
- Simple concept explanation.
- How it works / internals.
- Examples.
- Practical implementation where relevant.
- Interview perspective.
- Key takeaways.

Do not force every section onto every topic. Keep explanations concise and adapt depth to experience and target salary. Include code, diagrams, and exercises only when useful.

Topic-level exercises:
- Include only for relevant topics, not every topic.
- Examples: SQL joins → query exercise; Python loops → coding problem; OOP → implement inheritance; HTTP status codes → scenario.
- Match experience and increase difficulty gradually.
- Separate from weekly quizzes.
- Exercise attempts do not affect roadmap completion.
- Coding evaluated with test cases; SQL by query execution/result comparison; conceptual answers by AI evaluation.
- Unlimited attempts are allowed subject to abuse protection, rate limits, duplicate-request protection, timeout/retry limits, and cost monitoring.

## Weekly quizzes
Every weekly quiz contains 45 non-MCQ questions:
1. Code Output Prediction — 10.
2. Find the Error & Debugging — 10.
3. Coding Problems — 10.
4. Scenario-Based Questions — 10.
5. Conceptual & Short-Answer — 5.

Rules:
- Require typed answers, code, and explanations; no MCQs.
- Ask users to explain their approach. Coding: code plus approach and important choices; complexity when appropriate.
- Coding uses an in-browser editor.
- No hints, answers, or explanations while taking the quiz.
- Binary correct/incorrect; no partial marks or weighted marks.
- Score = correct / 45 × 100.
- Coding evaluation considers code correctness and required explanation. Feedback may describe strengths/mistakes even though scoring is binary.
- Evaluation methods vary by type: output comparison, coding test cases + explanation, debugging correction, conceptual key concepts, scenario rubric/AI as appropriate.
- Duration: 75 minutes. Highlight at 10 minutes, warning at 5 minutes, auto-submit at zero.
- User can move between sections and questions.
- If user leaves before submission, show confirmation. Cancel keeps answers; confirm abandons and discards answers, records Abandoned, zero attempted, no score.
- At zero, auto-submit entered answers; unanswered questions are incorrect.
- After submit, show “Your quiz has been submitted successfully. Evaluating your answers...” and evaluation progress.
- Show final score only after all 45 answers are evaluated.
- If evaluation fails, retry automatically first. If still failing, preserve answers and mark Evaluation Pending. Resume later and email when ready. Never assign zero/wrong due to service failure.
- Retakes allowed only after score is generated.
- Maximum 5 submitted attempts per weekly quiz per roadmap. Abandoned does not consume an attempt. Evaluation Pending counts as submitted but blocks retake until resolved. New roadmap resets limit.
- History latest first; show attempt number, date/time, score if available, correct/wrong, and status (Submitted, Evaluation Pending, Abandoned).
- Open attempt to review exact question versions, submitted answers, correct answers, explanations, and submitted code/explanations.
- No best-score highlight, no deletion. History is immutable except that replacing the entire roadmap clears associated history after confirmation.
- Preserve question/evaluation snapshots and versions. Question bank updates must not change old attempts.
- Prefer unseen questions. If a category lacks enough unseen questions, occasional repetition is allowed.
- Pre-generate and store shared question banks; do not generate questions during the live quiz.
- Shared bank is organized by technology/topic/week/category/difficulty and reused across students with compatible roadmaps.
- Initial target buffer: 5× quiz requirement per weekly syllabus/technology: 50 output, 50 debugging, 50 coding, 50 scenario, 25 conceptual = 225 questions. Dynamically adjust based on usage, active students, repetition, and unseen availability.
- At roadmap generation, identify technologies/topics, check shared bank, generate and validate missing questions, store versions, assign 45 question references/versions per student/week, and show Ready/Preparing/Temporarily Unavailable. Roadmap remains usable while quiz preparation runs.
- AI-only question review; no human reviewer by default. Review priority based on usage, reports, automated flags; serious issues should be reviewed promptly.
- Students can report a question with reason: Incorrect question / Incorrect answer / Incorrect explanation / Outdated information / Other, plus optional details.
- Report statuses: Submitted, Under AI Review, Issue Confirmed, No Issue Found, Corrected.
- AI validation: initial review plus up to 3 retries. If still not confident, suspend from new quizzes (Suspended – Review Failed), retain versions/history, and exclude from new assignments. Admin may inspect/correct/approve/deactivate.
- New questions are generated only when approved bank capacity is insufficient.

# C. Practice module

## General principles
- Practice simulates a real recruitment interview, not a customizable mock test.
- Realistic rounds, pacing, and question count; no user-defined duration/question count.
- AI adapts follow-up questions naturally.
- Target role, experience, salary, and stack guide expected standard.
- No company selection.
- Voice-only interview; no text-based interview.
- No animated avatar. Show a simple interviewer profile picture.
- Show status: Listening / Thinking / Speaking.
- User can manually interrupt AI speech with a microphone/interrupt control. Do not rely on automatic voice-activity interruption for this behavior.
- Automatic silence detection identifies answer completion; provide manual “Done Speaking” backup.
- User may verbally ask to repeat, explain, or clarify; AI should clarify without giving hints or answers.
- User may say “I don't know”; no skip button.
- Professional interviewer tone.
- Resume optional. Use current resume for future interviews; retain a resume snapshot/reference per interview.

## Interview types
- Technical, HR, Mixed.
- Aptitude is a separate test, not an interview.
- Technical: one-to-one AI voice interview.
- HR: one-to-one AI voice interview.
- Mixed: sequential recruitment rounds (3–4 rounds), selected automatically by role/experience. Aptitude may be a stage for freshers.

## Setup
- Interview type required: Technical, HR, Mixed.
- Target role required.
- Experience required.
- Salary range required: Below ₹3, ₹3–5, ₹5–7, ₹7–10, ₹10–15, ₹15+ LPA.
- Language/framework/database required for Technical/Mixed; not for HR.
- If Learn roadmap exists, prefill role/experience/stack/salary; editable.
- Resume optional.
- No configurable interview duration or question count.

## Evaluation and history
- Result is PASS or FAIL only. No numerical marks/percentages.
- Do not show strengths, question-by-question evaluation, or spoken-answer transcript.
- Post-round feedback covers technical knowledge where relevant, communication, problem-solving, weaknesses/areas to improve, and suggestions for improvement/better answers.
- Mixed: show individual round PASS/FAIL and final overall result. Round-wise category feedback may be provided.
- History list: date/time, type, role, salary range, final PASS/FAIL, and round results for Mixed.
- Do not retain/display detailed feedback history, question breakdown, or PDF reports. No deletion; previous records remain.

## Mixed recruitment and cooling period
- Mixed has 3–4 sequential rounds.
- User completes each round before next.
- Fail any round → overall FAIL; later rounds Not Attempted; process ends.
- After 24 hours, user may start a new Mixed process from Round 1. No resuming failed round.
- Standalone Technical/HR failure also creates a 24-hour cooling period for that same type.
- Restriction applies only to failed type; other types remain available.
- Previous results remain in history.

# D. Aptitude Practice

- Freshers only.
- Available as standalone Aptitude Practice and as an assessment stage in Mixed recruitment.
- One shared, pre-generated Aptitude Question Bank; same selection/revision logic in both contexts.
- Same bank and difficulty for all freshers; salary-independent.
- Follow the latest applicable TCS NQT pattern at implementation time; verify official current pattern then rather than hardcoding an old version.
- No category-first user setup; present a simple main test.
- Standalone result: marks, correct answers, incorrect answers; no PASS/FAIL.
- Mixed aptitude result: marks and correct/incorrect; compare to qualifying threshold.
- Initial Mixed aptitude threshold: 60%; >=60% PASS, below 60% FAIL. Admin-configurable.
- Standalone limit: 5 completed sessions per day, daily reset. Mixed aptitude does not consume standalone daily limit.
- Only submitted sessions consume daily attempts. Abandoned sessions do not.
- No pause. Leaving before submission abandons session.
- User can navigate back and forth and change answers until submit.
- Question palette: Answered, Not Answered, Current Question.
- On submission show marks, correct/incorrect, correct answers and explanations immediately; same details in history.
- History includes date/time, marks, correct/incorrect; open a session to review submitted answers and correct answers.
- Each new session gets a fresh set from shared bank; previous history remains.
- Final submission confirmation is recommended if unanswered questions exist, showing unanswered count and allowing submit anyway or return.

# E. Share Interview Experience

## Purpose and privacy
Capture detailed actual recruitment journeys to help other students and supply student-reported interview questions to Learn.

- Student chooses Anonymous or Show my name.
- Platform retains account identity internally for moderation and duplicate detection.
- Accept all outcomes: Selected, Rejected, Result Awaited, Withdrew/Did not complete.
- Student can edit/delete own submissions.
- Drafts are private.
- Students may add/skip stages and multiple rounds. Do not force a fixed sequence.
- Stages may include Application, Initial screening, Aptitude/assessment, multiple Technical rounds, HR, Final outcome, Overall experience.
- Capture date/approximate time, time gap, online/offline mode, elimination status, difficulty, actual questions, and follow-ups where relevant.
- Save as Draft; edit anytime; add rounds over time.
- Moderation starts on publish, not while draft.
- Published experience may be updated as process progresses. Re-run updated content through moderation; existing published version remains visible while update is under review.

## Moderation
- Risk-based automated moderation.
- Low-risk submission passing automated checks can auto-publish.
- Suspicious/high-risk submissions and community reports go to admin review.
- Checks may include verified email, structured fields, duplicate detection, spam/inappropriate/copied/personal-information screening, optional redacted evidence, and reports.
- Automated pass means passed content moderation; it does NOT prove authenticity.
- Statuses: Pending Review, Published, Rejected.
- Admin sees flag reasons and moderation history; can publish/reject and handle reports.
- No manual admin review of every submission.

## Discovery and interactions
- Searchable experience list.
- Sort: Most Recent, Most Helpful.
- Filters: target salary, job role, experience level, company name, outcome, recruitment round.
- Do not give outcome special prominence on cards.
- Helpful button and Report button; no comments initially.
- Company name is collected only in this module and used for discovery/filtering, not Learn or Practice.
- Student-reported questions from published experiences may be extracted and categorized by technology/role/topic for Learn.
- Label clearly as “Student Reported Interview Question”; do not claim independently verified. Distinguish from “AI Generated”.

# F. Admin panel

## Roles and access
- Initially one Admin role with all access.
- Architecture should allow future Super Admin, Content Admin, Moderation Admin roles.
- Invitation-only; no public admin registration.
- First admin created securely during setup; existing admins can invite/create additional admins.
- Email/password plus mandatory 2FA.
- Expire inactive sessions and rate-limit login.
- Separate Student/Admin permissions.
- Never expose passwords or private authentication secrets.

## Dashboard
Overview counts: registered students, new registrations, roadmaps generated, technical/HR/Mixed interviews completed, aptitude tests attempted, experiences published.
Attention required: experiences pending review, reported questions, suspended questions, quiz evaluation failures, roadmap/quiz generation failures.
Counts navigate to relevant management sections. Avoid complex analytics initially.

## Student management
Search/view by name/email and registration date; account status; suspend/reactivate; basic activity (roadmaps generated, interviews completed).

## Learning content management
Browse by role/technology/subject; create/edit/delete/deactivate topics; publish updates; version content; monitor reports/outdated content. Historical quiz attempts must remain unchanged.

## Question bank management
Technical and aptitude banks; search by technology/topic/category/difficulty; add/edit/deactivate; inspect AI validation and student reports; monitor usage/repetition. New versions rather than overwrite; old attempts retain exact versions. Deactivated questions excluded from new quizzes.

## Experience moderation
Review high-risk items and reports; see flag reason and moderation history; publish/reject. Automated low-risk items can auto-publish.

## Platform settings
Admin-configurable: quiz attempts (initial 5), aptitude daily limit (initial 5), Mixed aptitude threshold (initial 60%), interview cooling period (initial 24h), weekly quiz duration (75 min), and other approved operational settings.
Validate before save; log who changed what and when. Apply changes to new sessions, not active sessions. Sensitive settings can be restricted when roles expand.

## AI and system monitoring
Monitor API requests/token consumption, estimated daily/monthly expenditure, service failures, latency/response time, and background jobs. Filter by date/service.

## Admin activity log
Automatic, read-only, searchable/filterable record of important admin actions, timestamp, affected item, previous/new value, and success/failure. Admins cannot modify/delete logs.

## Backups
Backups are required before production, but frequency, retention, storage destination, automation, and recovery procedure are not finalized. Recommend separately stored automated backups, monitoring, controlled recovery, and periodic restore tests. Confirm the actual policy before production.

## AI model management
Configure model per service (content, quiz evaluation, voice interview, moderation), usage limits/budgets, model cost/performance, fallback models. Credentials securely stored and never displayed.

## Maintenance controls
Enable/disable individual modules and show maintenance messages while unaffected modules continue. Avoid interrupting active quiz submissions. Admin notifications are deferred; important failures visible in dashboard/monitoring.
