# First Words Cards Release Notes

## 1.1.0
- Improved alphabet and number card stability on tablet screens.
- Removed motion from alphabet/number cards to avoid jumping.
- Fixed color swatch circles and removed unwanted circle borders.
- Improved bottom navigation button sizing and alignment consistency.
- Increased letter/number readability on mobile without layout breakage.

## 1.0.0
- Unified mobile/web card experience.
- Keyboard navigation support on web.
- Shape and size categories switched to image-driven cards.
- Colors category simplified with clear color-circle rendering.
- Baby-safe gradient softening for calmer visuals.
- Subtitle and transition improvements for smoother card navigation.

## Release Process Notes
- Increment Android `versionCode` for every production upload.
- Keep `expo.version` aligned with public release version.
- Build with:
  - `npm run build:android:prod`
- Submit with:
  - `npm run submit:android:prod`
