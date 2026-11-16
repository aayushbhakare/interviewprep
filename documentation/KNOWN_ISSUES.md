# Known Issues & Limitations

This document tracks known limitations, pending provider verifications, and temporary mock fallbacks.

---

## Active Issues & Workarounds

### 1. PostgreSQL Port Configuration
- **Detail:** macOS host runs an existing PostgreSQL instance on port 5432.
- **Resolution:** Dedicated development PostgreSQL instance (Homebrew PostgreSQL 18.4) is configured on port 5433 with trust authentication and databases `interview_platform` and `test_interview_platform`.

### 2. External Provider Status (Budget ₹0)
- **Gemini API:** Subject to actual free-tier quota and developer account enablement. Backend adapters implement deterministic mock/fallback modes for local development and offline testing so tests never depend on internet connectivity or billable credits.
- **Supabase Storage:** Requires project credentials for real cloud storage. A local filesystem mock storage provider is implemented for development to ensure offline resilience.
- **Gmail SMTP:** Requires user-provided App Password. Development uses Django's console email backend (`django.core.mail.backends.console.EmailBackend`) when credentials are not configured.

### 3. CodeRabbit GitHub App Authorization
- **Detail:** CodeRabbit configuration (`.coderabbit.yaml`) is configured and committed to the repository root.
- **Status:** Requires one-time GitHub App authorization by the repository owner at `https://github.com/apps/coderabbitai`. Until authorized for `aayushbhakare/interviewprep`, automated bot reviews on pull requests remain pending; manual code reviews and local test runs are executed.
