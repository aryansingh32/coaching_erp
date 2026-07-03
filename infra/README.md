# CoachingOS — Local Docker Quick Start

## What you need

- Docker Engine + Docker Compose v2
- ~8 GB RAM free (dev stack) / ~16 GB+ (full stack)
- Ports: **3001** (web), **8080** (gateway), **8000** (ERPNext)

## 1. Configure environment

```bash
cd infra
cp .env.example .env
# Edit .env — at minimum set DB_PASSWORD, REDIS_PASSWORD, JWT_* secrets
```

## 2. Dev stack (recommended for first test)

Gateway + Web + PostgreSQL + Redis + NATS + ERPNext:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Wait until gateway is healthy:

```bash
curl http://localhost:8080/api/v1/health
```

## 3. Bootstrap ERPNext + Education (once)

```bash
./scripts/erpnext-setup.sh
```

Then open **http://localhost:8000**, log in as Administrator, create API keys, and paste into `.env`:

- `ERPNEXT_API_KEY`
- `ERPNEXT_API_SECRET`

Restart gateway:

```bash
docker compose -f docker-compose.dev.yml restart gateway
```

## 4. Open the UI

| Service | URL |
|---------|-----|
| **Web UI** | http://localhost:3001 |
| **API** | http://localhost:8080/api/v1 |
| **ERPNext desk** | http://localhost:8000 |

Dev login (gateway): use `OTP_DEV_CODE` from `.env` (default `123456`) with a phone in `SUPER_ADMIN_PHONES`.

## 5. Full production-like stack

Includes Moodle, ClickHouse, Metabase, Novu, observability, Nginx:

```bash
./scripts/gen-selfsigned.sh   # TLS for nginx
docker compose up -d --build
```

Add to `/etc/hosts`:

```
127.0.0.1 api.coachingos.local app.coachingos.local
```

Then use https://app.coachingos.local (nginx) instead of localhost ports.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Web can't reach API | Rebuild web after changing API URL: `docker compose build web --no-cache` |
| Gateway won't start | Check `docker compose logs gateway` — often missing ERPNext keys or DB not ready |
| Education app missing | Re-run `./scripts/erpnext-setup.sh` (fetches `frappe/education` v15) |
| CORS errors | Set `CORS_ORIGINS=http://localhost:3001` in gateway env |

## Native dev (no Docker for gateway/web)

```bash
# infra — DB only
docker compose -f docker-compose.dev.yml up -d postgres redis nats erpnext-db erpnext

# gateway
cp gateway/.env.example gateway/.env
cd gateway && npm ci && npm run start:dev

# web
cp web/.env.example web/.env.local
cd web && npm ci && npm run dev
```
