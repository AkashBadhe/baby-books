# Baby Alphabet Slideshow

Simple A-Z slideshow for babies, now organized for easier change, testing, and deployment.

## Implementation Plan

- Step-by-step multi-platform implementation guide:
  - `IMPLEMENTATION_README.md`
- Live progress and resume checklist:
  - `IMPLEMENTATION_CHECKLIST.md`

## Project Structure

- `index.html`: app shell and markup
- `src/main.js`: app wiring and event handlers
- `src/styles.css`: styles
- `src/slides.js`: alphabet slide content
- `src/logic.js`: pure logic (swipe detection and index wrapping)
- `src/voice.js`: voice selection and speech helpers
- `tests/*.test.js`: unit tests

## Local Development

1. `npm install`
2. `npm run dev`

## Run Tests

- `npm test`
- `npm run test:watch`

## Build For Deployment

1. `npm run build`
2. Deploy the generated `dist/` folder to any static host:
   - GitHub Pages
   - Netlify
   - Vercel (static)
   - Cloudflare Pages

`vite.config.js` uses `base: "./"` so the app also works when hosted from a subpath.

## Local Card Assets

- Generate packaged local SVG assets for all cards:
  - `npm run assets:generate`

## Optional Recorded Audio Per Card

You can add pre-recorded audio files (preferred over TTS) by:

1. Placing files under `public/assets/audio/...`
2. Adding `audio` to a card in `src/slides.js`, for example:

```js
{
  id: "a",
  value: "A",
  title: "Apple",
  subtitle: "A for Apple",
  emoji: "🍎",
  audioLabel: "A for Apple",
  audio: "/assets/audio/alphabet/a.mp3",
  colors: ["#ff9a9e", "#fad0c4"]
}
```

Playback priority is:
- recorded audio (if available)
- TTS (`audioLabel`)

## PWA Support

The app now includes:
- `public/manifest.webmanifest`
- `public/sw.js` service worker for offline caching
- local app icons in `public/icons/`

## Publish To GitHub Pages

1. Ensure your git remote is set to your GitHub repo.
2. Run:
   - `npm install`
   - `npm run deploy`

This builds the app and publishes `dist/` to the `gh-pages` branch.
