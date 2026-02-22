# Baby Books Slideshow

Interactive learning slideshow for toddlers with categories (alphabet, numbers, fruits, vegetables, birds, body, vehicles, wild animals), swipe navigation, voice support, and GitHub Pages deployment.

## Features

- Category-based flashcards with automatic category cycling
- Smooth tap/swipe slide transitions
- Image-first cards for real visual assets
- Optional text-to-speech and recorded audio per card
- PWA support (manifest + service worker)
- Automated image optimization before build

## Discoverability Tags

Use these as GitHub Topics/keywords:

`kids-learning` `toddler-app` `flashcards` `alphabet-learning` `numbers-learning` `early-education` `preschool` `pwa` `vite` `javascript` `offline-app` `image-optimization` `github-pages`

## Project Structure

- `index.html`: app shell and markup
- `src/main.js`: app state, interactions, slideshow behavior
- `src/styles.css`: UI and animation styles
- `src/slides.js`: category/card content
- `src/logic.js`: pure logic helpers
- `src/voice.js`: TTS voice helpers
- `scripts/optimize-assets.mjs`: automatic image/SVG optimization pipeline
- `raw-assets/photos/`: source images (not directly shipped)
- `public/assets/photos/`: processed images used by the app
- `tests/*.test.js`: unit tests

## Local Development

1. `npm install`
2. `npm run dev`

## Image Workflow

1. Add original images to:
   - `raw-assets/photos/fruits/`
   - `raw-assets/photos/vegetables/`
   - `raw-assets/photos/birds/`
   - `raw-assets/photos/bodyparts/`
   - `raw-assets/photos/vehicles/`
   - `raw-assets/photos/wild_animals/`
2. Copy mapped files to `public/assets/photos/...` (lowercase names matching card IDs).
3. Run optimization:
   - `npm run assets:optimize`

## Build and Test

- Build (runs optimization automatically via `prebuild`):
  - `npm run build`
- Run tests:
  - `npm test`
  - `npm run test:watch`

## Optional Recorded Audio Per Card

Add audio files under `public/assets/audio/...` and set `audio` in `src/slides.js` card objects.

Playback priority:

- recorded audio (if available)
- TTS (`audioLabel`)

## Deploy to GitHub Pages

1. `npm run deploy`
2. Open: `https://akashbadhe.github.io/baby-books/`

If old content appears after deploy, hard refresh once (`Ctrl+F5`). The service worker is configured to reduce stale-page issues.
