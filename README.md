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
- **Customers** — full CRUD (`/api/customers`) with search and pagination, restricted by
  role (admin manages, dispatcher has read access). Backed by a dashboard page with a
  searchable, paginated table and create/edit/delete forms.
- **Vehicles** — full CRUD (`/api/vehicles`) with search and pagination, same admin/
  dispatcher access split, dashboard page to match.
- **Drivers** — full CRUD (`/api/drivers`); creating a driver also creates its underlying
  user account (role `driver`) atomically. Drivers can see and manage their own record;
  admin/dispatcher see all. Dashboard page assigns a vehicle and status per driver.
- **Orders** — `/api/orders` with nested pickup/delivery addresses and line items created
  in one request, a validated status flow (pending → assigned → picked_up → in_transit →
  near_destination → delivered, with cancelled/failed as terminal off-ramps — invalid
  transitions are rejected), and role-scoped access: admin/dispatcher manage everything,
  drivers see and progress only their assigned orders, customer-role users can create
  orders. Dashboard page filters by status, assigns drivers, and drives status transitions.
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

### API endpoints

```text
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/me

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
