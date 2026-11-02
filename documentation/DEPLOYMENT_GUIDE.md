# Production Deployment Guide

**Platform:** Interview Preparation Platform (`interviewprep`)  
**Target Environment:** Containerized Linux / Docker / Managed Cloud (Render, Railway, AWS ECS, DigitalOcean App Platform)  
**Architecture:** Django 5.1 Monolith + PostgreSQL 16 + React Vite SPA + Nginx  
**Target Budget:** ₹0 (Free-tier compatible with zero paid infrastructure dependencies)

---

## 1. Deployment Architecture Overview

```
                        ┌─────────────────────────────────┐
                        │      Client Browser (HTTPS)     │
                        └──────────────┬──────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
         ┌─────────────────────┐               ┌─────────────────────┐
         │ React Vite SPA      │               │ Django REST API     │
         │ (Nginx / Cloudflare)│               │ (Gunicorn / WSGI)   │
         │ Port 80 / 443       │               │ Port 8000           │
         └─────────────────────┘               └──────────┬──────────┘
                                                          │
                                               ┌──────────┴──────────┐
                                               ▼                     ▼
                                    ┌─────────────────────┐ ┌─────────────────┐
                                    │ PostgreSQL 16 DB    │ │ Local / Cloud   │
                                    │ (Port 5432)         │ │ Media Storage   │
                                    └─────────────────────┘ └─────────────────┘
```

---

## 2. Pre-Deployment Checklist

Before deploying to staging or production:

- [x] Backend unit & integration tests pass (**108/108 passed**).
- [x] Frontend Playwright regression tests pass (**22/22 passed**).
- [x] Django security deployment check passes (`DEBUG=False python manage.py check --deploy`).
- [x] Frontend production build compiles without errors (`npm run build`).
- [x] All `.env` credential files are excluded from Git.
- [x] A strong 50+ character random `SECRET_KEY` is generated.
- [x] `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` are set to production domains.
- [x] Database migrations are applied (`python manage.py migrate`).

---

## 3. Option A: Docker Compose Deployment (Recommended for VPS / Cloud VMs)

The repository includes a ready-to-use production configuration:
- `docker-compose.prod.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`

### Step 1: Clone Repository & Configure Environment
```bash
git clone https://github.com/aayushbhakare/interviewprep.git
cd interviewprep

# Copy and configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your production secrets:
```ini
DEBUG=False
SECRET_KEY=your-secure-50-character-secret-key-here
ALLOWED_HOSTS=api.yourdomain.com,127.0.0.1
DB_NAME=interview_platform
DB_USER=interview_admin
DB_PASSWORD=your_secure_db_password
DB_HOST=db
DB_PORT=5432
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://app.yourdomain.com,https://api.yourdomain.com
```

### Step 2: Build and Start Containers
```bash
docker compose --env-file backend/.env -f docker-compose.prod.yml up -d --build
```

### Step 3: Run Database Migrations
```bash
docker compose --env-file backend/.env -f docker-compose.prod.yml exec backend python manage.py migrate
```

### Step 4: Seed Question Bank & Aptitude Bank (Optional Initial Seed)
```bash
docker compose --env-file backend/.env -f docker-compose.prod.yml exec backend python manage.py seed_question_bank
docker compose --env-file backend/.env -f docker-compose.prod.yml exec backend python manage.py seed_aptitude_bank
```

### Step 5: Verify Health Checks
```bash
# Query backend API health via allowed host (127.0.0.1)
curl -f http://127.0.0.1:8000/api/v1/health/
# Query frontend Nginx reverse proxy
curl -f http://127.0.0.1/
```

---

## 4. Option B: Cloud PaaS Deployment (Render / Railway / AWS ECS)

### Backend (Django Web Service)
1. **Environment:** Python 3.14 (or Python 3.12+).
2. **Build Command:** `pip install -r backend/requirements.txt && cd backend && python manage.py collectstatic --noinput`
3. **Pre-Deploy / Release Command:** `cd backend && python manage.py migrate --noinput`
4. **Start Command:** `cd backend && python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3`
4. **Environment Variables:**
   - `DEBUG=False`
   - `SECRET_KEY=<production_secret>`
   - `DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>` (or individual `DB_*` variables)
   - `ALLOWED_HOSTS=<your_backend_domain>`
   - `CORS_ALLOWED_ORIGINS=https://<your_frontend_domain>`
   - `CSRF_TRUSTED_ORIGINS=https://<your_frontend_domain>,https://<your_backend_domain>`
   - `SECURE_SSL_REDIRECT=True`
   - `SESSION_COOKIE_SECURE=True`
   - `CSRF_COOKIE_SECURE=True`

### Frontend (Static Site / CDN)
1. **Host:** Cloudflare Pages, Vercel, Netlify, or AWS S3 + CloudFront.
2. **Framework Preset:** Vite.
3. **Root Directory:** `frontend`.
4. **Build Command:** `npm run build`.
5. **Output Directory:** `dist`.
6. **Environment Variable:**
   - `VITE_API_BASE_URL=https://<your_backend_domain>/api/v1`
7. **SPA Routing:** Ensure single-page routing rewrite rule is enabled (`/* -> /index.html`).

---

## 5. Post-Deployment Verification

1. **API OpenAPI Docs:** Visit `https://<your_backend_domain>/api/v1/docs/` to inspect live Swagger UI.
2. **Registration Flow:** Register a test candidate account and verify email delivery.
3. **Platform Monitoring:** Log in to `/admin-login`, complete 2FA, and verify system health at `/admin/monitoring`.
