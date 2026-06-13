# Frontend Restructure — Change Log

**Branch:** `feature/integration`
**Date:** 2026-06-07
**Scope:** Reorganize the Expo / React Native app from a single 2,349-line
`App.js` into a modular, enterprise-grade structure and make the UI
responsive — **without changing any colors or the visual layout**.

---

## 1. Summary

The entire UI previously lived in one file (`App.js`, ~2,350 lines) mixing
the navigator, 17 screens, shared components, the colour palette, and one
massive `StyleSheet`. It has been split into a conventional, scalable
`src/` tree with a clear separation of concerns. Every fixed pixel value now
flows through a responsive scaling helper so the app adapts across phone /
tablet / web.

No colours, copy, icons, navigation flow, or layout proportions were
changed. The design reference (Figma) is unchanged on a phone-sized viewport.

---

## 2. New directory structure

```
rydesync-frontend/
├── App.js                      # 8-line entry shim → re-exports src/App
├── index.js                    # unchanged (registerRootComponent)
├── docs/
│   └── FRONTEND_RESTRUCTURE.md # this document
└── src/
    ├── App.js                  # SafeAreaProvider + NavigationContainer + RootNavigator
    ├── theme/
    │   ├── colors.js           # COLORS palette (single source of truth)
    │   ├── commonStyles.js     # reusable style primitives (cards, inputs, rows…)
    │   └── index.js            # barrel
    ├── utils/
    │   ├── responsive.js       # scale / verticalScale / moderateScale (size-matters)
    │   └── useResponsive.js    # live window-dimension hook (rotation/resize aware)
    ├── constants/
    │   ├── assets.js           # static asset registry (mapPhoto)
    │   └── mockData.js         # all hard-coded demo data (integration seams)
    ├── navigation/
    │   ├── routes.js           # ROUTES name constants
    │   ├── RootNavigator.js    # native-stack navigator
    │   └── index.js            # barrel
    ├── components/
    │   ├── Button/             # PrimaryButton, SecondaryButton
    │   ├── layout/             # ScreenWrap, BottomNav
    │   ├── hero/               # HeroCompare, HeroFavorites, HeroInsights (+ shared styles)
    │   └── index.js            # barrel
    └── screens/                # one file per screen (15 files) + barrel
        ├── SplashScreen.js
        ├── OnboardingScreen.js (template + 3 slide variants)
        ├── LoginScreen.js / SignupScreen.js / LoadingScreen.js
        ├── HomeScreen.js / CompareRidesScreen.js
        ├── RideMatchScreen.js / RideDetailsScreen.js
        ├── ExploreScreen.js / HistoryScreen.js
        ├── ProfileScreen.js / EditProfileScreen.js / EditLocationScreen.js
        └── InsightsScreen.js
```

---

## 3. Responsiveness

Implemented with the **size-matters** pattern in `src/utils/responsive.js`:

- `scale(n)` — width-based scaling.
- `verticalScale(n)` — height-based scaling.
- `moderateScale(n, factor=0.5)` — gently damped scaling (aliased `ms`),
  used for nearly all font sizes, radii, spacing and dimensions.

**Calibration:** the design is treated as authored at **390 × 844** logical
points. On a device of that width `ms(x) === x`, so the layout renders
**pixel-identical to the original**. On other sizes everything scales
proportionally — proportions (the layout) are preserved, only absolute sizes
adapt. Scaling width is clamped (`MAX_SCALE_WIDTH = 430`) so text/elements
don't balloon on tablets/web.

Additional responsive behaviour:
- `ScreenWrap` now uses `react-native-safe-area-context` (proper notch /
  home-indicator insets on every device).
- Content is constrained to a centered max-width column
  (`MAX_CONTENT_WIDTH = 430`) on large screens (tablet/web). On phones this is
  a no-op, so the phone layout is unchanged.

---

## 4. Notable refactors (behaviour-preserving)

- **Colours**: every hex/rgba kept identical; centralized in `theme/colors.js`.
- **Shared styles**: styles used by multiple screens moved to
  `theme/commonStyles.js`; screen-specific styles co-located in each screen.
- **Route names**: string literals replaced with `ROUTES.*` constants.
- **Navigator**: inline arrow-function screens (onboarding) replaced with
  named components — fixes a subtle React anti-pattern (new component identity
  every render) with no visual change.
- **Mock data**: all hard-coded arrays (saved locations, rides, history,
  insights) extracted to `constants/mockData.js` — these are the seams for the
  upcoming backend integration.
- A duplicate `rideMeta` style key in the original collapsed to the
  runtime-effective value (`fontSize: 9`); behaviour is unchanged.

---

## 5. Verification

- ✅ All 41 source files parse cleanly (`@babel/parser`, jsx plugin).
- ✅ All relative imports resolve to existing files/barrels.
- ✅ No colour or layout values altered (only wrapped in `ms()`); identical
  render on a 390-pt-wide viewport.

---

## 6. Figma reconciliation (2026-06-07, follow-up)

After reviewing the Figma board (`screenshot/file.png`) we confirmed it
contains **16 frames, all already present** as routes. No entirely-new
screens were missing, but **two screens had been carried over as rough stubs
that did not match the design** and were rebuilt to match it fully:

- **`RideDetailsScreen`** — rebuilt to the Figma "Ride Details" frame: header
  (back / title / share), live map with a "Live Traffic" badge, white vehicle
  card, "TOP CHOICE / Uber X / ₵24.50 / 4 min away" summary, seats/fastest
  chips, driver card (Marcus Thompson · Black Tesla Model 3 · SEO-1234 · ⭐4.8),
  pickup/drop-off route card, and "Continue to App ->".
- **`EditProfileScreen`** — added the split phone field (🇬🇭 +233 │ number +
  "Verified · Accra, Ghana"), a proper Preferences card (Ride Priority chips +
  Surge Alerts toggle) and a **Saved Places** section (Home / Work rows with
  edit + delete actions and an "Add New" link → `EditLocation`).

Flow wiring:
- `RideMatch` → **Book Now** now navigates to **Ride Details**.
- `EditProfile` → **Add New** / **edit** on a saved place navigates to
  `EditLocation`.

New mock data added to `constants/mockData.js`: `RIDE_DETAILS`, `SAVED_PLACES`.

Verification: all 41 files parse, all relative imports resolve.

## 7. Out of scope (next steps)

- Backend integration (REST + WebSocket) — `constants/mockData.js`, a future
  `src/services/` API layer, and state/auth are the planned seams.
- Functional forms (inputs are still presentational).
- Cross-check each screen against the Figma source once integration begins.
