# Kids Card Book: Step-by-Step Implementation Guide

This document is the execution plan to evolve the current baby slideshow into a multi-category **Kids Card Book** that works for:
- Web app (PWA)
- Mobile app
- TV app

---

## 1. Product Scope

### 1.1 Categories (Initial)
- Alphabet
- Numbers
- Colors
- Shapes
- Sizes
- Vegetables
- Fruits
- Know Your Body
- Wild Animals
- Birds
- Vehicles

### 1.2 Core Modes
- Learn mode (manual next/previous/swipe)
- Autoplay mode
- Voice on/off
- Music on/off
- Fullscreen

### 1.3 Future Modes
- Quiz mode
- Favorites
- Progress tracking
- Multi-language packs

---

## 2. Architecture Plan

### 2.1 Short Term (current repo)
- Keep Vite web app.
- Refactor data into category-based content files.
- Keep one shared card renderer and one shared controller.

### 2.2 Medium Term (monorepo)
- `apps/web` (PWA)
- `apps/mobile` (React Native / Expo)
- `apps/tv` (React Native TV)
- `packages/content` (shared category data/assets map)
- `packages/core` (shared logic: navigation, speech, state)
- `packages/ui` (shared theme + components where possible)

---

## 3. Data Model (must implement first)

Use a single card schema for all categories:

```ts
type CardItem = {
  id: string;
  category: string;     // alphabet | numbers | colors | ...
  value: string;        // A, 1, Red, Circle
  title: string;        // Apple, One, Red
  subtitle: string;     // "A for Apple", "1 is One"
  emoji?: string;       // optional fallback
  image?: string;       // preferred local image path
  audioLabel: string;   // text for TTS
  colors: [string, string];
  ageGroup?: "0-2" | "2-4" | "4-6";
};
```

Acceptance criteria:
- Every category can be rendered by the same UI.
- No category-specific rendering hacks in main UI logic.

---

## 4. Implementation Phases

## Phase 1: Content Foundation (Web)

### Step 1
- Create `src/content/` folder.
- Add one file per category:
  - `alphabet.js`, `numbers.js`, `colors.js`, `shapes.js`, etc.

### Step 2
- Export all categories through `src/content/index.js`.
- Add category metadata:
  - display name
  - icon
  - recommended age

### Step 3
- Replace current hardcoded mode logic with:
  - `state.category`
  - `state.index`
  - `activeCards = content[state.category]`

Deliverable:
- App can switch any category with no UI break.

---

## Phase 2: Category Navigation UI

### Step 1
- Add Category Selector screen (grid/list cards).

### Step 2
- On selecting category, open card player.

### Step 3
- Add quick switch control in settings:
  - current category
  - back to category selector

Deliverable:
- Parent can choose any learning category in 1-2 taps.

---

## Phase 3: Media Quality Upgrade

### Step 1
- Add local image assets (`public/assets/...`) for each card.

### Step 2
- Prefer image over emoji in renderer.
- Keep emoji as fallback.

### Step 3
- Keep Twemoji fallback only where image is not available.

Deliverable:
- Crisp and consistent visuals on all devices.

---

## Phase 4: Audio Layer

### Step 1
- Add `audioLabel` for all cards.

### Step 2
- Add optional pre-recorded audio path (`audio?: string`).

### Step 3
- Playback priority:
  1. pre-recorded audio
  2. system TTS
  3. silent fallback

Deliverable:
- Reliable, child-friendly audio experience.

---

## Phase 5: Safety + Baby UX Hardening

### Step 1
- Keep defaults calm:
  - voice OFF by default
  - autoplay OFF by default
  - gentle transitions only

### Step 2
- Parent-only settings entry (simple hold-to-open or math gate for older kids).

### Step 3
- Add accessibility checks:
  - contrast
  - reduced motion support
  - larger tap targets

Deliverable:
- Safe default behavior for very young children.

---

## Phase 6: PWA (Web App Install)

### Step 1
- Add `manifest.webmanifest`.

### Step 2
- Add service worker caching for offline use.

### Step 3
- Add app icons and splash assets.

Deliverable:
- Installable offline-first web app.

---

## Phase 7: Progress + Personalization

### Step 1
- Save last category and last card in local storage.

### Step 2
- Add favorites.

### Step 3
- Add simple completion stats by category.

Deliverable:
- Personalized experience and resume support.

---

## Phase 8: Mobile App

### Step 1
- Create React Native app shell.

### Step 2
- Reuse content and core logic package.

### Step 3
- Use native TTS/audio APIs.

Deliverable:
- Android/iOS app with same categories and behavior.

---

## Phase 9: TV App

### Step 1
- Create TV shell (React Native TV).

### Step 2
- Add remote focus navigation patterns.

### Step 3
- Overscan-safe layout and large focus states.

Deliverable:
- Family-friendly TV learning app.

---

## 5. Testing Plan (Every Phase)

Minimum checks:
- `npm test`
- `npm run build`
- Manual phone test on local network
- Manual desktop and tablet viewport tests

Regression checklist:
- Voice toggle
- Swipe toggle
- Fullscreen
- Category switching
- ABC -> Numbers flow
- Number wrapping layout

---

## 6. Deployment Plan

### Web (current)
- Deploy to GitHub Pages via:
  - `npm run deploy`

### Mobile
- Internal testing through Expo/EAS first, then store submission.

### TV
- Internal beta first, then store submission.

---

## 7. Suggested Execution Order (Practical)

1. Phase 1 + 2 (content model + category selector)
2. Phase 3 + 4 (image/audio quality)
3. Phase 5 + 6 (safety + PWA)
4. Phase 7 (progress)
5. Phase 8 (mobile)
6. Phase 9 (TV)

---

## 8. Definition of Done (V1)

V1 is done when:
- All listed categories are available.
- One shared card engine renders all categories.
- Works offline as installable PWA.
- Parent controls are stable and safe defaults are applied.
- Builds/tests pass in CI and local.

