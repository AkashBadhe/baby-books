const { withAndroidManifest, createRunOncePlugin } = require("@expo/config-plugins");

function ensureUsesFeature(manifest, name, required = false) {
  if (!manifest["uses-feature"]) {
    manifest["uses-feature"] = [];
  }

  const existing = manifest["uses-feature"].find(
    (feature) => feature?.$?.["android:name"] === name,
  );

  if (existing) {
    existing.$["android:required"] = String(required);
    return;
  }

  manifest["uses-feature"].push({
    $: {
      "android:name": name,
      "android:required": String(required),
    },
  });
}

function withAndroidTv(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    ensureUsesFeature(manifest, "android.software.leanback", false);
    ensureUsesFeature(manifest, "android.hardware.touchscreen", false);

    const application = manifest.application?.[0];
    const activities = application?.activity || [];

    activities.forEach((activity) => {
      const intentFilters = activity["intent-filter"] || [];
      const hasLeanbackCategory = intentFilters.some((intentFilter) => {
        const categories = intentFilter.category || [];
        return categories.some(
          (category) => category?.$?.["android:name"] === "android.intent.category.LEANBACK_LAUNCHER",
        );
      });

      if (hasLeanbackCategory) {
        activity.$ = activity.$ || {};
        activity.$["android:screenOrientation"] = "landscape";
      }
    });

    return mod;
  });
}

module.exports = createRunOncePlugin(
  withAndroidTv,
  "with-android-tv",
  "1.0.0",
);
