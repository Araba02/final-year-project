# Backend Integration

**Branch:** `feature/integration`
**Date:** 2026-06-07
**Goal:** Wire the Expo/React Native app to the RideSync+ FastAPI backend —
auth, ride comparison, history, analytics and profile — with a clean,
production-shaped service layer. Screen layouts and the color palette are
unchanged.

---

## 1. Architecture

```
src/
├── config/
│   └── env.js            # API base-URL resolution (auto-detect + override) + timeouts
├── services/             # the API layer
│   ├── endpoints.js      # central route-path map
│   ├── ApiError.js       # normalized error type (always has .message)
│   ├── storage.js        # secure token storage (expo-secure-store; web/in-mem fallback)
│   ├── httpClient.js     # axios instance + auth header + silent 401 refresh
│   ├── authService.js    # register / login / refresh / me / update / logout
│   ├── ridesService.js   # compare / history / comparison-by-id (+ DTO mappers)
│   ├── locationsService.js # autocomplete / geocode / place details
│   ├── analyticsService.js # surge predictions / fare trends / summary
│   └── index.js
├── context/
│   └── AuthContext.js    # auth state machine (bootstrapping→auth/unauth)
├── hooks/
│   ├── useApi.js         # declarative fetch (loading/error/refetch, stale-safe)
│   ├── useDebounce.js    # debounced search input
│   └── useRideCompareForm.js # pickup/destination + compare submit
├── components/
│   ├── feedback/         # LoadingState / ErrorState / EmptyState
│   └── location/         # LocationSearchModal (autocomplete picker)
└── utils/format.js       # currency / distance / labels / platform colors
```

**Principles applied**
- **Separation of concerns** — screens never touch axios/storage; they call
  services or hooks.
- **Typed contracts** — every backend DTO is mapped (snake_case → camelCase)
  in one place, so the UI is insulated from API shape changes.
- **Resilience** — a single normalized `ApiError`; transparent token refresh;
  loading/error/empty states on every data-bound screen.
- **Security** — tokens live in the device keychain/keystore (SecureStore),
  never in plain app state or JS-accessible storage on native.

---

## 2. Configuration

The API base URL is resolved at runtime (first match wins):

1. `EXPO_PUBLIC_API_URL` env var
2. `app.json → expo.extra.apiBaseUrl`
3. **Auto-detected** LAN host from the Expo dev server + port `8000`
   (works on a physical device / emulator on the same Wi-Fi with no config)
4. `http://localhost:8000` (or `10.0.2.2` on Android emulator)

`X-API-Key` is sent only if `EXPO_PUBLIC_API_KEY` / `extra.apiKey` is set
(the backend ignores it in `APP_ENV=development`).

Override examples:
```bash
EXPO_PUBLIC_API_URL=https://api.ridesync.example npx expo start
```
or edit `app.json → expo.extra.apiBaseUrl`.

---

## 3. Auth lifecycle

- On launch, `AuthContext` restores tokens from SecureStore and calls
  `/users/me`. Splash shows a spinner while `status === "bootstrapping"`, then
  routes authenticated users straight to Home.
- `login` posts the OAuth2 password form (`username`=email), persists both
  tokens, then loads the user.
- `register` creates the account then auto-logs-in.
- The HTTP layer refreshes the access token on a 401 (single-flight: parallel
  requests queue behind one refresh, then replay). A failed refresh clears
  tokens and flips state to `unauthenticated`.
- **Log Out** lives on the Profile screen.

---

## 4. Screen → endpoint map

| Screen | Backend |
|---|---|
| Login / Signup | `POST /auth/login`, `POST /auth/register`, `GET /users/me` |
| Home / CompareRides | `GET /locations/autocomplete` + `/locations/place/{id}`, `POST /rides/compare` |
| RideMatch | renders compare result; sort chips re-call `POST /rides/compare` |
| RideDetails | selected option; "Open <platform>" → deep link via `Linking` |
| History | `GET /rides/history` |
| Insights | `GET /analytics/summary` + `/surge-predictions` + `/fare-trends` |
| Profile | `GET /users/me`; preference toggles → `PATCH /users/me` |
| EditProfile | `PATCH /users/me` (full name + ride priority) |

**Notes / known backend limits**
- The backend simulates rides, so options expose `driver_rating` /
  `drivers_nearby` but no driver identity — RideDetails shows platform +
  category + rating accordingly.
- There is no saved-places or per-user surge-alert endpoint yet; those remain
  client-side (Saved Places list, Surge Alerts toggle).
- Email is read-only in EditProfile (the backend `UserUpdate` doesn't accept it).

---

## 5. Running it

```bash
# 1) Backend (from ridesync-backend, APP_ENV=development)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 2) Frontend (from rydesync-frontend)
npx expo start
```
Open in Expo Go / emulator on the same network — the app auto-detects the host.
Use a real device + the same Wi-Fi, or set `EXPO_PUBLIC_API_URL` explicitly.

---

## 6. Out of scope (future)

- Live WebSocket price streaming (`/ws/rides/{id}`) — service hook can reuse
  `ENV.WS_BASE_URL`.
- FCM push registration (`expo-notifications` + `POST /users/me/fcm-token`).
- Saved-places + surge-alert-preference backend endpoints.
- Forgot/Reset password (no backend endpoint yet).

---

## 7. Verification

- ✅ 62 source files parse (`@babel/parser`); all relative imports resolve.
- ✅ `axios`, `expo-secure-store`, `expo-constants` installed and SDK-compatible.
