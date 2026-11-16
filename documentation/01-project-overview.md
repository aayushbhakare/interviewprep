# 01 — Project Overview

## Product vision

Build a student-focused platform that helps users prepare for and practise the full recruitment process, and learn from real interview experiences shared by other students.

The product has three independent modules:

1. **Learn** — personalized, self-paced learning roadmap and weekly quizzes.
2. **Practice** — realistic AI-led voice interviews and separate aptitude practice.
3. **Share Interview Experience** — structured student-submitted recruitment journeys.

Users may use any module independently. A student does not need a roadmap to practise, and does not need to practise or prepare before sharing an experience.

## Core positioning: salary-wise, not company-wise

The platform's central differentiator is salary-wise preparation. A student's target salary range helps determine the expected depth, complexity, problem-solving standard, and interview expectations.

- Do not ask students to choose a target company for Learn or Practice.
- Do not imply that the platform guarantees a salary, job, company, or interview outcome.
- Company names are collected only within Share Interview Experience, to support discovery and filtering.
- Salary range should influence preparation standard, not promise a specific outcome.

## Target users

Students and job seekers across experience levels, including freshers and working professionals. The initial experience should be understandable to a fresher while allowing depth to adapt to experience and target salary.

## Product modules

### Learn
A user configures role, experience, optional salary range, programming language, framework, and database. The platform creates one active roadmap with phases, weeks, topics, practical exercises where relevant, and weekly quizzes.

### Practice
Users choose Technical, HR, or Mixed interviews. Interviews are voice-based, follow a realistic recruitment flow, and are evaluated as PASS or FAIL. Aptitude is a separate test module, and may also be a stage in a fresher's Mixed recruitment process.

### Share Interview Experience
Users record an actual recruitment journey in chronological order. They may submit drafts, update published experiences as the process progresses, choose anonymity, and share experiences regardless of outcome.

## Technology baseline

- Frontend: React + Vite + JavaScript.
- Styling/components: Tailwind CSS + shadcn/ui.
- Routing: React Router.
- Frontend API client: Axios.
- Shared frontend state: React Context API; local component state for local interactions.
- Backend: Python + Django + Django REST Framework.
- Database: PostgreSQL, locally hosted during development.
- ORM/schema changes: Django ORM and migrations.
- API documentation: drf-spectacular (OpenAPI/Swagger).
- File storage: Supabase Storage, private bucket.
- Email: Google Gmail SMTP using an App Password for initial implementation.
- AI: Gemini API for supported text-oriented tasks; Gemini Live API candidate for voice.
- Testing: pytest, pytest-django, Playwright, PostgreSQL test database, Postman for manual API checks.
- Quality: ESLint + Prettier (frontend), Ruff (backend).
- Logging: Python/Django logging.
- Background processing: no Celery/Redis initially; keep task boundaries replaceable.

## Development constraints

- Build locally first; deployment is out of scope until development is ready.
- Initial budget is ₹0. Do not activate paid services or incur charges without explicit approval.
- The developer will use Google Antigravity and provide these Markdown documents locally.
- GitHub is not required for the initial workflow. Local Git is recommended but optional; do not block development on a GitHub account.
- Use one project directory with `frontend/`, `backend/`, and `documentation/`.
- Keep code modular. Do not introduce microservices in the initial version.

## Product quality principles

1. Correctness before visual polish.
2. Preserve user data and history.
3. Explicitly model status and failure states.
4. Do not fabricate AI evaluation results.
5. Keep the interface simple and focused.
6. Make long-running operations recoverable.
7. Reuse shared learning content and question banks instead of regenerating per student.
8. Test business rules, not only happy-path UI flows.
