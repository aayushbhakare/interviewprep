# Contributing to Interview Preparation Platform (InterviewPrep)

Thank you for your interest in contributing to **InterviewPrep**! This project is an open-source, modular monolithic platform designed to help students prepare for technical recruitments based on their target salary ranges and real-world standards.

To maintain code quality, security, and architectural integrity, please read and follow these guidelines.

---

## 1. Architectural Principles & Constraints

When submitting code or features, keep these fundamental principles in mind:
- **Salary-Wise, Not Company-Wise:** Preparation curricula and diagnostic benchmarks are grouped by target salary tiers (Below ₹3 LPA, ₹3–5 LPA, ₹5–7 LPA, ₹7–10 LPA, ₹10–15 LPA, ₹15+ LPA). Company names are collected strictly within the *Share Interview Experience* module for discovery and filtering.
- **Modular Monolith:** Built as a single cohesive repository with clean domain-based Django applications (`accounts`, `learning`, `content`, `questions`, `quizzes`, `aptitude`, `interviews`, `experiences`, `administration`, `ai_services`, `common`).
- **Lean Initial Infrastructure:** Background asynchronous tasks use a PostgreSQL-backed job ledger (`common.ProcessingJob`). Do not introduce Redis, Celery, or microservices without prior architectural approval.
- **Privacy & Security First:** Never log, expose, or commit secrets, verification codes, or API keys. Always use salted hashing for codes and token blacklisting for session revocation.

---

## 2. Getting Started

1. **Fork the Repository** on GitHub.
2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/<your-username>/interviewprep.git
   cd interviewprep
   ```
3. **Set up local environment files**:
   ```bash
   cp .env.example .env
   cp .env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
4. **Follow the setup instructions** in [SETUP_GUIDE.md](documentation/SETUP_GUIDE.md).

---

## 3. Branching and Commit Conventions

- Create a feature branch from `main`:
  ```bash
  git checkout -b feature/your-feature-name
  # or
  git checkout -b fix/your-bug-fix
  # or
  git checkout -b docs/your-doc-improvement
  ```
- **Commit Messages:** Use clear, conventional commit messages:
  - `feat(accounts): add password strength validator`
  - `fix(auth): handle expired verification tokens gracefully`
  - `docs(readme): update deployment instructions`
  - `test(learning): add test cases for roadmap generation`

---

## 4. Coding Standards

### Backend (Python / Django)
- Python 3.14+ compatible.
- Format and lint using **Ruff**:
  ```bash
  cd backend
  ./.venv/bin/ruff check . --fix
  ./.venv/bin/ruff format .
  ```
- Keep business logic in **services** (`apps/<domain>/services/`), keeping views and serializers focused on request/response validation and serialization.
- All new database models must be accompanied by clean Django migrations.
- Annotate API views with `drf-spectacular` (`@extend_schema`) for auto-generating OpenAPI specifications.

### Frontend (React / Vite)
- Use **JavaScript** (ES6+ / JSX), not TypeScript.
- Follow **Tailwind CSS** and shadcn/ui utility patterns.
- Ensure zero linting errors:
  ```bash
  cd frontend
  npm run lint
  npm run build
  ```

---

## 5. Testing Requirements

All contributions must include appropriate automated tests:
1. **Backend Tests:** Add pytest test cases under `apps/<domain>/tests/`:
   ```bash
   cd backend
   ./.venv/bin/pytest
   ```
2. **Frontend End-to-End Tests:** Add Playwright tests under `frontend/e2e/`:
   ```bash
   cd frontend
   npx playwright test
   ```
Every pull request must pass all backend and frontend test suites before being merged.

---

## 6. Submitting a Pull Request (PR)

1. Ensure your local branch is rebased on the latest `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Run full linting, backend checks, and test suites.
3. Push your branch to your GitHub fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request against `aayushbhakare/interviewprep` (`main` branch) describing:
   - What feature or bug fix is included.
   - Any manual or automated testing performed.
   - Reference to any related GitHub issue.
