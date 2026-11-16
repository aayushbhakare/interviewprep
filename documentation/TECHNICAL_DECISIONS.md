# Technical Decisions Log

This log records architecture and technical decisions made during implementation.

---

## Decisions Record

### TD-001: Monorepo Structure
- **Decision:** Use a single monorepo with `frontend/`, `backend/`, and `documentation/` directories.
- **Rationale:** Aligns with PRD and Blueprint architecture; keeps domain contracts and documentation tightly synchronized.

### TD-002: PostgreSQL 18 Local Configuration
- **Decision:** Run PostgreSQL 18 locally on port `5433` (database: `interview_platform`).
- **Rationale:** Avoids conflict with existing host PostgreSQL service on port 5432 while utilizing native Homebrew PostgreSQL 18.4 with trust authentication.

### TD-003: Custom User Model Before Initial Migration
- **Decision:** Define custom `User` model inheriting from `AbstractBaseUser` and `PermissionsMixin` in `apps.accounts` before creating the first migration.
- **Rationale:** Django standard requirement; changing `AUTH_USER_MODEL` later causes catastrophic migration incompatibility.

### TD-004: Standardized API Response Format
- **Decision:** All `/api/v1/` endpoints adhere to `{ "status": "success", "data": ... }` and `{ "status": "error", "error": { "code": ..., "message": ..., "details": ... } }`.
- **Rationale:** Ensures predictability across React frontend services and API consumers.

### TD-005: Job Queue via PostgreSQL `ProcessingJob`
- **Decision:** Background evaluation and generation jobs will be tracked in a database table `ProcessingJob` without introducing Celery or Redis in initial phases.
- **Rationale:** Fulfills ₹0 budget and architectural simplicity constraint while providing robust, inspectable state recovery and idempotency.

### TD-006: External Service Provider Adapters
- **Decision:** All AI, email, and storage services are accessed via abstract interfaces in backend services, with automatic fallbacks for local offline development.
- **Rationale:** Ensures zero unintentional billing, protects against provider outages, and decouples business logic from vendor SDKs.
