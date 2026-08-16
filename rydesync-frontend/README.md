# RideSync+ — Mobile Frontend

> **Intelligent Multi-Platform Ride-Hailing Comparison and Optimization System**
>
> BSc Information Technology — Final Year Project 2025/2026
> Department of Computer Science
> **Student:** Eselase-Noble | **Supervisor:** Mr. Julius Y. Ludu

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Configuration](#5-configuration)
6. [Screens & Navigation](#6-screens--navigation)
7. [Architecture](#7-architecture)
8. [Backend Integration](#8-backend-integration)

---

## 1. Project Overview

RideSync+ is a cross-platform mobile app (iOS / Android / Web) built with **Expo** and **React Native**. It connects to the [RideSync+ FastAPI backend](../rydesync-backend) to let users in Ghana compare fare estimates, ETAs, and driver ratings across **Uber**, **Bolt**, **Yango**, and **Shaxi** from a single interface.

**Key features:**

- Compare live ride options across four platforms simultaneously
- Intelligent ranking by cost, time, or driver rating
- Surge detection with human-readable alerts and push notifications
- Location autocomplete powered by Google Places API
- Interactive map view for pickup / drop-off routes
- Ride history and personalised analytics / fare trend charts
- Secure JWT authentication with silent token refresh
- Tokens stored in the device keychain via `expo-secure-store`

---

## 2. Technology Stack

| Concern | Technology | Version |
|---------|-----------|---------|
| Framework | Expo (managed workflow) | ~55 |
| UI Library | React Native | 0.83 |
| Language | JavaScript (ES2022) | — |
| Navigation | React Navigation (native stack) | ^7 |
| HTTP client | axios (via `httpClient.js`) | — |
| Secure storage | expo-secure-store | ~55 |
| Maps | react-native-maps | 1.27 |
| Location | expo-location | ~55 |
| Push notifications | expo-notifications | ~55 |
| Gradients | expo-linear-gradient | ~55 |
| Safe area | react-native-safe-area-context | ~5.6 |
| State management | React Context (`AuthContext`) | — |

---

## 3. Project Structure

```
rydesync-frontend/
├── App.js                     # 8-line shim → re-exports src/App
├── index.js                   # registerRootComponent
├── app.json                   # Expo configuration (icons, splash, plugins, extra)
├── package.json
├── assets/                    # App icons, splash screen, map background
├── docs/
│   ├── FRONTEND_RESTRUCTURE.md  # Modularisation change log
│   └── INTEGRATION.md           # Backend wiring details
└── src/
    ├── App.js                 # SafeAreaProvider + NavigationContainer + RootNavigator
    ├── config/
    │   └── env.js             # API base-URL resolution + request timeouts
    ├── constants/
    │   ├── assets.js          # Static asset registry
    │   └── mockData.js        # Demo data (seams for backend integration)
    ├── context/
    │   └── AuthContext.js     # Auth state machine (bootstrapping → auth / unauth)
    ├── hooks/
    │   ├── useApi.js          # Declarative fetch (loading / error / refetch)
    │   ├── useDebounce.js     # Debounced search input
    │   ├── useRideCompareForm.js  # Pickup / destination form + compare submit
    │   └── useUserLocation.js # GPS permission + current position
    ├── navigation/
    │   ├── routes.js          # ROUTES name constants
    │   ├── RootNavigator.js   # Native-stack navigator (auth-gated)
    │   └── index.js
    ├── components/
    │   ├── Button/            # PrimaryButton, SecondaryButton
    │   ├── feedback/          # LoadingState, ErrorState, EmptyState
    │   ├── hero/              # HeroCompare, HeroFavorites, HeroInsights
    │   ├── layout/            # ScreenWrap (safe area + max-width), BottomNav
    │   ├── location/          # LocationSearchModal (autocomplete picker)
    │   └── map/               # RideMap
    ├── screens/               # One file per screen (16 screens)
    │   ├── SplashScreen.js
    │   ├── OnboardingScreen.js
    │   ├── LoginScreen.js / SignupScreen.js / LoadingScreen.js
    │   ├── HomeScreen.js / CompareRidesScreen.js
    │   ├── RideMatchScreen.js / RideDetailsScreen.js
    │   ├── ExploreScreen.js / HistoryScreen.js
    │   ├── ProfileScreen.js / EditProfileScreen.js / EditLocationScreen.js
    │   └── InsightsScreen.js
    ├── services/              # API layer (screens never touch axios directly)
    │   ├── endpoints.js       # Central route-path map
    │   ├── ApiError.js        # Normalized error type
    │   ├── storage.js         # SecureStore wrapper (web / in-memory fallback)
    │   ├── httpClient.js      # Axios instance + auth header + silent 401 refresh
    │   ├── authService.js     # register / login / refresh / me / update / logout
    │   ├── ridesService.js    # compare / history / comparison-by-id + DTO mappers
    │   ├── locationsService.js  # autocomplete / geocode / place details
    │   ├── analyticsService.js  # surge predictions / fare trends / summary
    │   ├── notificationService.js  # FCM token registration
    │   ├── savedPlacesService.js   # Client-side saved places (no backend yet)
    │   └── index.js
    ├── theme/
    │   ├── colors.js          # COLORS palette — single source of truth
    │   ├── commonStyles.js    # Shared style primitives (cards, inputs, rows)
    │   └── index.js
    └── utils/
        ├── format.js          # Currency / distance / label / platform color helpers
        ├── responsive.js      # scale / verticalScale / moderateScale (390pt baseline)
        └── useResponsive.js   # Live window-dimension hook (rotation-aware)
```

---

## 4. Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- Expo Go app on a physical device **or** an iOS Simulator / Android Emulator
- The [RideSync+ backend](../rydesync-backend) running locally (see backend README)

### Install dependencies

```bash
cd rydesync-frontend
npm install
```

### Start the development server

```bash
npx expo start
```

Then:
- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go on a physical device (same Wi-Fi as your machine)

### Run a specific platform directly

```bash
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run web       # Browser (http://localhost:8081)
```

---

## 5. Configuration

API connection is resolved at runtime — **first match wins:**

1. `EXPO_PUBLIC_API_URL` environment variable
2. `app.json → expo.extra.apiBaseUrl`
3. Auto-detected LAN host from the Expo dev server + port `8000` *(works on a physical device on the same Wi-Fi with zero config)*
4. `http://localhost:8000` (or `10.0.2.2` on an Android emulator)

### Override examples

```bash
# Point to a deployed backend
EXPO_PUBLIC_API_URL=https://api.ridesync.example npx expo start
```

Or edit `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://api.ridesync.example",
      "apiKey": "your-mobile-api-key"
    }
  }
}
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | auto-detected | Backend base URL |
| `EXPO_PUBLIC_API_KEY` | — | `X-API-Key` header (required in production) |

---

## 6. Screens & Navigation

The navigator is auth-gated inside `AuthContext`. Users who are not signed in land on the **Onboarding → Login / Signup** flow; authenticated users go straight to **Home**.

| Screen | Route key | Description |
|--------|-----------|-------------|
| SplashScreen | `Splash` | Launch spinner while auth bootstraps |
| OnboardingScreen | `Onboarding` | 3-slide intro carousel |
| LoginScreen | `Login` | Email + password sign-in |
| SignupScreen | `Signup` | Account registration |
| LoadingScreen | `Loading` | Transition / in-progress indicator |
| HomeScreen | `Home` | Entry point — pickup / destination + quick actions |
| CompareRidesScreen | `CompareRides` | Full compare form with location autocomplete |
| RideMatchScreen | `RideMatch` | Ranked list of ride options with sort chips |
| RideDetailsScreen | `RideDetails` | Map view + driver card + route card + deep-link CTA |
| ExploreScreen | `Explore` | Saved and recent locations |
| HistoryScreen | `History` | Past comparisons |
| InsightsScreen | `Insights` | Surge forecast, fare trend chart, usage analytics |
| ProfileScreen | `Profile` | Account settings + logout |
| EditProfileScreen | `EditProfile` | Name, phone, ride priority, saved places |
| EditLocationScreen | `EditLocation` | Add / edit a saved place |

---

## 7. Architecture

### Separation of concerns

Screens never import `axios` or `SecureStore` directly. The data flow is:

```
Screen / Hook
    ↓  calls
services/  (authService, ridesService, …)
    ↓  uses
httpClient.js  (axios instance + JWT header + 401 refresh)
    ↓
Backend API
```

### Auth lifecycle (`context/AuthContext.js`)

1. On launch, `AuthContext` restores tokens from `SecureStore` and calls `GET /users/me`. The app shows a spinner while `status === "bootstrapping"`, then routes the user accordingly.
2. `login` POSTs the OAuth2 password form, persists both access and refresh tokens, then loads the user profile.
3. `register` creates the account and auto-logs-in.
4. The HTTP client transparently refreshes the access token on a `401` (single-flight: parallel requests queue behind one refresh, then replay). A failed refresh clears tokens and flips state to `unauthenticated`.
5. Log Out lives on the Profile screen and calls `authService.logout()`.

### Responsiveness (`utils/responsive.js`)

All sizes flow through the **size-matters** pattern calibrated to a **390 × 844 pt** design baseline:

- `scale(n)` — width-based scaling
- `verticalScale(n)` — height-based scaling
- `moderateScale(n, factor=0.5)` — gently damped scaling used for fonts, radii, and spacing

On a 390 pt-wide device `moderateScale(x) === x`, so the layout is **pixel-identical to the design**. On larger devices everything scales proportionally and is capped at `MAX_CONTENT_WIDTH = 430` (centered column on tablet/web).

---

## 8. Backend Integration

### Screen → endpoint map

| Screen | Endpoint |
|--------|----------|
| Login / Signup | `POST /api/v1/auth/login` · `POST /api/v1/auth/register` · `GET /api/v1/users/me` |
| Home / CompareRides | `GET /api/v1/locations/autocomplete` · `GET /api/v1/locations/place/{id}` · `POST /api/v1/rides/compare` |
| RideMatch | Renders compare result; sort chips re-call `POST /api/v1/rides/compare` |
| RideDetails | Selected option from compare result; **Open in app** CTA uses `Linking` deep link |
| History | `GET /api/v1/rides/history` |
| Insights | `GET /api/v1/analytics/summary` · `GET /api/v1/analytics/surge-predictions` · `GET /api/v1/analytics/fare-trends` |
| Profile | `GET /api/v1/users/me` |
| EditProfile | `PATCH /api/v1/users/me` |

### Known limitations / future work

- **WebSocket live pricing** (`/ws/rides/{id}`) — hook infrastructure is in place via `ENV.WS_BASE_URL`; not yet wired to the UI.
- **FCM push registration** — `expo-notifications` is installed; token upload via `POST /api/v1/users/me/fcm-token` is implemented in `notificationService.js` but not yet called on launch.
- **Saved places** — stored client-side only; no backend endpoint exists yet.
- **Forgot / reset password** — no backend endpoint yet.

---

*RideSync+ Frontend — BSc IT Final Year Project | 2025/2026*
