# Delivery Tracker Platform

Real-time delivery management platform (SaaS) — Rails API backend, React dashboard,
and an Expo/React Native driver app.

## Structure

```
backend/    Rails 8 API-only app (PostgreSQL + PostGIS, Redis, Sidekiq, ActionCable)
frontend/   React + TypeScript admin/dispatcher dashboard (Vite, Tailwind, React Query)
mobile/     Expo (React Native + TypeScript) driver app
infra/      nginx reverse-proxy config
```

## Prerequisites

- Docker Desktop (the Rails API, Postgres, Redis, Sidekiq, and nginx all run in containers —
  no local Ruby install needed)
- Node.js 20+ (for running the frontend and mobile apps directly on the host)

## Backend (Docker)

```bash
docker compose up -d          # postgres, redis, api, sidekiq, nginx, mailhog
docker compose run --rm api bundle exec rails db:create db:migrate db:seed
```

`db:seed` creates the four roles (admin/dispatcher/driver/customer) and, in development,
a default admin user: `admin@deliverytracker.dev` / `password123`.

- API: http://localhost:3000 (proxied via nginx at http://localhost:8080)
- Health check: `GET /api/health`
- ActionCable: `ws://localhost:3000/cable`
- Mailhog UI: http://localhost:8025
- Postgres: localhost:5432 (`delivery_tracker` / `delivery_tracker`)
- Redis: localhost:6379

Run the test suite and linter (RAILS_ENV=development leaks into `docker compose run`
from the service config, so tests go through `bin/test`, which forces `RAILS_ENV=test`):

```bash
docker compose run --rm api bin/test
docker compose run --rm api bundle exec rubocop
```

## Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173, proxies /api and /cable to localhost:3000
```

## Mobile

```bash
cd mobile
npm install
npm start         # Expo dev server — scan the QR code with Expo Go, or press a/i for a simulator
```

Set `EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000/api`) if the API isn't
reachable at localhost from your device/simulator.

## Status

Per the spec's MVP roadmap:

- **Sprint 1** (project setup) — infra, folder structure, placeholder pages/screens.
- **Sprint 2** (authentication) — JWT access tokens (15min) + rotating refresh tokens
  (30 days), account lockout after 5 failed attempts, role-based `User`/`Role` model,
  `POST /api/auth/{login,refresh,logout}` and `GET /api/me`. Wired end-to-end in the
  React dashboard (login → protected routes → logout) and the Expo driver app
  (login → authenticated stack → logout), both with automatic access-token refresh
  on 401.

Sprint 3 (customers) is next.
