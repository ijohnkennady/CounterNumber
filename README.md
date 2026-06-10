# Counter Numbers — Android App

A React Native (Expo) app to track, count, and share 3–4 digit number entries per day.

---

## Features

- **Splash Screen** — "Counter Numbers" intro with animation
- **3-tab Date Selector** — Yesterday / Today / Tomorrow (like the card UI in the reference)
- **Number Input** — Accepts exactly 3 or 4 digits
- **ADD button** — Saves entry to local storage (AsyncStorage)
- **Live list** — Shows each number with its count
  - Count 2–9 → light red background
  - Count 10+ → dark red background
- **Preview & Share** — Bottom sheet with formatted output + share via any Android app
- **Persistent storage** — All data saved locally, survives app restarts

---

## Formatted Output (Share)

```
11 June 2026
──────────────────────
4556 - 1
452  - 2   ← light red in preview
356  - 1
123  - 1
```

---

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android device or emulator

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npx expo start

# 3. Press 'a' to open on Android emulator
#    OR scan QR code with Expo Go app on your phone
```

### Build APK (release)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account (free)
eas login

# Configure build
eas build:configure

# Build APK for Android
eas build -p android --profile preview
```

---

## Project Structure

```
CounterNumbers/
├── App.js                        ← Navigation root
├── app.json                      ← Expo config
├── package.json
├── babel.config.js
└── src/
    ├── screens/
    │   ├── SplashScreen.js       ← Animated splash (2.5s)
    │   └── HomeScreen.js         ← Main UI (tabs, input, list, preview)
    └── utils/
        ├── dateUtils.js          ← Date key & label helpers
        └── storage.js            ← AsyncStorage CRUD + groupCounts()
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `expo` ~51 | App framework |
| `@react-native-async-storage/async-storage` | Local persistent storage |
| `@react-navigation/native` + `native-stack` | Screen navigation |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen optimization |

---

## Notes

- **Delete** a number: tap the `×` button on a list row (removes one occurrence)
- **Yesterday** works the same as Today/Tomorrow — you can still add entries
- Data is stored per-day; switching the tab auto-loads that day's data
- The delete button removes one occurrence; if a number was added 3 times, tap × three times to fully remove it



Step 3 — Clean reinstall:
bashrd /s /q node_modules
del package-lock.json
npm install
npx expo start --clear