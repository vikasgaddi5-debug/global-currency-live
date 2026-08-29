# Global Currency Live

A React Native (Expo) mobile app for tracking live/latest global exchange rates,
with a small Node/Express backend that keeps FX provider API keys off the device.

Two folders:
- `/` — the Expo mobile app (Android + iOS)
- `/backend` — Express proxy/cache server that talks to the real FX data provider

---

## 1. Prerequisites

- Node.js 18+ and npm
- The Expo Go app on your phone (easiest way to test), or Android Studio / Xcode
  for emulators
- (Optional but recommended) a free Expo account — `npx expo login`

## 2. Run the backend first

```bash
cd backend
cp .env.example .env
npm install
```

Open `.env` and set:

- `FX_PROVIDER=open_er_api` to start immediately with **no signup** (free,
  keyless, latest rates only, refreshed roughly once every 24h — the app will
  correctly label this as "Latest available data — delayed", never as live).
- Or `FX_PROVIDER=exchangerate_host` + `EXCHANGERATE_HOST_API_KEY=...` for a
  provider with a real-time/paid tier (sign up at https://exchangerate.host
  or https://apilayer.com).
- Leave `HISTORICAL_FX_API_KEY` / `HISTORICAL_FX_PROVIDER_BASE_URL` blank to
  start — the Currency Detail chart will honestly show "historical data not
  available" until you configure one (CurrencyLayer, Fixer.io, Twelve Data,
  Polygon.io, or exchangerate.host's timeseries endpoint all work — adjust
  the request shape in `backend/src/services/fxProvider.js` `getHistoricalRates()`
  to match whichever you pick).
- Leave `ECONOMIC_EVENTS_*` blank to disable Market Events until you wire up
  a calendar provider (Trading Economics, Finnhub, FMP, etc.).

Start it:

```bash
npm start
# Global Currency Live backend listening on port 4000
```

Verify it's alive: open `http://localhost:4000/health` in a browser.

## 3. Point the app at your backend

By default the app falls back to calling the free provider **directly** from
the device (fine for quick local testing, not for production — see Security
below). To use your backend instead, edit `app.json`:

```json
"extra": {
  "apiBaseUrl": "http://YOUR_COMPUTER_LAN_IP:4000/api"
}
```

Use your machine's LAN IP (not `localhost`) so a physical phone running Expo
Go can reach it — e.g. `http://192.168.1.42:4000/api`. Find it with
`ipconfig` (Windows) or `ifconfig`/`ip addr` (Mac/Linux).

## 4. Run the mobile app

```bash
cd ..              # back to the project root
npm install
npx expo start
```

This opens the Expo Dev Tools in your terminal/browser with a QR code:

- **On your phone:** install "Expo Go" from the App Store / Play Store, then
  scan the QR code.
- **iOS Simulator** (Mac only): press `i` in the terminal.
- **Android Emulator:** have one running in Android Studio, then press `a`.

The app should launch on the Home tab showing INR as the default base
currency with USD/EUR/GBP/JPY rates below it.

## 5. Running tests

```bash
npm test
```

(Test scaffolding uses `jest-expo`; add test files under `__tests__/` as you
build out coverage per the testing checklist in the project spec.)

---

## Android build (installable APK/AAB)

1. Install EAS CLI: `npm install -g eas-cli`
2. `eas login`
3. `eas build:configure` (creates `eas.json`, choose Android)
4. `eas build --platform android --profile preview` for a shareable APK, or
   `--profile production` for a Play Store AAB.
5. Update `android.package` in `app.json` to your real reverse-DNS identifier
   before a production build.

## iOS build (TestFlight / App Store)

1. Requires an Apple Developer account ($99/yr) and a Mac for local builds,
   or use EAS's cloud build (no Mac required):
   `eas build --platform ios --profile production`
2. Update `ios.bundleIdentifier` in `app.json` to your real identifier.
3. Submit with `eas submit --platform ios`.

---

## Environment variables reference

### App (`app.json` → `extra`)
| Key | Purpose |
|---|---|
| `apiBaseUrl` | URL of your backend's `/api` root. Never point this at a provider requiring a secret key — that key would ship inside the app bundle. |

### Backend (`backend/.env`)
See `backend/.env.example` — every variable is documented there with the
provider it corresponds to.

---

## Data & security notes

- The app **never** embeds a provider API key. All real-time data requests
  go through the backend, which holds secrets server-side (see Architecture
  requirement #23 in the original spec).
- The dev-mode direct-to-`open.er-api.com` fallback is for local development
  convenience only — it's a free, keyless, non-sensitive endpoint. Before
  shipping to production, set `apiBaseUrl` to your deployed backend so all
  traffic is proxied and cacheable.
- Historical charting and Market Events are both **opt-in** based on whether
  you've configured a provider — the app will never fabricate chart data or
  invent news to fill an empty feature.

## Known gaps to fill in before production

1. **Historical data provider** — required for the 7D/30D/90D/1Y change
   figures and full chart ranges; currently returns an honest
   "not available" state until configured.
2. **Real push notifications (remote)** — the app implements local
   notifications (fires from the device when it's open/backgrounded and the
   refresh loop runs). For alerts to fire while the app is fully closed, add
   a server-side cron job in `/backend` that evaluates alert conditions and
   sends via Expo's push notification service — the client-side
   `alertEngine.js` logic can be reused almost as-is.
3. **App icons/splash** — replace the placeholder references in `assets/`
   with real 1024×1024 icon and splash images before building for stores.
