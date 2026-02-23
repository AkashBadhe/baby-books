import React, { useCallback, useRef } from "react";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { cardsByCategory, categories } from "./src/content";
import { KidsCardBookScreen } from "./src/shared/KidsCardBookScreen";
import { resolveBundledImageUri } from "./src/localImageAssets";

const WEB_ASSET_BASE = (process.env.EXPO_PUBLIC_WEB_ASSET_BASE || "https://akashbadhe.github.io/baby-books").replace(/\/$/, "");

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
    <KidsCardBookScreen
      appTitle="FirstWords Cards"
      categories={categories}
      cardsByCategory={cardsByCategory}
      resolveCardImageUri={resolveCardImageUri}
      resolveCardAudioUri={resolveCardAudioUri}
      onSpeakCard={speakCard}
      onStopSpeaking={stopSpeaking}
    />
  );
}
