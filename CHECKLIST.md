# FirstWords Cards Production + Google Play Checklist

## 1. App Identity and Config
- [x] Set final app name and slug in `apps/mobile/app.json`.
- [x] Set a permanent Android package name in `apps/mobile/app.json`:
  - [x] `expo.android.package` (example: `com.yourcompany.firstwordscards`)
- [x] Set app versioning strategy:
  - [x] `expo.version` for user-facing version (e.g. `1.0.0`)
  - [x] Android `versionCode` increments on every Play upload
- [x] Confirm icon/splash/branding assets are final.

## 2. Stability and Quality
- [ ] Run app on real Android devices (low-end + mid-range + recent).
- [ ] Verify category flows, image rendering, keyboard/touch/swipe behavior.
- [ ] Verify voice/audio toggles and fallback behavior.
- [ ] Verify offline usage for core experience.
- [ ] Remove debug logging and dead code.
- [ ] Confirm no crashes/ANRs during a 15-30 minute usage session.

## 3. Content and Child Safety
- [ ] Review all visuals/text for age-appropriate content.
- [ ] Ensure colors/animations are gentle and non-harsh for babies.
- [ ] Validate subtitles, readability, and contrast.
- [ ] Confirm no unsafe external links or inappropriate prompts.

## 4. Privacy, Policy, and Legal
- [x] Publish a privacy policy URL.
- [x] Add support email and contact website.
- [ ] Complete Play Console "App content" declarations:
  - [ ] Target audience
  - [ ] Ads declaration
  - [ ] Content rating questionnaire
  - [ ] Data safety form
- [ ] Verify compliance with Google Play Developer Program Policies.
- [ ] If targeting children/families, verify Families policy compliance.

## 5. Signing and Release Security
- [ ] Enable Play App Signing.
- [ ] Create/store upload keystore securely (with backup).
- [ ] Configure EAS credentials for Android release signing.
- [ ] Restrict access to signing keys and Play Console roles.

## 6. Build and Submission (Expo EAS)
- [ ] Install/setup Expo + EAS CLI.
- [x] Configure `eas.json` production profile.
- [ ] Build Android App Bundle (AAB):
  - [ ] `eas build --platform android --profile production`
- [ ] Install and validate the release build on devices.
- [ ] Submit AAB to Play Console:
  - [ ] Manual upload (first release recommended)
  - [ ] or `eas submit --platform android`

## 7. Play Console Listing
- [ ] Create Play app entry.
- [ ] Add store listing:
  - [ ] App title
  - [ ] Short + full description
  - [ ] App icon
  - [ ] Feature graphic
  - [ ] Screenshots (phone; tablet if supported)
- [ ] Set category, tags, regions, and pricing.

## 8. Testing Tracks and Launch
- [ ] Publish first build to Internal testing.
- [ ] Fix issues from testers and Pre-launch report.
- [ ] Promote to Closed testing.
- [ ] Validate crash-free and ANR metrics.
- [ ] Roll out to Production with staged rollout:
  - [ ] 5%
  - [ ] 20%
  - [ ] 100%

## 9. Post-Launch Operations
- [ ] Monitor crashes/ANRs and user feedback daily for first week.
- [ ] Patch urgent issues quickly with incremented `versionCode`.
- [x] Maintain a release changelog.
- [ ] Schedule recurring dependency and policy compliance reviews.

## 10. Nice-to-Have (Recommended)
- [ ] Add error monitoring (e.g. Sentry).
- [ ] Add analytics with privacy-safe event tracking.
- [ ] Add CI checks for lint/tests/build before release.
- [x] Add a scripted release checklist command.
