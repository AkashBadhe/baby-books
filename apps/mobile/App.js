import React, { useCallback, useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as NavigationBar from "expo-navigation-bar";
import * as LocalAuthentication from "expo-local-authentication";
import { AppState, BackHandler, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { cardsByCategory, categories } from "./src/content";
import { KidsCardBookScreen } from "./src/shared/KidsCardBookScreen";
import { resolveBundledImageUri } from "./src/localImageAssets";
import appConfig from "./app.json";

const WEB_ASSET_BASE = (process.env.EXPO_PUBLIC_WEB_ASSET_BASE || "https://akashbadhe.github.io/baby-books").replace(/\/$/, "");
const APP_VERSION = appConfig?.expo?.version || "dev";
const ANDROID_VERSION_CODE = appConfig?.expo?.android?.versionCode;
const APP_VERSION_LABEL = ANDROID_VERSION_CODE
  ? `Version ${APP_VERSION} (Android ${ANDROID_VERSION_CODE})`
  : `Version ${APP_VERSION}`;

function resolveCardImageUri(categoryId, card) {
  if (!card) return null;
  const bundledUri = resolveBundledImageUri(categoryId, card.id);
  if (bundledUri) return bundledUri;
  if (card.image?.startsWith("http://") || card.image?.startsWith("https://")) return card.image;
  if (card.image?.startsWith("/")) return `${WEB_ASSET_BASE}${card.image}`;
  return `${WEB_ASSET_BASE}/assets/cards/${categoryId}/${card.id}.svg`;
}

function resolveCardAudioUri(categoryId, card) {
  if (!card) return null;
  if (card.audio?.startsWith("http://") || card.audio?.startsWith("https://")) return card.audio;
  if (card.audio?.startsWith("/")) return `${WEB_ASSET_BASE}${card.audio}`;
  return `${WEB_ASSET_BASE}/assets/audio/${categoryId}/${card.id}.mp3`;
}

export default function App() {
  const soundRef = useRef(null);
  const audioAvailabilityCache = useRef(new Map());
  const [autoplayOn, setAutoplayOn] = useState(false);
  const [touchLockOn, setTouchLockOn] = useState(false);

  const handleRequestUnlock = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock First Words Cards",
          cancelLabel: "Cancel",
          disableDeviceFallback: false,
        });
        return result.success === true;
      }
      // No biometrics/PIN enrolled — allow unlock.
      return true;
    } catch {
      // Auth unavailable — allow unlock.
      return true;
    }
  }, []);

  useEffect(() => {
    const syncKeepAwake = async () => {
      try {
        if (autoplayOn) {
          await activateKeepAwakeAsync("slideshow-autoplay");
        } else {
          await deactivateKeepAwake("slideshow-autoplay");
        }
      } catch {
        // Ignore keep-awake failures and continue slideshow.
      }
    };

    syncKeepAwake();

    return () => {
      deactivateKeepAwake("slideshow-autoplay").catch(() => {});
    };
  }, [autoplayOn]);

  useEffect(() => {
    if (Platform.OS !== "android") return undefined;

    const applyNavBarState = async () => {
      try {
        if (touchLockOn) {
          await NavigationBar.setBehaviorAsync("overlay-swipe");
          await NavigationBar.setVisibilityAsync("hidden");
        } else {
          await NavigationBar.setBehaviorAsync("inset-swipe");
          await NavigationBar.setVisibilityAsync("visible");
        }
      } catch {
        // Ignore navigation bar lock failures.
      }
    };

    applyNavBarState();

    // Re-apply when nav bar becomes visible again (e.g. after switching apps).
    const visibilitySubscription = NavigationBar.addVisibilityListener(({ visibility }) => {
      if (touchLockOn && visibility === "visible") {
        applyNavBarState();
      }
    });

    // Re-apply when app returns to foreground.
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        applyNavBarState();
      }
    });

    return () => {
      visibilitySubscription?.remove();
      appStateSubscription?.remove();
      NavigationBar.setVisibilityAsync("visible").catch(() => {});
    };
  }, [touchLockOn]);

  useEffect(() => {
    if (!touchLockOn) return undefined;
    const backSubscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => {
      backSubscription.remove();
    };
  }, [touchLockOn]);

  const stopSpeaking = useCallback(async () => {
    Speech.stop();
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch {
      // Ignore playback stop failures.
    } finally {
      soundRef.current = null;
    }
  }, []);

  const isAudioAvailable = useCallback(async (uri) => {
    if (!uri) return false;
    if (audioAvailabilityCache.current.has(uri)) {
      return audioAvailabilityCache.current.get(uri);
    }

    try {
      const response = await fetch(uri, { method: "HEAD" });
      const ok = response.ok;
      audioAvailabilityCache.current.set(uri, ok);
      return ok;
    } catch {
      audioAvailabilityCache.current.set(uri, false);
      return false;
    }
  }, []);

  const speakCard = useCallback(
    async ({ audioUri, fallbackText }) => {
      await stopSpeaking();

      const canPlayRecorded = await isAudioAvailable(audioUri);
      if (canPlayRecorded) {
        try {
          const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
          soundRef.current = sound;
          return;
        } catch {
          // Fall through to TTS.
        }
      }

      Speech.speak(fallbackText, {
        language: "en-US",
        pitch: 1,
        rate: 0.85,
      });
    },
    [isAudioAvailable, stopSpeaking],
  );

  return (
    <SafeAreaProvider>
      <KidsCardBookScreen
        appTitle="First Words Cards"
        appVersionLabel={APP_VERSION_LABEL}
        categories={categories}
        cardsByCategory={cardsByCategory}
        resolveCardImageUri={resolveCardImageUri}
        resolveCardAudioUri={resolveCardAudioUri}
        onSpeakCard={speakCard}
        onStopSpeaking={stopSpeaking}
        onAutoplayChange={setAutoplayOn}
        onTouchLockChange={setTouchLockOn}
        onRequestUnlock={handleRequestUnlock}
      />
    </SafeAreaProvider>
  );
}
