# Setup Guide

This guide details how to install, configure, test, and run the Interview Preparation Platform locally on macOS.

**GitHub Repository:** `https://github.com/aayushbhakare/interviewprep` (`main` branch)

---

## Prerequisites

- **Git**
- **Python:** 3.11+ (verified on Python 3.14)
- **Node.js:** 20+ (verified on Node.js 24)
- **PostgreSQL:** 15+ (verified on Homebrew PostgreSQL 18.4)
- **Google Chrome:** Installed in `/Applications/Google Chrome.app` (used for Playwright E2E tests)

---

## 0. Clone Repository

```bash
git clone https://github.com/aayushbhakare/interviewprep.git
cd interviewprep
```

---

## 1. Database Setup

Ensure PostgreSQL is running locally on port `5433`:
```bash
brew services start postgresql@18
psql -h 127.0.0.1 -p 5433 -U aayushbhakare -d postgres -c "CREATE DATABASE interview_platform;"
psql -h 127.0.0.1 -p 5433 -U aayushbhakare -d postgres -c "CREATE DATABASE test_interview_platform;"
```

---

## 2. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
python manage.py migrate
python manage.py shell -c "from apps.aptitude.services.seed_data import seed_initial_aptitude_bank; seed_initial_aptitude_bank()"
python manage.py shell -c "from apps.questions.services.seed_data import seed_initial_question_bank; seed_initial_question_bank()"
python manage.py shell -c "from apps.experiences.services.seed_sample_experiences import seed_phase7_experiences; seed_phase7_experiences()"
```

### Initial Administrator Bootstrap
Staff registration is invitation-only. To create the first administrator account:
```bash
python manage.py bootstrap_admin --email admin@interviewprep.local --name "System Administrator" --password "AdminSecretPassword123!"
```

### Run Backend Development Server
```bash
python manage.py runserver 8000
```

Verify backend health:
```bash
curl http://localhost:8000/api/v1/health/
```

Access API Documentation:
- Swagger UI: `http://localhost:8000/api/v1/docs/`
- OpenAPI Schema: `http://localhost:8000/api/v1/schema/`

### Run Backend Tests
```bash
# Run all 96 unit & API tests
pytest

# Or run experiences module tests specifically
pytest apps/experiences/tests/
```

---

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be accessible at `http://localhost:5173`.
To test voice simulations, use Google Chrome or any Chromium browser with Web Speech API support.

### Run Frontend Lint & Build
```bash
npm run lint
npm run build
```

### Run End-to-End Playwright Tests
```bash
# Run all 20 Playwright tests (with backend server running)
npx playwright test

# Or run experience tests specifically
npx playwright test e2e/experiences.spec.js
```
