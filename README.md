# RideSync+ Backend

> **Intelligent Multi-Platform Ride-Hailing Comparison and Optimization System**
>
> BSc Information Technology — Final Year Project 2025/2026
> Department of Computer Science
> Student: Christabel Araba Edumadze | Supervisor: Mr. Julius Y. Ludu

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

RideSync+ is a RESTful backend service that aggregates ride data from **Uber**, **Bolt**, and **Yango** into a unified comparison interface. It provides:

- **Real-time ride comparison** — fare, ETA, driver rating, ride category
- **Intelligent ranking** — multi-criteria weighted scoring (cost / time / rating)
- **Surge detection** — detects and warns users of elevated pricing
- **Predictive analytics** — ML-based surge probability forecast for the next 24 hours
- **Deep-link redirection** — seamlessly opens the selected platform's native app
- **JWT authentication** — secure register / login / token refresh

> **Note on API access:** Uber, Bolt, and Yango do not offer public pricing APIs. This system uses a **realistic simulation layer** (distance-based GHS pricing with time-of-day demand multipliers calibrated for Accra) that is architecturally identical to a real integration — swapping in real API calls requires only changing the adapter bodies.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Flutter Mobile App                        │
│                    (iOS / Android / Web client)                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS / REST
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FastAPI Application                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  /auth   │  │  /users  │  │  /rides  │  │   /analytics    │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────┘  │
│                        API v1 Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Service Layer (Business Logic)                 │  │
│  │  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │ RideComparison │  │Recommendation│  │  SurgeDetector  │  │  │
│  │  │    Service     │  │   Engine     │  │                 │  │  │
│  │  └────────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │              Platform Adapter Layer                    │  │  │
│  │  │   UberAdapter │ BoltAdapter │ YangoAdapter             │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────────────────┬────────────────┘
           │                                      │
           ▼                                      ▼
┌──────────────────────┐              ┌───────────────────────────┐
│  PostgreSQL Database  │              │     Redis Cache           │
│  - users             │              │  - ride data (TTL 30s)    │
│  - ride_comparisons  │              │  - session state          │
│  - ride_options      │              └───────────────────────────┘
│  - surge_events      │
│  - surge_predictions │              ┌───────────────────────────┐
└──────────────────────┘              │   Celery Worker + Beat    │
                                      │  - retrain_surge_model    │
                                      │    every 6 hours          │
                                      └───────────────────────────┘
```

### Request lifecycle (`POST /api/v1/rides/compare`)

```
Client Request
     │
     ▼
[1] Auth middleware validates JWT (optional for compare)
     │
     ▼
[2] Redis cache check (keyed by route + platforms + sort_by, TTL=30s)
     │ cache miss
     ▼
[3] Async fan-out to platform adapters (asyncio.gather)
     │  UberAdapter ──┐
     │  BoltAdapter ──┼──► List[RideOptionDTO]
     │  YangoAdapter ─┘
     ▼
[4] Surge detection (multiplier ≥ 1.3 threshold)
     │
     ▼
[5] Recommendation engine (weighted multi-criteria ranking)
     │
     ▼
[6] Persist RideComparison + RideOptions to PostgreSQL
     │
     ▼
[7] Cache response in Redis
     │
     ▼
[8] Return RideComparisonResponse to client
```

---

## 3. Technology Stack

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| Language | Python | 3.12 | Industry standard for backend + ML |
| Web Framework | FastAPI | 0.111 | Async, auto OpenAPI docs, high performance |
| ORM | SQLAlchemy | 2.0 | Async-native, type-safe, industry standard |
| Migrations | Alembic | 1.13 | Version-controlled schema evolution |
| Database | PostgreSQL | 16 | Production-grade relational DB |
| Cache | Redis | 7 | In-memory cache for ride data |
| Task Queue | Celery | 5.4 | Background tasks + periodic scheduler |
| Auth | python-jose + passlib | — | JWT tokens + bcrypt password hashing |
| ML | scikit-learn + pandas | — | RandomForest surge prediction |
| Testing | pytest + httpx | — | Async integration and unit tests |
| Containerisation | Docker + Compose | — | Reproducible deployment |

---

## 4. Project Structure

```
ridesync-backend/
├── app/
│   ├── api/
│   │   ├── deps.py                    # Auth dependencies (get_current_user)
│   │   └── v1/
│   │       ├── router.py              # Aggregates all v1 routers
│   │       └── endpoints/
│   │           ├── auth.py            # POST /auth/register|login|refresh
│   │           ├── users.py           # GET|PATCH|DELETE /users/me
│   │           ├── rides.py           # POST /rides/compare, GET /rides/history
│   │           └── analytics.py      # GET /analytics/surge-predictions|summary
│   ├── core/
│   │   ├── config.py                  # Pydantic settings (env vars)
│   │   ├── security.py                # JWT creation/verification, bcrypt
│   │   └── logging.py                 # Structured JSON logging (structlog)
│   ├── db/
│   │   ├── base_class.py              # SQLAlchemy DeclarativeBase
│   │   ├── session.py                 # Async engine + session factory
│   │   └── redis_client.py            # Redis connection pool
│   ├── models/
│   │   ├── user.py                    # User ORM model
│   │   ├── ride.py                    # RideComparison + RideOption ORM models
│   │   └── surge.py                   # SurgeEvent + SurgePrediction ORM models
│   ├── schemas/
│   │   ├── user.py                    # Pydantic user schemas
│   │   ├── token.py                   # Pydantic token schemas
│   │   └── ride.py                    # Pydantic ride + analytics schemas
│   ├── services/
│   │   ├── platform_adapters.py       # Uber/Bolt/Yango adapter layer
│   │   ├── ride_comparison_service.py # Main orchestration service
│   │   ├── recommendation_engine.py   # Multi-criteria ranking algorithm
│   │   ├── surge_detector.py          # Surge detection + persistence
│   │   └── analytics_service.py       # ML model + history analytics
│   ├── utils/
│   │   └── exception_handlers.py      # Global FastAPI error handlers
│   ├── worker/
│   │   ├── celery_app.py              # Celery instance + beat schedule
│   │   └── tasks.py                   # Background task definitions
│   └── main.py                        # FastAPI app factory + lifespan
├── alembic/
│   ├── env.py                         # Async Alembic migration environment
│   └── versions/                      # Auto-generated migration files
├── tests/
│   ├── conftest.py                    # Shared fixtures (in-memory SQLite)
│   ├── unit/
│   │   ├── test_recommendation_engine.py
│   │   └── test_surge_detector.py
│   └── integration/
│       ├── test_auth.py
│       ├── test_users.py
│       ├── test_rides.py
│       ├── test_analytics.py
│       └── test_health.py
├── scripts/
│   └── seed_db.py                     # Dev database seeder
├── .env.example                       # Environment variable template
├── alembic.ini                        # Alembic configuration
├── docker-compose.yml                 # Full local stack
├── Dockerfile                         # Multi-stage production image
├── pytest.ini                         # Test configuration
└── requirements.txt                   # Python dependencies
```

---

## 5. Getting Started

### Prerequisites

- Python 3.12+
- Docker & Docker Compose
- Git

### Option A — Docker (Recommended)

The fastest way to run the full stack including PostgreSQL, Redis, Celery worker and the API:

```bash
# 1. Clone the repository
git clone <repo-url>
cd ridesync-backend

# 2. Create your environment file
cp .env.example .env
# Edit .env and set a strong SECRET_KEY:
# openssl rand -hex 32

# 3. Start all services
docker compose up --build

# 4. (Optional) Seed the database with demo data
docker compose exec api python scripts/seed_db.py
```

The API will be available at:
- **API:**        http://localhost:8000
- **Swagger UI:** http://localhost:8000/api/v1/docs
- **ReDoc:**      http://localhost:8000/api/v1/redoc
- **Health:**     http://localhost:8000/health

### Option B — Local Development

```bash
# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables
cp .env.example .env
# Configure POSTGRES_* and REDIS_* settings to point to your local instances

# 4. Start PostgreSQL and Redis (if not using Docker)
# Ensure both are running locally on their default ports

# 5. Run database migrations
alembic upgrade head

# 6. (Optional) Seed demo data
python scripts/seed_db.py

# 7. Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 8. (Optional) Start the Celery worker in a separate terminal
celery -A app.worker.celery_app worker --loglevel=info
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (required) | JWT signing key — generate with `openssl rand -hex 32` |
| `POSTGRES_SERVER` | localhost | PostgreSQL host |
| `POSTGRES_USER` | ridesync | Database username |
| `POSTGRES_PASSWORD` | ridesync_dev_password | Database password |
| `POSTGRES_DB` | ridesync_db | Database name |
| `REDIS_HOST` | localhost | Redis host |
| `SURGE_THRESHOLD_MULTIPLIER` | 1.3 | Multiplier above which surge is declared |
| `RIDE_CACHE_TTL_SECONDS` | 30 | Seconds to cache ride comparison results |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | 7 | JWT refresh token lifetime |

---

## 6. API Reference

Full interactive documentation is available at `/api/v1/docs` (Swagger UI) and `/api/v1/redoc`.

### Authentication

All protected endpoints require a Bearer token:
```
Authorization: Bearer <access_token>
```

### Endpoints Summary

#### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | None | Create a new user account |
| `POST` | `/api/v1/auth/login` | None | Login, returns access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | None | Refresh an expired access token |

#### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/v1/users/me` | Required | Get current user profile |
| `PATCH` | `/api/v1/users/me` | Required | Update profile / password |
| `DELETE` | `/api/v1/users/me` | Required | Deactivate account |

#### Rides
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/rides/compare` | Optional | Compare rides across platforms |
| `GET`  | `/api/v1/rides/history` | Required | Paginated comparison history |
| `GET`  | `/api/v1/rides/history/{id}` | Required | Get a specific comparison |

#### Analytics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/analytics/surge-predictions` | None | Next 24h surge forecast |
| `GET` | `/api/v1/analytics/summary` | Required | User history analytics summary |

### Example: Compare Rides

**Request:**
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

**Response:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "origin_address": "Kotoka International Airport, Accra",
  "destination_address": "Accra Mall, Spintex Road",
  "is_surge_detected": false,
  "created_at": "2026-01-15T10:30:00Z",
  "surge_warning": null,
  "recommendation": {
    "platform": "yango",
    "ride_category": "Yango",
    "fare_estimate_ghs": 12.40,
    "eta_minutes": 6,
    "driver_rating": 4.3,
    "deep_link_url": "yango://order?startLat=5.6052&endLat=5.6360",
    "is_surge": false
  },
  "ride_options": [
    {
      "platform": "yango",
      "ride_category": "Yango",
      "fare_estimate_ghs": 12.40,
      "fare_min_ghs": 11.28,
      "fare_max_ghs": 13.76,
      "eta_minutes": 6,
      "driver_rating": 4.3,
      "drivers_nearby": 4,
      "is_surge": false,
      "surge_multiplier": 1.0,
      "deep_link_url": "yango://order?startLat=5.6052&endLat=5.6360"
    }
    // ... more options
  ]
}
```

---

## 7. Core Modules

### Platform Adapter Layer (`app/services/platform_adapters.py`)

Implements the **Adapter design pattern**. Each platform (Uber, Bolt, Yango) has a concrete adapter class inheriting from `AbstractPlatformAdapter`. The interface ensures that swapping simulated data for real API calls is a drop-in operation.

**Simulation methodology:**
- Fares use real Accra GHS market rates (GHS 2.80–3.50/km base depending on platform)
- Time-of-day demand multipliers model Accra rush hours (07:00–09:00, 17:00–20:00)
- Route seeds ensure deterministic results within a 30-second window
- Deep-link URLs use official URI schemes for each platform

### Recommendation Engine (`app/services/recommendation_engine.py`)

Uses **weighted multi-criteria decision analysis (MCDA)**:

1. Normalise fare, ETA, and rating to [0, 1] using min-max scaling
2. Apply weight profile based on `sort_by` preference:
   - `cost`   → fare: 70%, ETA: 20%, rating: 10%
   - `time`   → fare: 15%, ETA: 70%, rating: 15%
   - `rating` → fare: 15%, ETA: 15%, rating: 70%
3. Compute composite score (lower = better)
4. Return sorted list + top recommendation

### Surge Detector (`app/services/surge_detector.py`)

Compares the time-of-day demand multiplier against the configurable `SURGE_THRESHOLD_MULTIPLIER` (default: 1.3 = 30% above baseline). Generates human-readable warnings and persists surge events to PostgreSQL for ML training.

### Analytics Service (`app/services/analytics_service.py`)

**ML Model:** `RandomForestClassifier` (scikit-learn)
- Features: `hour_of_day`, `day_of_week`, `is_weekend`
- Target: binary surge classification
- Training data: `SurgeEvent` table (minimum 50 records required)
- Fallback: rule-based Accra rush-hour probability table

**Periodic retraining:** Celery Beat task fires every 6 hours to incorporate new surge events.

---

## 8. Database Schema

```
users
  id                UUID PRIMARY KEY
  email             VARCHAR(255) UNIQUE NOT NULL
  full_name         VARCHAR(255) NOT NULL
  hashed_password   VARCHAR(255) NOT NULL
  is_active         BOOLEAN DEFAULT TRUE
  is_verified       BOOLEAN DEFAULT FALSE
  preferred_sort    VARCHAR(20) DEFAULT 'cost'
  created_at        TIMESTAMPTZ
  updated_at        TIMESTAMPTZ
  last_login_at     TIMESTAMPTZ

ride_comparisons
  id                UUID PRIMARY KEY
  user_id           UUID FK → users.id (nullable)
  origin_address    VARCHAR(500)
  origin_lat        FLOAT
  origin_lng        FLOAT
  destination_address VARCHAR(500)
  destination_lat   FLOAT
  destination_lng   FLOAT
  is_surge_detected BOOLEAN
  created_at        TIMESTAMPTZ

ride_options
  id                UUID PRIMARY KEY
  comparison_id     UUID FK → ride_comparisons.id CASCADE DELETE
  platform          VARCHAR(50)   -- uber | bolt | yango
  ride_category     VARCHAR(100)
  fare_estimate_ghs FLOAT
  fare_min_ghs      FLOAT
  fare_max_ghs      FLOAT
  eta_minutes       INTEGER
  driver_rating     FLOAT
  drivers_nearby    INTEGER
  is_surge          BOOLEAN
  surge_multiplier  FLOAT
  deep_link_url     TEXT
  fetched_at        TIMESTAMPTZ

surge_events
  id                UUID PRIMARY KEY
  platform          VARCHAR(50) INDEX
  hour_of_day       INTEGER
  day_of_week       INTEGER
  surge_multiplier  FLOAT
  is_weekend        BOOLEAN
  recorded_at       TIMESTAMPTZ INDEX

surge_predictions
  id                UUID PRIMARY KEY
  platform          VARCHAR(50) INDEX
  predicted_hour    INTEGER
  predicted_day_of_week INTEGER
  surge_probability FLOAT
  predicted_at      TIMESTAMPTZ
```

---

## 9. Running Tests

```bash
# Install test dependencies (already in requirements.txt)
pip install -r requirements.txt

# Run the full test suite
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run only unit tests (no DB required)
pytest tests/unit/

# Run only integration tests
pytest tests/integration/

# Run a specific test file
pytest tests/integration/test_rides.py -v

# Run a specific test
pytest tests/unit/test_recommendation_engine.py::TestRankByCost::test_cheapest_is_top_recommendation -v
```

Tests use an **in-memory SQLite** database and **mocked Redis** for complete isolation — no external services required.

**Test coverage includes:**
- Unit: recommendation engine (8 tests), surge detector (5 tests)
- Integration: auth (8 tests), users (6 tests), rides (12 tests), analytics (7 tests), health (3 tests)
- **Total: 49 tests**

---

## 10. Deployment

### Cloud Deployment (Render / Railway / Fly.io)

The project is deployment-ready. For any cloud provider:

1. Set all environment variables from `.env.example` in the platform dashboard
2. Set `APP_ENV=production` and `DEBUG=false`
3. Generate a strong `SECRET_KEY`: `openssl rand -hex 32`
4. Provision a managed PostgreSQL database and Redis instance
5. Build command: `pip install -r requirements.txt`
6. Start command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Production Checklist

- [ ] `SECRET_KEY` is a random 32-byte hex string (never use the default)
- [ ] `APP_ENV=production` and `DEBUG=false`
- [ ] `BACKEND_CORS_ORIGINS` lists only your Flutter app's origin
- [ ] PostgreSQL and Redis are on private networks (not publicly exposed)
- [ ] HTTPS/TLS is terminated at the load balancer or reverse proxy
- [ ] Run `alembic upgrade head` before each deployment

---

## 11. Design Decisions

### Why FastAPI over Django REST Framework?
FastAPI's native async support is essential for the concurrent platform adapter fan-out pattern (fetching from 3 platforms simultaneously). It also provides automatic OpenAPI documentation which is valuable for both the Flutter developer and academic evaluation.

### Why the Adapter Pattern for platforms?
The `AbstractPlatformAdapter` interface isolates the rest of the system from platform-specific concerns. When real API access becomes available, only the adapter body changes — zero impact on the service layer, schemas, or tests.

### Why PostgreSQL instead of a NoSQL database?
Ride comparison data is inherently relational (User → Comparisons → Options). PostgreSQL's ACID guarantees protect against data inconsistency, and its JSON support provides flexibility if needed.

### Why Redis caching with a 30-second TTL?
Ride fares fluctuate by the minute, but 30 seconds is short enough that prices remain accurate while eliminating redundant adapter calls for users querying the same route simultaneously (common at airports and malls).

### Why RandomForest over a deep learning model?
With the dataset size expected during a student FYP (hundreds to low thousands of records), a RandomForestClassifier outperforms deep learning models which require significantly more data to generalise. It also provides feature importance scores which are valuable for academic analysis and reporting.

---

*RideSync+ Backend — BSc IT Final Year Project | University of Ghana | 2025/2026*
