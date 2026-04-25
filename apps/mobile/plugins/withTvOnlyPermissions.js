const { withAndroidManifest, createRunOncePlugin } = require("@expo/config-plugins");

function withTvOnlyPermissions(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    // Only keep TV-safe permissions if TV (LEANBACK_LAUNCHER intent present)
    const app = manifest.application?.[0];
    const activities = app?.activity || [];
    const isTv = activities.some((activity) => {
      const intentFilters = activity["intent-filter"] || [];
      return intentFilters.some((intentFilter) => {
        const categories = intentFilter.category || [];
        return categories.some(
          (category) => category?.$?.["android:name"] === "android.intent.category.LEANBACK_LAUNCHER"
        );
      });
    });
    if (isTv) {
      // Only allow permissions that are safe for TV
      const allowed = [
        "android.permission.INTERNET",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.VIBRATE"
      ];
      manifest["uses-permission"] = (manifest["uses-permission"] || []).filter((p) =>
        allowed.includes(p.$["android:name"])
      );
    }
    return mod;
  });
}

module.exports = createRunOncePlugin(
  withTvOnlyPermissions,
  "with-tv-only-permissions",
  "1.0.0"
);
