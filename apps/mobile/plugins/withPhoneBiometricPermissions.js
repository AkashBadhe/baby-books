const { withAndroidManifest, createRunOncePlugin } = require("@expo/config-plugins");

function withPhoneBiometricPermissions(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    // Only add biometric permissions if not TV (no LEANBACK_LAUNCHER intent)
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
    if (!isTv) {
      // Add biometric permissions if not present
      manifest["uses-permission"] = manifest["uses-permission"] || [];
      const perms = [
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT"
      ];
      perms.forEach((perm) => {
        if (!manifest["uses-permission"].some((p) => p.$["android:name"] === perm)) {
          manifest["uses-permission"].push({ $: { "android:name": perm } });
        }
      });
    }
    return mod;
  });
}

module.exports = createRunOncePlugin(
  withPhoneBiometricPermissions,
  "with-phone-biometric-permissions",
  "1.0.0"
);
