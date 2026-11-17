# Environment Configuration Specification

**Platform:** Interview Preparation Platform (`interviewprep`)  
**Scope:** Backend and Frontend Configuration Parameters, Defaults, Security Controls, and Production Values.

---

## 1. Backend Environment Variables (`backend/.env`)

| Variable | Type | Default (Dev) | Recommended (Production) | Description |
| :--- | :---: | :---: | :---: | :--- |
| `DEBUG` | bool | `True` | `False` | Enables/disables debug mode and production security checks. |
| `SECRET_KEY` | str | `dev-secret-key...` | `random_50_chars` | Cryptographic secret for signing sessions, CSRF, and JWTs. |
| `ALLOWED_HOSTS` | csv | `localhost,127.0.0.1` | `api.yourdomain.com` | Hostnames accepted by the Django HTTP handler. |
| `DB_NAME` | str | `interview_platform` | `interview_platform` | PostgreSQL database name. |
| `DB_USER` | str | `aayushbhakare` | `interview_admin` | PostgreSQL database username. |
| `DB_PASSWORD` | str | `""` | `secure_db_pass` | PostgreSQL database password. |
| `DB_HOST` | str | `127.0.0.1` | `db` or `rds.amazonaws.com` | Database hostname or container service name. |
| `DB_PORT` | str | `5433` (or `5432`) | `5432` | PostgreSQL database connection port. |
| `CORS_ALLOWED_ORIGINS` | csv | `http://localhost:5173...`| `https://app.yourdomain.com`| Authorized client origins permitted for cross-origin AJAX. |
| `CSRF_TRUSTED_ORIGINS` | csv | `http://localhost:5173...`| `https://app.yourdomain.com`| Authorized origins permitted for unsafe HTTP methods. |
| `SECURE_SSL_REDIRECT` | bool | `False` | `True` | Forces all HTTP requests to redirect to HTTPS. |
| `SESSION_COOKIE_SECURE` | bool | `False` | `True` | Flags session cookies with `Secure; SameSite=Lax`. |
| `CSRF_COOKIE_SECURE` | bool | `False` | `True` | Flags CSRF cookies with `Secure`. |
| `SECURE_HSTS_SECONDS` | int | `0` | `31536000` | HTTP Strict Transport Security duration (1 year). |
| `JWT_ACCESS_MINUTES` | int | `60` | `60` | Access token lifespan in minutes. |
| `JWT_REFRESH_DAYS` | int | `7` | `7` | Refresh token lifespan in days. |
| `EMAIL_BACKEND` | str | `console.EmailBackend`| `smtp.EmailBackend` | Django email delivery backend. |
| `EMAIL_HOST` | str | `smtp.gmail.com` | `smtp.sendgrid.net` | Outgoing SMTP server hostname. |
| `EMAIL_PORT` | int | `587` | `587` | SMTP port (`587` for STARTTLS). |
| `EMAIL_USE_TLS` | bool | `True` | `True` | Enables TLS transport encryption for outgoing mail. |
| `EMAIL_HOST_USER` | str | `""` | `apikey` | SMTP authentication username. |
| `EMAIL_HOST_PASSWORD` | str | `""` | `your_smtp_key` | SMTP authentication password or token. |
| `DEFAULT_FROM_EMAIL` | str | `InterviewPrep <...>` | `support@yourdomain.com` | Default sender email address in dispatch headers. |
| `GEMINI_API_KEY` | str | `""` | `""` (Optional) | Google Generative AI key (offline fallback active). |
| `GEMINI_MODEL` | str | `gemini-2.0-flash` | `gemini-2.0-flash` | Selected Google Generative AI model identifier. |

---

## 2. Frontend Environment Variables (`frontend/.env`)

| Variable | Type | Default (Dev) | Recommended (Production) | Description |
| :--- | :---: | :---: | :---: | :--- |
| `VITE_API_BASE_URL` | str | `http://localhost:8000/api/v1` | `https://api.yourdomain.com/api/v1` | Base URL prefix for all REST API endpoints. |

---

## 3. Environment Variable Security Guidelines

1. **Never commit `.env` or `.env.production` files to version control.**
2. **Rotate secrets periodically:** If `SECRET_KEY` is modified, all active sessions and tokens will be invalidated, prompting users to log in again.
3. **Database user privileges:** The production database user should only have privileges over the `interview_platform` schema and database; never use the `postgres` superuser account for web services.
