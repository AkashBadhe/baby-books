# Mobile Shell (Expo)

This is the initial mobile app shell for Kids Card Book.

## Run

From repo root:

1. `cd apps/mobile`
2. `npm install`
3. `npm run start`
4. Scan QR in Expo Go (Android/iOS), or run `npm run android` / `npm run ios`.

`start/android/ios/web` now auto-run content sync (`../../scripts/export-mobile-content.mjs`) before launching Expo.

## Scope in this phase

- Category selector UI
- Card viewer UI (prev/next)
- Shared generated content from web source
- Navigation parity:
  - next/prev cycles across all categories globally
  - category selection starts from first card
- Media/audio parity:
  - image-first card rendering with emoji fallback
  - voice toggle (default OFF)
  - recorded audio playback when available, with TTS fallback
- Unified React Native architecture:
  - `src/shared/KidsCardBookScreen.js` is shared UI/logic
  - `App.js` is native audio wrapper
  - `App.web.js` is web audio wrapper

## Next

- Bundle full offline media/audio inside mobile app package

## Media Base URL

- Mobile resolves images/audio from `EXPO_PUBLIC_WEB_ASSET_BASE`.
- Default: `https://akashbadhe.github.io/baby-alphabet-slideshow`
- Override example:
  - `set EXPO_PUBLIC_WEB_ASSET_BASE=http://192.168.1.5:5173`
  - `npm run start`
