# RideSync+ Backend

> **Intelligent Multi-Platform Ride-Hailing Comparison and Optimization System**
>
> BSc Information Technology — Final Year Project 2025/2026
> Department of Computer Science
> **Student:** Christabel Araba Edumadze | **Supervisor:** Mr. Julius Y. Ludu

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Getting Started](#5-getting-started)
6. [API Reference](#6-api-reference)
7. [Core Modules](#7-core-modules)
8. [Database Schema](#8-database-schema)
9. [Running Tests](#9-running-tests)
10. [Deployment](#10-deployment)
11. [Design Decisions](#11-design-decisions)

---

## 1. Project Overview

RideSync+ is a production-grade RESTful backend service that aggregates ride data from **Uber**, **Bolt**, **Yango**, and **Shaxi** into a unified comparison interface for Ghana. It provides:

- **Real-time ride comparison** — fare estimates, ETA, driver rating, ride category
- **Google Maps integration** — real road distance and drive time via Distance Matrix API; place autocomplete via Places API; address resolution via Geocoding API
- **Intelligent ranking** — multi-criteria weighted scoring (cost / time / rating) using MCDA
- **Surge detection** — detects elevated pricing and issues human-readable warnings
- **Predictive analytics** — RandomForest ML model forecasting surge probability for the next 24 hours, auto-retrained every 6 hours
- **Live price streaming** — WebSocket endpoint pushes updated prices every 30 seconds
- **Push notifications** — Firebase Cloud Messaging (FCM) surge alerts sent directly to the user's mobile device
- **Deep-link redirection** — seamlessly opens the selected platform's native app
- **JWT authentication** — secure register / login / token refresh
- **Rate limiting** — per-IP and per-user request throttling via slowapi
- **Mobile API key auth** — `X-API-Key` header validates the Flutter client identity

> **Note on platform APIs:** Uber, Bolt, Yango, and Shaxi do not offer public pricing APIs.
> This system uses a **realistic simulation layer** — distance-based GHS pricing with
> time-of-day demand multipliers calibrated to real Accra market rates, using actual
> Google road distances. The Adapter pattern means swapping in real platform API calls
> requires changing only the adapter body — zero impact on the rest of the system.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      Flutter Mobile App                              │
│               (iOS / Android / Web — REST + WebSocket)               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTPS / WSS
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        FastAPI Application                           │
│                                                                      │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐  │
│  │  /auth  │ │ /users  │ │  /rides  │ │/locations │ │/analytics │  │
│  └─────────┘ └─────────┘ └──────────┘ └───────────┘ └───────────┘  │
│                        ┌──────────────┐                             │
│                        │  /ws/rides   │  ← WebSocket live prices    │
│                        └──────────────┘                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Service Layer                              │  │
│  │  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────┐  │  │
│  │  │ RideComparison   │  │ Recommendation  │  │   Surge     │  │  │
│  │  │    Service       │  │    Engine       │  │  Detector   │  │  │
│  │  └──────────────────┘  └─────────────────┘  └─────────────┘  │  │
│  │  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────┐  │  │
│  │  │  Google Maps     │  │   Analytics     │  │  FCM Push   │  │  │
│  │  │  Service         │  │   Service       │  │  Notifs     │  │  │
│  │  └──────────────────┘  └─────────────────┘  └─────────────┘  │  │
│  │  ┌───────────────────────────────────────────────────────┐   │  │
│  │  │               Platform Adapter Layer                  │   │  │
│  │  │  UberAdapter │ BoltAdapter │ YangoAdapter │ ShaxiAdapter│  │  │
│  │  └───────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└───────────────┬──────────────────────────────────┬──────────────────┘
                │                                  │
                ▼                                  ▼
┌───────────────────────────┐      ┌───────────────────────────────┐
│    PostgreSQL Database    │      │         Redis Cache           │
│  - users (+ fcm_token)    │      │  - ride data (TTL 30s)        │
│  - ride_comparisons       │      │  - geocode results (24h)      │
│  - ride_options           │      │  - distance matrix (2min)     │
│  - surge_events           │      │  - autocomplete (5min)        │
│  - surge_predictions      │      └───────────────────────────────┘
└───────────────────────────┘
                                   ┌───────────────────────────────┐
                                   │  Celery Worker + Beat         │
                                   │  (auto-started by FastAPI)    │
                                   │  - retrain_surge_model / 6h   │
                                   │  - scan_active_surges / 5min  │
                                   └───────────────────────────────┘
                                   ┌───────────────────────────────┐
                                   │  Google Maps Platform         │
                                   │  - Geocoding API              │
                                   │  - Places Autocomplete API    │
                                   │  - Distance Matrix API        │
                                   └───────────────────────────────┘
                                   ┌───────────────────────────────┐
                                   │  Firebase Cloud Messaging     │
                                   │  - Surge alerts → device      │
                                   │  - Ride updates → device      │
                                   └───────────────────────────────┘
```

### Request lifecycle — `POST /api/v1/rides/compare`

```
Client Request
     │
     ▼
[1]  X-API-Key middleware validates mobile app identity
     │
     ▼
[2]  JWT auth (optional — anonymous requests allowed)
     │
     ▼
[3]  Redis cache check (keyed by route + platforms + sort_by, TTL=30s)
     │ cache miss
     ▼
[4]  Google Distance Matrix API → real road distance (km) + drive time (min)
     │
     ▼
[5]  Async fan-out to platform adapters (asyncio.gather)
     │  UberAdapter  ──┐
     │  BoltAdapter  ──┼──► List[RideOptionDTO]  (fare = base + km×rate + min×rate × demand)
     │  YangoAdapter ──┤
     │  ShaxiAdapter ──┘
     ▼
[6]  Surge detection  (multiplier ≥ SURGE_THRESHOLD_MULTIPLIER)
     │  if surge + user has FCM token → fire push notification (non-blocking)
     ▼
[7]  Recommendation engine  (weighted MCDA ranking)
     │
     ▼
[8]  Persist RideComparison + RideOptions + SurgeEvents to PostgreSQL
     │
     ▼
[9]  Cache response in Redis (TTL=30s)
     │
     ▼
[10] Return RideComparisonResponse to client
```

### Automatic background tasks (no manual intervention needed)

```
uvicorn app.main:app
        │
        ├── Starts Celery Worker thread  (daemon)
        │         │
        │         └── executes tasks queued by Beat
        │
        └── Starts Celery Beat thread   (daemon)
                  │
                  ├── every 6 hours  → retrain_surge_model_task
                  │                    Loads SurgeEvents → trains RandomForest
                  │                    → saves model → updates in-memory cache
                  │
                  └── every 5 mins  → scan_active_surges_task
                                       Finds recent surge comparisons
                                       → sends FCM alerts to affected users
```

---

## 3. Technology Stack

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Language | Python | 3.12 | Industry standard for backend + ML |
| Web Framework | FastAPI | 0.111 | Async, auto OpenAPI docs, high performance |
| ORM | SQLAlchemy | 2.0 | Async-native, type-safe, industry standard |
| Migrations | Alembic | 1.13 | Version-controlled schema evolution |
| Database | PostgreSQL | 16 | Production-grade relational DB with ACID guarantees |
| Cache | Redis | 7 | In-memory cache — ride data, geocoding, distance results |
| Task Queue | Celery | 5.4 | Background tasks + periodic Beat scheduler |
| Auth | python-jose + passlib | — | JWT tokens (HS256) + bcrypt password hashing |
| Location | Google Maps Platform | — | Geocoding, Places Autocomplete, Distance Matrix |
| Push Notifications | Firebase Admin SDK | 6.5 | FCM surge alerts to Flutter app |
| WebSocket | FastAPI WebSocket | — | Live price streaming per comparison session |
| Rate Limiting | slowapi | 0.1.9 | Per-IP and per-user throttling |
| ML | scikit-learn + pandas | — | RandomForest binary surge classifier |
| Testing | pytest + httpx | — | Async integration and unit tests (in-memory SQLite) |
| Containerisation | Docker + Compose | — | Reproducible local + production deployment |

---

## 4. Project Structure

```
ridesync-backend/
├── app/
│   ├── api/
│   │   ├── deps.py                        # Auth dependencies (get_current_user, get_optional_user)
│   │   └── v1/
│   │       ├── router.py                  # Aggregates all v1 routers
│   │       └── endpoints/
│   │           ├── auth.py                # POST /auth/register|login|refresh
│   │           ├── users.py               # GET|PATCH|DELETE /users/me, POST /users/me/fcm-token
│   │           ├── rides.py               # POST /rides/compare, GET /rides/history
│   │           ├── locations.py           # GET /locations/autocomplete|geocode|place/{id}
│   │           ├── analytics.py           # GET /analytics/surge-predictions|fare-trends|summary
│   │           └── ws.py                  # WS /ws/rides/{comparison_id}
│   ├── core/
│   │   ├── config.py                      # Pydantic settings (all env vars)
│   │   ├── security.py                    # JWT + bcrypt (bcrypt 4.x compatibility patch)
│   │   └── logging.py                     # Structured logging via structlog
│   ├── db/
│   │   ├── base_class.py                  # SQLAlchemy DeclarativeBase
│   │   ├── session.py                     # Async engine + session factory (asyncpg)
│   │   ├── sync_session.py                # Sync engine for Celery tasks (psycopg2)
│   │   └── redis_client.py                # Redis connection pool
│   ├── models/
│   │   ├── user.py                        # User ORM model (incl. fcm_token)
│   │   ├── ride.py                        # RideComparison + RideOption (incl. road metrics)
│   │   └── surge.py                       # SurgeEvent + SurgePrediction
│   ├── schemas/
│   │   ├── user.py                        # Pydantic user schemas
│   │   ├── token.py                       # JWT token schemas
│   │   └── ride.py                        # Ride, location, analytics schemas
│   ├── services/
│   │   ├── google_maps.py                 # Geocoding, Autocomplete, Distance Matrix + Redis cache
│   │   ├── platform_adapters.py           # Uber/Bolt/Yango/Shaxi adapters (Google road distance)
│   │   ├── ride_comparison_service.py     # Main orchestrator (cache→adapters→surge→rank→DB)
│   │   ├── recommendation_engine.py       # Weighted MCDA ranking algorithm
│   │   ├── surge_detector.py              # Surge detection + SurgeEvent persistence
│   │   ├── analytics_service.py           # ML model + fare trends + history summary
│   │   ├── notifications.py               # Firebase FCM push notifications
│   │   └── websocket_manager.py           # WS connection pool + live price diffing
│   ├── utils/
│   │   ├── exception_handlers.py          # Global FastAPI error handlers
│   │   └── api_key_middleware.py          # X-API-Key header validation
│   ├── worker/
│   │   ├── celery_app.py                  # Celery instance + Beat schedule
│   │   └── tasks.py                       # retrain_surge_model, scan_active_surges
│   └── main.py                            # App factory + lifespan (auto-starts Worker + Beat)
├── alembic/
│   ├── env.py                             # Async Alembic migration environment
│   ├── script.py.mako                     # Migration file template
│   └── versions/
│       ├── e65fc3249643_initial_schema.py # Tables: users, ride_comparisons, ride_options,
│       │                                  #         surge_events, surge_predictions
│       └── a2b3c4d5e6f7_advanced_features.py  # Adds: fcm_token, route_distance_km/min,
│                                              #        road_distance_km/min
├── tests/
│   ├── conftest.py                        # Shared fixtures (in-memory SQLite + mocked Redis)
│   ├── unit/
│   │   ├── test_recommendation_engine.py  # 8 tests — MCDA ranking algorithm
│   │   └── test_surge_detector.py         # 5 tests — surge detection logic
│   └── integration/
│       ├── test_auth.py                   # 8 tests — register, login, refresh
│       ├── test_users.py                  # 6 tests — profile CRUD, password change
│       ├── test_rides.py                  # 12 tests — compare, history, pagination
│       ├── test_analytics.py              # 7 tests — predictions, summary, trends
│       └── test_health.py                 # 3 tests — health, OpenAPI schema
├── scripts/
│   └── seed_db.py                         # Populates demo users, comparisons, 200 surge events
├── .env.example                           # All environment variables documented
├── alembic.ini                            # Alembic configuration
├── docker-compose.yml                     # Full local stack (Postgres + Redis + API + Worker + Beat)
├── Dockerfile                             # Multi-stage production image (builder + runtime)
├── pytest.ini                             # Test configuration
└── requirements.txt                       # All Python dependencies
```

---

## 5. Getting Started

### Prerequisites

- Python 3.12+
- PostgreSQL 15+
- Redis 7+
- A Google Cloud account with a Maps API key
- (Optional) A Firebase project for push notifications

### Option A — Docker (Recommended)

```bash
# 1. Clone the repository
git clone <repo-url>
cd ridesync-backend

# 2. Create your environment file
cp .env.example .env

# 3. Set required keys in .env
#    SECRET_KEY=$(openssl rand -hex 32)
#    GOOGLE_MAPS_API_KEY=your-key-here

# 4. Start all services (API + PostgreSQL + Redis)
docker compose up --build

# 5. Seed the database with demo data
docker compose exec api python scripts/seed_db.py
```

API available at `http://localhost:8000` — Swagger UI at `http://localhost:8000/api/v1/docs`

### Option B — Local Development

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Set POSTGRES_*, REDIS_*, GOOGLE_MAPS_API_KEY, SECRET_KEY

# 4. Run database migrations
alembic upgrade head

# 5. Seed demo data (creates users + 200 surge events for ML training)
python scripts/seed_db.py

# 6. Start the server — Worker + Beat start automatically
uvicorn app.main:app --reload
```

On startup you will see:
```
Starting RideSync+ API
Redis connection established
Firebase Admin SDK initialised        ← (if configured)
Celery worker thread started
Celery Beat scheduler thread started
RideSync+ fully started — API + Worker + Beat all running
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | **(required)** | JWT signing key — `openssl rand -hex 32` |
| `GOOGLE_MAPS_API_KEY` | **(required)** | Enables Geocoding, Places, Distance Matrix |
| `FIREBASE_CREDENTIALS_PATH` | — | Path to Firebase service account JSON |
| `MOBILE_API_KEY` | dev-key | `X-API-Key` header value for Flutter app (skipped in development) |
| `POSTGRES_SERVER` | localhost | PostgreSQL host |
| `POSTGRES_USER` | ridesync | Database username |
| `POSTGRES_PASSWORD` | ridesync_dev_password | Database password |
| `POSTGRES_DB` | ridesync_db | Database name |
| `REDIS_HOST` | localhost | Redis host |
| `SURGE_THRESHOLD_MULTIPLIER` | 1.3 | Multiplier above which surge is declared |
| `RIDE_CACHE_TTL_SECONDS` | 30 | Seconds to cache ride comparison results |
| `WS_PRICE_REFRESH_SECONDS` | 30 | WebSocket price refresh interval |
| `RATE_LIMIT_COMPARE_ANONYMOUS` | 10/minute | Compare endpoint limit (no auth) |
| `RATE_LIMIT_COMPARE_AUTHENTICATED` | 30/minute | Compare endpoint limit (authenticated) |

### Google Maps API Setup (Free Tier)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable these three APIs:
   - **Geocoding API** (40,000 free requests/month)
   - **Places API** (autocomplete — $200 monthly credit covers ~11,000 requests)
   - **Distance Matrix API** (40,000 free elements/month)
3. Create an API key → restrict it to these 3 APIs and your server IP
4. Add to `.env`: `GOOGLE_MAPS_API_KEY=your-key`

### Firebase Setup (Free Tier)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → Project Settings → Service Accounts → **Generate new private key**
3. Save the JSON file as `firebase-service-account.json` in the project root
4. Add to `.env`: `FIREBASE_CREDENTIALS_PATH=firebase-service-account.json`

---

## 6. API Reference

Full interactive documentation at `/api/v1/docs` (Swagger UI) and `/api/v1/redoc`.

### Authentication

```
Authorization: Bearer <access_token>
X-API-Key: <MOBILE_API_KEY>          ← required in production, skipped in development
```

### Endpoints

#### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | None | Register a new user account |
| `POST` | `/api/v1/auth/login` | None | Login — returns access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | None | Refresh an expired access token |

#### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/v1/users/me` | Required | Get current user profile |
| `PATCH` | `/api/v1/users/me` | Required | Update profile / password / sort preference |
| `DELETE` | `/api/v1/users/me` | Required | Deactivate account |
| `POST` | `/api/v1/users/me/fcm-token` | Required | Register FCM device token for push notifications |

#### Rides
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/rides/compare` | Optional | Compare rides across all platforms |
| `GET`  | `/api/v1/rides/history` | Required | Paginated comparison history |
| `GET`  | `/api/v1/rides/history/{id}` | Required | Get a specific comparison |

#### Locations (Google Maps)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/locations/autocomplete?q=...` | None | Place suggestions as user types |
| `GET` | `/api/v1/locations/geocode?address=...` | None | Address → lat/lng |
| `GET` | `/api/v1/locations/place/{place_id}` | None | Place ID → coordinates |

#### Analytics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/analytics/surge-predictions` | None | Next 24h surge forecast per platform |
| `GET` | `/api/v1/analytics/fare-trends` | None | Daily average fares per platform (chart data) |
| `GET` | `/api/v1/analytics/summary` | Required | Personalised usage analytics |

#### WebSocket
| Protocol | Path | Description |
|----------|------|-------------|
| `WS` | `/api/v1/ws/rides/{comparison_id}?token=<jwt>` | Live price stream — pushes updates every 30s |
| `GET` | `/api/v1/ws/stats` | Active WebSocket connection counts |

### Example: Compare Rides

```bash
curl -X POST http://localhost:8000/api/v1/rides/compare \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "address": "Kotoka International Airport, Accra",
      "lat": 5.6052,
      "lng": -0.1668
    },
    "destination": {
      "address": "Accra Mall, Spintex Road",
      "lat": 5.6360,
      "lng": -0.1632
    },
    "sort_by": "cost"
  }'
```

**Response includes:**
- `route_distance_km` — real road distance from Google Distance Matrix
- `route_duration_min` — real estimated drive time
- `ride_options` — all options ranked by selected criteria
- `recommendation` — single best option
- `surge_warning` — human-readable surge alert if active

### Example: Place Autocomplete

```bash
curl "http://localhost:8000/api/v1/locations/autocomplete?q=kotoka"
```

### Example: WebSocket Connection (JavaScript)

```javascript
const ws = new WebSocket(
  `ws://localhost:8000/api/v1/ws/rides/${comparisonId}?token=${accessToken}`
);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'price_update')  updateUI(msg.data);
  if (msg.type === 'surge_alert')   showSurgeWarning(msg.data.message);
};

// Send ping to keep connection alive
setInterval(() => ws.send(JSON.stringify({ type: 'ping' })), 25000);
```

---

## 7. Core Modules

### Google Maps Service (`app/services/google_maps.py`)

Wraps three Google Maps Platform APIs with Redis caching:

| API | Cache TTL | Purpose |
|-----|-----------|---------|
| Geocoding | 24 hours | Text address → (lat, lng, place_id) |
| Places Autocomplete | 5 minutes | Partial query → ranked suggestions (Ghana-restricted) |
| Distance Matrix | 2 minutes | Origin + destination → real road km + drive minutes |

Falls back to Haversine straight-line distance if no API key is configured, so the system always works.

### Platform Adapter Layer (`app/services/platform_adapters.py`)

Implements the **Adapter design pattern**. Four concrete adapters inherit from `AbstractPlatformAdapter`:

**Pricing formula (per adapter):**
```
fare = (base_fare + road_km × rate_per_km + drive_min × rate_per_min)
       × comfort_factor
       × demand_multiplier
       × random_variance(0.95–1.05)
```

| Platform | Base (GHS) | Rate/km (GHS) | Rate/min (GHS) | Positioning |
|----------|-----------|--------------|----------------|-------------|
| Uber | 1.50 | 3.50 | 0.25 | Premium |
| Bolt | 1.20 | 3.00 | 0.20 | Mid-range |
| Yango | 1.00 | 2.80 | 0.18 | Budget |
| Shaxi | 0.90 | 2.50 | 0.15 | Local budget |

Demand multipliers are time-of-day based (Accra patterns):
- Morning rush 07:00–09:00 → 1.25×–1.65×
- Evening rush 17:00–20:00 → 1.25×–1.65×
- Late night 23:00–01:00 → 1.10×–1.40×
- Off-peak → 0.85×–1.10×

### Recommendation Engine (`app/services/recommendation_engine.py`)

**Weighted Multi-Criteria Decision Analysis (MCDA):**

1. Normalise fare, ETA, and driver rating to [0, 1] using min-max scaling
2. Apply weight profile based on `sort_by`:

| Criteria | Fare weight | ETA weight | Rating weight |
|----------|-------------|------------|---------------|
| `cost`   | 70% | 20% | 10% |
| `time`   | 15% | 70% | 15% |
| `rating` | 15% | 15% | 70% |

3. Composite score = weighted sum (lower = better)
4. Return fully ranked list + single top recommendation

### Surge Detector (`app/services/surge_detector.py`)

Declares surge when `demand_multiplier >= SURGE_THRESHOLD_MULTIPLIER` (default 1.3 = 30% above baseline). Generates a risk-labelled human-readable warning and persists `SurgeEvent` records to PostgreSQL for ML training.

### Analytics Service (`app/services/analytics_service.py`)

**ML Model:** `RandomForestClassifier` (scikit-learn)
- Features: `hour_of_day`, `day_of_week`, `is_weekend`
- Target: binary (`is_surge`)
- Minimum training samples: 50 `SurgeEvent` records
- Fallback: rule-based Accra rush-hour probability table (no training data needed)
- Auto-retrained every 6 hours by Celery Beat

**Fare trends:** Daily average fare per platform aggregated from `ride_options` — powers historical charts in the mobile app.

### WebSocket Manager (`app/services/websocket_manager.py`)

Maintains a connection pool keyed by `comparison_id`. On each refresh interval:
1. Re-fetches live prices from all platform adapters
2. Compares fares against the previous snapshot — sends `price_update` only if any fare changed by > 5%
3. Detects surge status change — sends `surge_alert` and fires FCM if status flipped to surging

### Push Notifications (`app/services/notifications.py`)

Firebase Admin SDK integration. Sends:
- `surge_alert` — triggered immediately when surge is detected during a comparison
- Periodic alerts — Celery Beat scans every 5 minutes for active surges and notifies affected users

---

## 8. Database Schema

```
users
  id                 UUID PRIMARY KEY
  email              VARCHAR(255) UNIQUE NOT NULL
  full_name          VARCHAR(255) NOT NULL
  hashed_password    VARCHAR(255) NOT NULL
  is_active          BOOLEAN DEFAULT TRUE
  is_verified        BOOLEAN DEFAULT FALSE
  preferred_sort     VARCHAR(20) DEFAULT 'cost'    -- cost | time | rating
  fcm_token          VARCHAR(500)                  -- Firebase device token
  created_at         TIMESTAMPTZ
  updated_at         TIMESTAMPTZ
  last_login_at      TIMESTAMPTZ

ride_comparisons
  id                 UUID PRIMARY KEY
  user_id            UUID FK → users.id (nullable — anonymous allowed)
  origin_address     VARCHAR(500)
  origin_lat         FLOAT
  origin_lng         FLOAT
  destination_address VARCHAR(500)
  destination_lat    FLOAT
  destination_lng    FLOAT
  route_distance_km  FLOAT      -- from Google Distance Matrix
  route_duration_min INTEGER    -- from Google Distance Matrix
  is_surge_detected  BOOLEAN
  created_at         TIMESTAMPTZ

ride_options
  id                 UUID PRIMARY KEY
  comparison_id      UUID FK → ride_comparisons.id CASCADE DELETE
  platform           VARCHAR(50)    -- uber | bolt | yango | shaxi
  ride_category      VARCHAR(100)   -- UberX, Bolt Comfort, Yango Plus, etc.
  fare_estimate_ghs  FLOAT
  fare_min_ghs       FLOAT
  fare_max_ghs       FLOAT
  eta_minutes        INTEGER
  driver_rating      FLOAT
  drivers_nearby     INTEGER
  is_surge           BOOLEAN
  surge_multiplier   FLOAT
  deep_link_url      TEXT
  road_distance_km   FLOAT
  road_duration_min  INTEGER
  fetched_at         TIMESTAMPTZ

surge_events                        -- training data for the ML model
  id                 UUID PRIMARY KEY
  platform           VARCHAR(50) INDEX
  hour_of_day        INTEGER
  day_of_week        INTEGER
  surge_multiplier   FLOAT
  is_weekend         BOOLEAN
  recorded_at        TIMESTAMPTZ INDEX

surge_predictions                   -- cached model inference results
  id                 UUID PRIMARY KEY
  platform           VARCHAR(50) INDEX
  predicted_hour     INTEGER
  predicted_day_of_week INTEGER
  surge_probability  FLOAT
  predicted_at       TIMESTAMPTZ
```

### Migrations

| Revision | Description |
|----------|-------------|
| `e65fc3249643` | Initial schema — all 5 tables |
| `a2b3c4d5e6f7` | Advanced features — `fcm_token`, road distance columns |

---

## 9. Running Tests

Tests use **in-memory SQLite** and **mocked Redis** — no external services required.

```bash
# Full test suite with coverage
pytest

# Coverage HTML report
pytest --cov=app --cov-report=html
open htmlcov/index.html

# Unit tests only (fastest — no DB)
pytest tests/unit/ -v

# Integration tests only
pytest tests/integration/ -v

# Specific test file
pytest tests/integration/test_rides.py -v

# Specific test
pytest tests/unit/test_recommendation_engine.py::TestRankByCost -v
```

**Test suite — 49 tests total:**

| Module | Tests | Coverage |
|--------|-------|----------|
| `test_recommendation_engine.py` | 8 | MCDA ranking, edge cases, identical fares |
| `test_surge_detector.py` | 5 | Detection, risk levels, empty input |
| `test_auth.py` | 8 | Register, login, refresh, validation |
| `test_users.py` | 6 | Profile CRUD, password change |
| `test_rides.py` | 12 | Compare, history, pagination, deep links |
| `test_analytics.py` | 7 | Predictions, summary, date ranges |
| `test_health.py` | 3 | Health check, OpenAPI schema |

---

## 10. Deployment

### Single command (development + production)

```bash
uvicorn app.main:app --reload
```

The FastAPI lifespan automatically starts the Celery worker and Beat scheduler as daemon threads — no separate processes needed.

### Cloud deployment (Render / Railway / Fly.io)

1. Set all environment variables from `.env.example` in the platform dashboard
2. Set `APP_ENV=production` and `DEBUG=false`
3. Provision managed PostgreSQL and Redis instances
4. Upload `firebase-service-account.json` as a secret file (or use `FIREBASE_CREDENTIALS_JSON` as base64)
5. Build command: `pip install -r requirements.txt`
6. Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Production checklist

- [ ] `SECRET_KEY` generated with `openssl rand -hex 32`
- [ ] `MOBILE_API_KEY` generated with `python -c "import secrets; print(secrets.token_hex(32))"`
- [ ] `APP_ENV=production` — enables `X-API-Key` enforcement
- [ ] `GOOGLE_MAPS_API_KEY` key restricted to server IP in Cloud Console
- [ ] Firebase credentials configured
- [ ] `BACKEND_CORS_ORIGINS` set to Flutter app origin only
- [ ] PostgreSQL and Redis on private networks
- [ ] HTTPS/TLS terminated at load balancer

---

## 11. Design Decisions

### Why FastAPI over Django REST Framework?
FastAPI's native async support is essential for the concurrent platform adapter fan-out pattern (fetching from 4 platforms simultaneously with `asyncio.gather`). It also provides automatic OpenAPI documentation — valuable for both the Flutter developer and academic evaluation.

### Why the Adapter Pattern for platforms?
The `AbstractPlatformAdapter` interface isolates all platform-specific logic. When real Uber/Bolt/Yango/Shaxi API access is granted, only the `fetch_rides()` method body changes per adapter — zero impact on the comparison service, recommendation engine, schemas, or tests.

### Why Google Distance Matrix instead of Haversine?
Haversine computes straight-line distance — useless for pricing since Accra roads are not straight. Google Distance Matrix returns real road distance and drive time accounting for the actual road network, which makes fares meaningfully more accurate. Results are cached in Redis for 2 minutes to minimise API quota usage.

### Why PostgreSQL instead of MongoDB?
Ride comparison data is inherently relational: User → RideComparisons → RideOptions. PostgreSQL's ACID guarantees protect against partial writes, and the relational model makes analytics queries (daily averages, surge frequency by platform) straightforward with standard SQL.

### Why Redis caching with a 30-second TTL?
Fares fluctuate by the minute, but 30 seconds is short enough to remain accurate while eliminating redundant adapter calls for simultaneous users querying the same route (common at Kotoka Airport, Accra Mall). Google API results are cached longer — geocoding for 24 hours (addresses don't move), distance for 2 minutes (traffic changes slowly).

### Why Celery runs inside the FastAPI process?
Starting Celery as daemon threads inside the FastAPI lifespan means the entire system starts with a single `uvicorn` command — no separate terminal, no process manager setup. This dramatically simplifies development and academic demonstration. In a production deployment with high task load, separating them into independent processes (as the Docker Compose file does) is straightforward.

### Why RandomForest over a neural network?
With hundreds to a few thousand training samples (typical for a student FYP), a `RandomForestClassifier` generalises better than a neural network which requires significantly more data. It also provides `feature_importances_` — showing that `hour_of_day` is the dominant predictor — which is academically valuable and directly explainable to a supervisor.

### Why two separate database sessions (async + sync)?
FastAPI uses asyncpg (async PostgreSQL driver) for high-concurrency API request handling. Celery workers run in forked processes where asyncpg's event loop state is invalid after the fork — using it causes `Future attached to a different loop` errors. The sync session uses psycopg2 exclusively within Celery tasks, keeping both codepaths stable.

---

*RideSync+ Backend — BSc IT Final Year Project | University of Ghana | 2025/2026*
