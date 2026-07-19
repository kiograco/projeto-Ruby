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

## Features

- **Authentication** — JWT access tokens (15min) with rotating refresh tokens (30 days),
  account lockout after 5 failed login attempts, role-based users (admin/dispatcher/driver/
  customer). Login, session refresh, and logout work end-to-end in both the React dashboard
  and the Expo driver app.
- **User management** — full CRUD (`/api/users`, admin manages, dispatcher reads), plus
  self-service profile editing (`PATCH /api/me`) for any signed-in user. Deleting a user
  deactivates it instead of a hard delete, since it may be referenced by historical orders.
  Dashboard has a Settings page (admin user management) and a Profile page (self-service).
- **Customers** — full CRUD (`/api/customers`) with search and pagination, restricted by
  role (admin manages, dispatcher has read access). Backed by a dashboard page with a
  searchable, paginated table and create/edit/delete forms.
- **Vehicles** — full CRUD (`/api/vehicles`) with search and pagination, same admin/
  dispatcher access split, dashboard page to match.
- **Drivers** — full CRUD (`/api/drivers`); creating a driver also creates its underlying
  user account (role `driver`) atomically. Drivers can see and manage their own record;
  admin/dispatcher see all. Dashboard page assigns a vehicle and status per driver.
  Admins can attach driver documents (license, background check, etc.) via
  `POST /api/drivers/:id/documents` (Active Storage), managed from a Documents panel
  on the Drivers page.
- **Orders** — `/api/orders` with nested pickup/delivery addresses and line items created
  in one request, a validated status flow (pending → assigned → picked_up → in_transit →
  near_destination → delivered, with cancelled/failed as terminal off-ramps — invalid
  transitions are rejected), and role-scoped access: admin/dispatcher manage everything,
  drivers see and progress only their assigned orders, customer-role users can create
  orders. Dashboard page filters by status, assigns drivers, and drives status transitions.
  A proof-of-delivery file can be attached per order (`POST /api/orders/:id/proof_of_delivery`,
  Active Storage) by the assigned driver or admin/dispatcher, uploaded and viewed from the
  order's History panel.
- **Live tracking** — drivers post GPS coordinates to `/api/tracking/location`, which
  updates the driver's current position and broadcasts the point over ActionCable
  (`DeliveryTrackingChannel`, authenticated via a JWT passed as a `?token=` query param
  on the websocket connection). The dashboard's Tracking page renders a Leaflet map that
  updates live as points arrive — driver marker, destination marker, route polyline,
  speed, and straight-line distance remaining — with no polling or page reload. The Expo
  driver app's Current Delivery screen shares location every 5 seconds via
  `expo-location`'s `watchPositionAsync` while a delivery is active, and drives the same
  status-transition flow as the dashboard.
- **Dashboard** — `/api/dashboard/overview` (active/online drivers, deliveries today,
  average delivery time, revenue today, pending/completed deliveries) and
  `/api/dashboard/realtime` (online drivers with live position and current order),
  both admin/dispatcher only. Dashboard page shows the overview as a stat-tile grid,
  auto-refreshing every 15 seconds.
- **Reports** — `/api/reports/{deliveries,drivers,performance}`, each renderable as
  JSON, CSV (`?export=csv`), or PDF (`?export=pdf`, via Prawn). Deliveries is a daily
  breakdown over a date range; drivers ranks by completed deliveries with average
  delivery time and revenue; performance is a fleet-wide summary including on-time
  rate. Reports page has a tab per report with a live table and CSV/PDF download
  buttons that stream the authenticated response as a file.
- **Notifications** — in-app and email notifications fire on order creation, driver
  assignment, and each status transition (picked up, near destination, delivered,
  failed), addressed to the order's creator (and the assigned driver, on assignment).
  Emails render via `ActionMailer` and deliver through Mailhog in development
  (`SendEmailJob`, run on Sidekiq). `GET /api/notifications` lists a user's
  notifications with an unread count and pagination; `PUT /api/notifications/:id`
  and `POST /api/notifications/mark_all_read` mark them read. The dashboard header
  has a notification bell with an unread badge, dropdown list, and mark-as-read.
- **Audit trail** — order creation, driver assignment, and status transitions, plus
  admin actions on users (create/update/deactivate), are recorded to an `AuditLog`
  table with the acting user, IP address, and a before/after snapshot (stamped via
  an `ActiveSupport::CurrentAttributes` set during authentication). `GET
  /api/orders/:id/timeline` returns an order's event history; the Orders page has a
  "History" button per row that opens it as a timeline panel.

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

Add `-e COVERAGE=1` to generate a SimpleCov report at `backend/coverage/index.html`
(168 examples, 99%+ line coverage — the only gaps are empty Rails boilerplate that
nothing in the app calls yet, like `ApplicationMailer`):

```bash
docker compose run --rm -e COVERAGE=1 api bin/test
```

### API endpoints

```text
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/me
PATCH  /api/me

GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id   (deactivates, not a hard delete)

GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id

GET    /api/vehicles
POST   /api/vehicles
GET    /api/vehicles/:id
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id

GET    /api/drivers
POST   /api/drivers
GET    /api/drivers/:id
PUT    /api/drivers/:id
DELETE /api/drivers/:id

GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id
DELETE /api/orders/:id

POST   /api/tracking/location
GET    /api/tracking/:order_id
GET    /api/tracking/history/:order_id

GET    /api/dashboard/overview
GET    /api/dashboard/realtime

GET    /api/reports/deliveries    (?from=&to=&export=csv|pdf)
GET    /api/reports/drivers       (?export=csv|pdf)
GET    /api/reports/performance   (?export=csv|pdf)

GET    /api/notifications         (?unread=true)
PUT    /api/notifications/:id     (marks read)
POST   /api/notifications/mark_all_read

GET    /api/orders/:id/timeline   (audit trail: created, driver assigned, status changes)
POST   /api/orders/:id/proof_of_delivery   (multipart file upload)

POST   /api/drivers/:id/documents                (multipart file upload)
DELETE /api/drivers/:id/documents/:document_id
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

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. **Lint** — Rubocop.
2. **Test** — RSpec against real Postgres (PostGIS) and Redis service containers.
3. **Build** — frontend and mobile typecheck, frontend production build.
4. **Docker publish** *(main only)* — builds `backend/Dockerfile.production` and
   pushes it to GHCR, tagged `latest` and by commit SHA.
5. **Deploy** *(main only)* — placeholder step; no hosting target is configured yet.
   Wire it to whatever you provision (Railway/Render/AWS/Fly) via repository secrets.

The production Dockerfile builds and runs independently of `docker-compose.yml`
(which is dev-only): `docker build -f backend/Dockerfile.production backend`.

## What's left for 100% usability

The 10-sprint MVP roadmap from the spec is done (auth, users, customers, drivers,
vehicles, orders, live tracking, dashboard, reports, 99%+ test coverage, CI). A full
re-read of the spec against the codebase found these remaining gaps:

### Driver app screens that are still placeholders

- [ ] Available Deliveries (browsing/accepting new deliveries)
- [ ] Navigation
- [ ] Delivery Confirmation (proof of delivery capture)
- [ ] History

### Spec features no sprint ever built

- [ ] Scheduled jobs — `DeliveryDelayJob` (flags orders past `estimated_delivery_at`)
      and `CleanupLogsJob` (prunes old read notifications) exist and are tested, but
      nothing triggers them on a recurring schedule yet (no `sidekiq-cron` wiring)
- [ ] Invoice attachments (Section 16 also lists these alongside proof of delivery
      and driver documents, both of which are now built); Active Storage runs on the
      local Disk service in dev — swapping to S3/MinIO for production is a
      `storage.yml`-only config change, not yet made
- [ ] Active Storage variant/thumbnail generation for uploaded images — files
      are stored and served as-is, no resizing
- [ ] OpenAPI/Swagger documentation for the API (Section 29)
- [ ] ETA on the tracking map (Section 13) — only straight-line distance is shown today,
      not a time estimate
- [ ] A real "driver accepts an offered delivery" workflow — today a dispatcher always
      assigns `driver_id` directly; there's no pool of unassigned orders a driver browses
      and claims themselves (User Story: Driver "Accept delivery")
- [ ] Customer Activity and Monthly rollup reports (Section 19 lists both; only a daily
      deliveries report exists)

### Infrastructure

- [ ] A real deploy target — the CI/CD `deploy` job is an explicit placeholder;
      nothing is actually hosted anywhere yet
- [ ] Production secrets management (`RAILS_MASTER_KEY`, DB credentials, etc. are
      dev-only right now)

**Beyond the MVP** (spec Section 26, lower priority than the above) — AI route
optimization, fraud detection, predictive ETA, delivery clustering, heat maps,
multi-tenant support, billing/subscriptions.
