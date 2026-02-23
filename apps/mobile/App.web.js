import React, { useCallback, useRef } from "react";
import { cardsByCategory, categories } from "./src/content";
import { KidsCardBookScreen } from "./src/shared/KidsCardBookScreen";

const WEB_ASSET_BASE = (process.env.EXPO_PUBLIC_WEB_ASSET_BASE || "https://akashbadhe.github.io/baby-books").replace(/\/$/, "");

function resolveCardImageUri(categoryId, card) {
  if (!card) return null;
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
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const audioAvailabilityCache = useRef(new Map());

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {
        // Ignore playback stop failures.
      }
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
      stopSpeaking();

      const canPlayRecorded = await isAudioAvailable(audioUri);
      if (canPlayRecorded && typeof Audio !== "undefined") {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          audioRef.current.src = audioUri;
          await audioRef.current.play();
          return;
        } catch {
          // Fall through to web speech.
        }
      }

      if (typeof window !== "undefined" && window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined") {
        const utterance = new SpeechSynthesisUtterance(fallbackText);
        utterance.lang = "en-US";
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    },
    [isAudioAvailable, stopSpeaking],
  );

  return (
    <KidsCardBookScreen
      appTitle="Kids Card Book"
      categories={categories}
      cardsByCategory={cardsByCategory}
      resolveCardImageUri={resolveCardImageUri}
      resolveCardAudioUri={resolveCardAudioUri}
      onSpeakCard={speakCard}
      onStopSpeaking={stopSpeaking}
    />
  );
}
