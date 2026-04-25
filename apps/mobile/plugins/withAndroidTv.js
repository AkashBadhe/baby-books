const { withAndroidManifest, withDangerousMod, createRunOncePlugin } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

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

function withAndroidTvManifest(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    ensureUsesFeature(manifest, "android.software.leanback", false);
    ensureUsesFeature(manifest, "android.hardware.touchscreen", false);
    ensureUsesFeature(manifest, "android.hardware.microphone", false);

    const application = manifest.application?.[0];
    if (application) {
      application.$ = application.$ || {};
      // Point to a dedicated TV banner drawable (320×180px, xhdpi)
      application.$["android:banner"] = "@drawable/tv_banner";
      // Point to a dedicated TV icon (512x512px, xhdpi)
      application.$["android:icon"] = "@drawable/tv_icon";
    }

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
      }
    });

    return mod;
  });
}

function withAndroidTvBannerAndIcon(config) {
  return withDangerousMod(config, [
    "android",
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const platformRoot = mod.modRequest.platformProjectRoot;

      // Banner
      const srcBanner = path.resolve(projectRoot, "assets", "tv_banner.png");
      const destDir = path.join(platformRoot, "app", "src", "main", "res", "drawable-xhdpi");
      const destBanner = path.join(destDir, "tv_banner.png");

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      if (fs.existsSync(srcBanner)) {
        fs.copyFileSync(srcBanner, destBanner);
        console.log("[withAndroidTv] Copied tv_banner.png to drawable-xhdpi/");
      } else {
        console.warn(
          "[withAndroidTv] WARNING: assets/tv_banner.png not found. " +
          "Create a 320×180px PNG that fills the entire image area (no padding/transparency) " +
          "and place it at apps/mobile/assets/tv_banner.png before building."
        );
      }

      // Icon
      const srcIcon = path.resolve(projectRoot, "assets", "tv_icon.png");
      const destIcon = path.join(destDir, "tv_icon.png");
      if (fs.existsSync(srcIcon)) {
        fs.copyFileSync(srcIcon, destIcon);
        console.log("[withAndroidTv] Copied tv_icon.png to drawable-xhdpi/");
      } else {
        console.warn(
          "[withAndroidTv] WARNING: assets/tv_icon.png not found. " +
          "Create a 512×512px PNG that fills the entire image area (no padding/transparency) " +
          "and place it at apps/mobile/assets/tv_icon.png before building."
        );
      }

      return mod;
    },
  ]);
}

function withAndroidTv(config) {
  config = withAndroidTvManifest(config);
  config = withAndroidTvBannerAndIcon(config);
  return config;
}

module.exports = createRunOncePlugin(
  withAndroidTv,
  "with-android-tv",
  "1.0.0",
);
