# Kids Card Book Implementation Checklist

Last updated: 2026-02-22

## Phase 1: Content Foundation

- [x] Create unified category-based content model in code
- [x] Add initial category metadata (name + icon)
- [x] Add initial card sets for:
  - [x] Alphabet
  - [x] Numbers
  - [x] Colors
  - [x] Shapes
  - [x] Sizes
  - [x] Vegetables
  - [x] Fruits
  - [x] Know Your Body
  - [x] Wild Animals
  - [x] Birds
  - [x] Vehicles
- [x] Expand each category to full curriculum card count

## Phase 2: Category Navigation

- [x] Replace ABC/123 toggle with category switcher in current app
- [x] Keep auto-switch from Alphabet -> Numbers at Alphabet end
- [x] Add dedicated category picker screen (grid)
- [x] Add recent category shortcut

## Phase 3: Media Quality

- [x] Twemoji integration for crisp emoji rendering
- [x] Number emoji wrapping and sizing fixes
- [x] Migrate from emoji-first to image-first cards
- [x] Add local packaged media assets for offline quality

## Phase 4: Audio

- [x] Card-level speech label support
- [x] Add pre-recorded audio file support per card
- [x] Add playback priority: recorded -> TTS -> fallback

## Phase 5: Safety and UX

- [x] Voice default OFF
- [x] Calm motion defaults + reduced motion support
- [x] High contrast letter color logic
- [x] Parent lock for settings

## Phase 6: PWA and Deploy

- [x] Vite build pipeline
- [x] GitHub Pages publish command
- [x] Add manifest and service worker for install/offline PWA

## Phase 7: Progress and Personalization

- [x] Save last category
- [x] Save last card index per category
- [x] Show simple category progress stats
- [x] Add favorites
- [x] Add completion stats dashboard

## Phase 8: Mobile App

- [x] Create mobile app shell (React Native/Expo)
- [x] Connect full shared content package
- [x] Add progress/favorites persistence parity
- [x] Add media/audio parity (image-first cards + recorded audio with TTS fallback)
- [ ] Bundle full offline media/audio inside mobile binary

## Current Resume Point

Next recommended task: **Bundle full offline media/audio inside mobile binary**
