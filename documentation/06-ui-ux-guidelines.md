# 06 — UI/UX Guidelines

## General design principles

- Simple, clear, responsive interface.
- Consistent design system using Tailwind CSS and shadcn/ui.
- Build custom components for product-specific workflows.
- Avoid excessive cards, charts, badges, decorative gradients, and unnecessary notifications.
- Use clear loading, empty, success, error, and pending states.
- Confirm destructive actions.
- Accessibility: keyboard support, visible focus, labels, contrast, semantic controls.
- Mobile-friendly layouts; test common mobile and desktop widths.

## Student navigation and dashboard

Navigation:
- Dashboard
- Learn
- Practice
- Share Interview Experience
- Profile & Settings

Dashboard:
- Three module shortcuts with equal importance.
- Continue Learning if active roadmap exists.
- Recent Activity.
- Quick access to experience submissions/drafts.
- No notification bell or unnecessary analytics.

## Learn UI

Setup should be a clear sequence with one selection per field and a review screen before generation. Do not ask these questions at registration.

Roadmap:
- Show phases, weeks, topics, and weekly progress.
- All content is open; no locked weeks.
- Each topic has completion checkbox and skip/Not Verified behavior.
- Progress should visibly distinguish completed, not started, and Not Verified.
- Weekly quiz is inside its week.
- Show quiz preparation status (Ready/Preparing/Temporarily Unavailable).
- Topic content should use only sections that make sense for that topic.
- Exercises appear only where relevant and are separate from weekly quiz progress.

Roadmap replacement:
- Warn that the active roadmap, progress, and quiz history will be replaced.
- Cancel leaves data unchanged.
- Confirm only after the user understands impact.
- Do not delete old roadmap before replacement generation succeeds.

## Quiz UI

- 45 questions split into the five defined sections.
- No MCQ controls.
- Provide suitable text/code editors.
- Allow back-and-forth navigation.
- Show question palette/status.
- Persistent timer, 10-minute highlight, 5-minute warning.
- No hints, answers, or explanations during attempt.
- Confirm leave/abandon; Cancel preserves answers.
- At submission, show evaluation progress and do not display final score until all answers are evaluated.
- Clearly distinguish Evaluation Pending from Abandoned.
- Review page must show exact attempt snapshot, submitted answer, correct answer, explanation, and code where relevant.

## Practice voice interview UI

- Voice-only interview. No text chat mode.
- Simple interviewer profile picture; no animated avatar.
- Status indicators: Listening, Thinking, Speaking.
- Microphone/interrupt control to manually interrupt speech.
- Automatic silence detection plus manual Done Speaking.
- Clear connection/error/retry states.
- User can verbally ask for repeat or clarification.
- Do not show question-by-question scoring, transcript, or numeric score.
- Result PASS/FAIL and approved feedback categories only.

## Aptitude UI

- Simple start flow; no category-first configuration.
- Question navigation and palette: Answered, Not Answered, Current Question.
- No pause.
- Warn about unanswered questions at submission and allow return or submit anyway.
- Immediate results and review of submitted/correct answers.
- Show daily attempts remaining for standalone sessions only.

## Share Experience UI

- Chronological timeline with flexible add/remove stage/round capability.
- Draft and publish are separate actions.
- Anonymous / Show my name choice.
- Drafts private.
- Display moderation status clearly.
- Published experience cards should not overemphasize outcome.
- Filters: salary, role, experience, company, outcome, round.
- Helpful and Report actions; no comments initially.
- Clearly label student-reported questions in Learn.

## Admin UI

Use a separate admin layout and route protection. Dashboard should surface counts requiring attention and link to the relevant management page. Keep forms clear, validate settings, and show audit information. Do not expose credentials or secrets.

## Reusable components

Use shadcn/ui for buttons, inputs, dialogs, dropdowns, tables, tabs, alerts, and other standard primitives. Build product-specific components separately:
- RoadmapPhase/Week/Topic
- ProgressIndicator
- QuizTimer/QuestionPalette/CodeAnswer
- InterviewVoiceControls
- ExperienceTimeline/StageEditor
- ModerationStatus
- AdminMetric/AttentionQueue

Do not create a new visual component library from scratch.
