import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { cardsByCategory, categories } from "./src/content";

const STORAGE_LAST_CATEGORY = "kids_card_book_last_category_v1";
const STORAGE_CATEGORY_LAST_INDEX = "kids_card_book_category_last_index_v1";
const STORAGE_CATEGORY_VIEWED_IDS = "kids_card_book_category_viewed_ids_v1";
const STORAGE_FAVORITES = "kids_card_book_favorites_v1";
const WEB_ASSET_BASE = (process.env.EXPO_PUBLIC_WEB_ASSET_BASE || "https://akashbadhe.github.io/baby-alphabet-slideshow").replace(/\/$/, "");

function wrapIndex(index, size) {
  if (size <= 0) return 0;
  return (index + size) % size;
}

function favoriteKey(categoryId, cardId) {
  return `${categoryId}:${cardId}`;
}

function clampIndexByCategory(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [categoryId, value] of Object.entries(raw)) {
    const cards = cardsByCategory[categoryId];
    if (!cards || cards.length === 0) continue;
    const n = Number(value);
    if (!Number.isFinite(n)) continue;
    out[categoryId] = Math.min(Math.max(0, Math.trunc(n)), cards.length - 1);
  }
  return out;
}

function clampViewedIdsByCategory(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [categoryId, ids] of Object.entries(raw)) {
    const cards = cardsByCategory[categoryId];
    if (!cards || !Array.isArray(ids)) continue;
    const validIds = ids
      .map((id) => String(id))
      .filter((id) => cards.some((card) => card.id === id));
    out[categoryId] = [...new Set(validIds)];
  }
  return out;
}

function sanitizeFavorites(raw) {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((item) => String(item))
        .filter((item) => {
          const [categoryId, cardId] = item.split(":");
          const cards = cardsByCategory[categoryId];
          return Boolean(cards?.some((card) => card.id === cardId));
        }),
    ),
  ];
}

function totalCardsCount() {
  return categories.reduce((sum, category) => sum + (cardsByCategory[category.id]?.length || 0), 0);
}

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

function CategoryPicker({ selectedCategory, onSelect, viewedIdsByCategory, favorites }) {
  const favoriteCountForCategory = (categoryId) => {
    const prefix = `${categoryId}:`;
    return favorites.filter((key) => key.startsWith(prefix)).length;
  };

  return (
    <View style={styles.categoryWrap}>
      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoryList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = item.id === selectedCategory;
          return (
            <Pressable
              onPress={() => onSelect(item.id)}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <Text style={styles.categoryEmoji}>{item.icon}</Text>
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item.label}</Text>
              <Text style={[styles.categoryMeta, active && styles.categoryTextActive]}>
                {(viewedIdsByCategory[item.id] || []).length}/{(cardsByCategory[item.id] || []).length} | Fav
                {favoriteCountForCategory(item.id)}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function CardViewer({
  card,
  imageUri,
  index,
  cardsLength,
  voiceOn,
  isFavorite,
  onPrev,
  onNext,
  onToggleVoice,
  onToggleFavorite,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri, card?.id]);

  if (!card) {
    return (
      <View style={styles.viewerWrap}>
        <View style={styles.card}>
          <Text style={styles.subtitle}>No cards in this category yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.viewerWrap}>
      <View style={styles.card}>
        <Text style={styles.value}>{card.value}</Text>
        {!imageFailed && imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.cardImage}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Text style={styles.emoji}>{card.emoji}</Text>
        )}
        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.subtitle}>{card.subtitle}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.controlBtn} onPress={onPrev}>
          <Text style={styles.controlText}>Prev</Text>
        </Pressable>
        <Text style={styles.counter}>
          {index + 1}/{cardsLength}
        </Text>
        <Pressable style={styles.controlBtn} onPress={onNext}>
          <Text style={styles.controlText}>Next</Text>
        </Pressable>
      </View>
      <Pressable style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]} onPress={onToggleFavorite}>
        <Text style={[styles.favoriteBtnText, isFavorite && styles.favoriteBtnTextActive]}>
          Favorite: {isFavorite ? "ON" : "OFF"}
        </Text>
      </Pressable>
      <Pressable style={[styles.voiceBtn, voiceOn && styles.voiceBtnActive]} onPress={onToggleVoice}>
        <Text style={[styles.voiceBtnText, voiceOn && styles.voiceBtnTextActive]}>
          Voice: {voiceOn ? "ON" : "OFF"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("alphabet");
  const [indexByCategory, setIndexByCategory] = useState({});
  const [viewedIdsByCategory, setViewedIdsByCategory] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [voiceOn, setVoiceOn] = useState(false);
  const soundRef = useRef(null);
  const audioAvailabilityCache = useRef(new Map());

  const cards = useMemo(() => cardsByCategory[selectedCategory] || [], [selectedCategory]);
  const currentIndex = useMemo(() => {
    const raw = indexByCategory[selectedCategory] ?? 0;
    if (!cards.length) return 0;
    return Math.min(Math.max(0, raw), cards.length - 1);
  }, [cards.length, indexByCategory, selectedCategory]);
  const card = cards[currentIndex] || null;
  const imageUri = useMemo(() => resolveCardImageUri(selectedCategory, card), [card, selectedCategory]);
  const isFavorite = card ? favorites.includes(favoriteKey(selectedCategory, card.id)) : false;
  const currentViewed = (viewedIdsByCategory[selectedCategory] || []).length;
  const totalViewed = useMemo(
    () => categories.reduce((sum, category) => sum + (viewedIdsByCategory[category.id] || []).length, 0),
    [viewedIdsByCategory],
  );
  const overallTotal = useMemo(() => totalCardsCount(), []);

  useEffect(() => {
    let active = true;
    const loadStorage = async () => {
      try {
        const [lastCategoryRaw, lastIndexRaw, viewedRaw, favoritesRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_LAST_CATEGORY),
          AsyncStorage.getItem(STORAGE_CATEGORY_LAST_INDEX),
          AsyncStorage.getItem(STORAGE_CATEGORY_VIEWED_IDS),
          AsyncStorage.getItem(STORAGE_FAVORITES),
        ]);

        if (!active) return;

        const parsedLastIndex = clampIndexByCategory(lastIndexRaw ? JSON.parse(lastIndexRaw) : {});
        const parsedViewed = clampViewedIdsByCategory(viewedRaw ? JSON.parse(viewedRaw) : {});
        const parsedFavorites = sanitizeFavorites(favoritesRaw ? JSON.parse(favoritesRaw) : []);
        const nextCategory = cardsByCategory[lastCategoryRaw] ? lastCategoryRaw : "alphabet";

        setIndexByCategory(parsedLastIndex);
        setViewedIdsByCategory(parsedViewed);
        setFavorites(parsedFavorites);
        setSelectedCategory(nextCategory);
      } catch {
        // Ignore malformed storage data and use defaults.
      } finally {
        if (active) setHydrated(true);
      }
    };
    loadStorage();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_LAST_CATEGORY, selectedCategory).catch(() => {});
  }, [hydrated, selectedCategory]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_CATEGORY_LAST_INDEX, JSON.stringify(indexByCategory)).catch(() => {});
  }, [hydrated, indexByCategory]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_CATEGORY_VIEWED_IDS, JSON.stringify(viewedIdsByCategory)).catch(() => {});
  }, [hydrated, viewedIdsByCategory]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favorites)).catch(() => {});
  }, [hydrated, favorites]);

  useEffect(() => {
    if (!hydrated || !card) return;
    setViewedIdsByCategory((prev) => {
      const existing = prev[selectedCategory] || [];
      if (existing.includes(card.id)) return prev;
      return {
        ...prev,
        [selectedCategory]: [...existing, card.id],
      };
    });
  }, [card, hydrated, selectedCategory]);

  const stopAudioPlayback = async () => {
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
  };

  const isAudioAvailable = async (uri) => {
    if (!uri) return false;
    if (audioAvailabilityCache.current.has(uri)) return audioAvailabilityCache.current.get(uri);
    try {
      const response = await fetch(uri, { method: "HEAD" });
      const ok = response.ok;
      audioAvailabilityCache.current.set(uri, ok);
      return ok;
    } catch {
      audioAvailabilityCache.current.set(uri, false);
      return false;
    }
  };

  const speakCurrentCard = async () => {
    if (!voiceOn || !card) return;
    await stopAudioPlayback();

    const audioUri = resolveCardAudioUri(selectedCategory, card);
    const canPlayRecorded = await isAudioAvailable(audioUri);
    if (canPlayRecorded) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
        soundRef.current = sound;
        return;
      } catch {
        // Fall through to TTS if recorded playback fails.
      }
    }

    Speech.speak(card.audioLabel || card.subtitle || `${card.value} ${card.title}`, {
      language: "en-US",
      pitch: 1,
      rate: 0.85,
    });
  };

  useEffect(() => {
    if (!voiceOn || !card) return;
    speakCurrentCard();
    return () => {
      stopAudioPlayback();
    };
  }, [voiceOn, card?.id, selectedCategory]);

  useEffect(
    () => () => {
      stopAudioPlayback();
    },
    [],
  );

  const setCurrentIndex = (nextIndex) => {
    setIndexByCategory((prev) => ({
      ...prev,
      [selectedCategory]: wrapIndex(nextIndex, cards.length),
    }));
  };

  const onPrev = () => setCurrentIndex(currentIndex - 1);
  const onNext = () => setCurrentIndex(currentIndex + 1);
  const onToggleFavorite = () => {
    if (!card) return;
    const key = favoriteKey(selectedCategory, card.id);
    setFavorites((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const onToggleVoice = async () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) await stopAudioPlayback();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <Text style={styles.appTitle}>Kids Card Book (Mobile Shell)</Text>
      <Text style={styles.statsLine}>
        Viewed {currentViewed}/{cards.length} | Overall {totalViewed}/{overallTotal} | Favorites {favorites.length}
      </Text>
      <CategoryPicker
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
        viewedIdsByCategory={viewedIdsByCategory}
        favorites={favorites}
      />
      <CardViewer
        card={card}
        imageUri={imageUri}
        index={currentIndex}
        cardsLength={cards.length}
        voiceOn={voiceOn}
        isFavorite={isFavorite}
        onPrev={onPrev}
        onNext={onNext}
        onToggleVoice={onToggleVoice}
        onToggleFavorite={onToggleFavorite}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fbff",
    paddingTop: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "900",
    paddingHorizontal: 16,
    color: "#1f2f46",
  },
  statsLine: {
    marginTop: 6,
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: "800",
    color: "#445b7a",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2f46",
    marginBottom: 8,
  },
  categoryWrap: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  categoryList: {
    paddingBottom: 4,
  },
  categoryChip: {
    minWidth: 116,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: "#ffffff",
    borderColor: "#d6e7ff",
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: "#3f8efc",
    borderColor: "#3f8efc",
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1f2f46",
  },
  categoryTextActive: {
    color: "#ffffff",
  },
  categoryMeta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#577094",
  },
  viewerWrap: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    borderColor: "#e5edfb",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  value: {
    fontSize: 100,
    fontWeight: "900",
    color: "#1f2f46",
    lineHeight: 105,
  },
  emoji: {
    fontSize: 70,
    marginVertical: 8,
  },
  cardImage: {
    width: "72%",
    height: "32%",
    marginVertical: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#1f2f46",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 21,
    fontWeight: "700",
    color: "#445b7a",
    textAlign: "center",
  },
  controls: {
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlBtn: {
    minWidth: 92,
    borderRadius: 999,
    backgroundColor: "#3f8efc",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  controlText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 15,
  },
  counter: {
    fontSize: 16,
    fontWeight: "800",
    color: "#445b7a",
  },
  favoriteBtn: {
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d6e7ff",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "center",
  },
  favoriteBtnActive: {
    backgroundColor: "#ffe9a6",
    borderColor: "#ffd45c",
  },
  favoriteBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2f46",
  },
  favoriteBtnTextActive: {
    color: "#7c4f00",
  },
  voiceBtn: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d6e7ff",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "center",
  },
  voiceBtnActive: {
    backgroundColor: "#d6f3e0",
    borderColor: "#8ed2a4",
  },
  voiceBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1f2f46",
  },
  voiceBtnTextActive: {
    color: "#14532d",
  },
});
