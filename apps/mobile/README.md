# Mobile Shell (Expo)

This is the initial mobile app shell for Kids Card Book.

## Run

From repo root, sync shared content first:

1. `npm run mobile:sync-content`
2. `cd apps/mobile`
3. `npm install`
4. `npm run start`
5. Scan QR in Expo Go (Android/iOS), or run `npm run android` / `npm run ios`.

## Run (inside mobile folder only)

1. `cd apps/mobile`
2. `npm install`
3. `npm run start`
4. Scan QR in Expo Go (Android/iOS), or run `npm run android` / `npm run ios`.

## Scope in this phase

- Category selector UI
- Card viewer UI (prev/next)
- Shared generated content from web source
- Persisted progress parity:
  - last category
  - last card index per category
  - viewed cards per category
  - favorites
- Media/audio parity:
  - image-first card rendering with emoji fallback
  - voice toggle (default OFF)
  - recorded audio playback when available, with TTS fallback

## Next

- Bundle full offline media/audio inside mobile app package

## Media Base URL

- Mobile resolves images/audio from `EXPO_PUBLIC_WEB_ASSET_BASE`.
- Default: `https://akashbadhe.github.io/baby-alphabet-slideshow`
- Override example:
  - `set EXPO_PUBLIC_WEB_ASSET_BASE=http://192.168.1.5:5173`
  - `npm run start`
