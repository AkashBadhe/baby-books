import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View, Platform, StatusBar as RNStatusBar, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

function wrapIndex(index, size) {
  if (size <= 0) return 0;
  return (index + size) % size;
}

function favoriteKey(categoryId, cardId) {
  return `${categoryId}:${cardId}`;
}

function shouldHideSubtitle(categoryId, subtitle) {
  if (!subtitle) return true;
  if (categoryId === "numbers") return true;
  return /^(this is|these are)\b/i.test(subtitle.trim());
}

function totalCardsCount(categories, cardsByCategory) {
  return categories.reduce((sum, category) => sum + (cardsByCategory[category.id]?.length || 0), 0);
}

function CategorySheet({ categories, selectedCategory, onSelect }) {
  return (
    <View>
      <Text style={styles.sheetTitle}>Choose Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map((item) => {
          const active = item.id === selectedCategory;
          return (
            <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[styles.categoryChip, active && styles.categoryChipActive]}>
              <Text style={styles.categoryEmoji}>{item.icon}</Text>
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SettingsSheet({
  voiceOn,
  isFavorite,
  onToggleVoice,
  onToggleFavorite,
  currentViewed,
  cardsLength,
  totalViewed,
  overallTotal,
  delayMs,
  onSetDelay,
}) {
  const delayOptions = [2000, 3000, 5000, 8000];

  return (
    <View>
      <Text style={styles.sheetTitle}>Settings</Text>
      <Text style={styles.sheetStats}>Viewed {currentViewed}/{cardsLength} | Overall {totalViewed}/{overallTotal}</Text>
      <View style={styles.settingsActions}>
        <Pressable style={[styles.pillBtn, voiceOn && styles.pillBtnActive]} onPress={onToggleVoice}>
          <Text style={[styles.pillBtnText, voiceOn && styles.pillBtnTextActive]}>Voice {voiceOn ? "ON" : "OFF"}</Text>
        </Pressable>
        <Pressable style={[styles.pillBtn, isFavorite && styles.favoritePillBtnActive]} onPress={onToggleFavorite}>
          <Text style={[styles.pillBtnText, isFavorite && styles.favoritePillBtnTextActive]}>
            Favorite {isFavorite ? "ON" : "OFF"}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.delayLabel}>Slide Delay</Text>
      <View style={styles.settingsActions}>
        {delayOptions.map((value) => {
          const active = delayMs === value;
          return (
            <Pressable key={value} style={[styles.pillBtn, active && styles.pillBtnActive]} onPress={() => onSetDelay(value)}>
              <Text style={[styles.pillBtnText, active && styles.pillBtnTextActive]}>{value / 1000}s</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function GridIcon({ active }) {
  const squareStyle = [styles.iconSquare, active && styles.iconSquareActive];
  return (
    <View style={styles.gridIconWrap}>
      <View style={squareStyle} />
      <View style={squareStyle} />
      <View style={squareStyle} />
      <View style={squareStyle} />
    </View>
  );
}

function SlidersIcon({ active }) {
  return (
    <View style={styles.slidersWrap}>
      <View style={[styles.sliderLine, active && styles.sliderLineActive]}>
        <View style={[styles.sliderDot, styles.sliderDotTop, active && styles.sliderDotActive]} />
      </View>
      <View style={[styles.sliderLine, active && styles.sliderLineActive]}>
        <View style={[styles.sliderDot, styles.sliderDotMid, active && styles.sliderDotActive]} />
      </View>
      <View style={[styles.sliderLine, active && styles.sliderLineActive]}>
        <View style={[styles.sliderDot, styles.sliderDotBottom, active && styles.sliderDotActive]} />
      </View>
    </View>
  );
}

function CardViewer({ categoryId, card, imageUri, onPrev, onNext }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const alphabetMode = categoryId === "alphabet";
  const numberMode = categoryId === "numbers";
  const visualMode = !alphabetMode && !numberMode;
  const showSubtitle = !shouldHideSubtitle(categoryId, card?.subtitle);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri, card?.id]);

  const onSwipeEnd = useCallback(
    (endX, endY) => {
      if (!touchStart) return;
      const dx = endX - touchStart.x;
      const dy = endY - touchStart.y;
      if (Math.abs(dx) <= 45) return;
      if (Math.abs(dx) <= Math.abs(dy) * 1.2) return;
      if (dx < 0) onNext();
      else onPrev();
    },
    [onNext, onPrev, touchStart],
  );

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
      <View
        style={styles.card}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          setTouchStart({ x: pageX, y: pageY });
        }}
        onResponderRelease={(event) => {
          const { pageX, pageY } = event.nativeEvent;
          onSwipeEnd(pageX, pageY);
          setTouchStart(null);
        }}
        onResponderTerminate={() => setTouchStart(null)}
      >
        {(alphabetMode || numberMode) && <Text style={styles.value}>{card.value}</Text>}

        {!imageFailed && imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={visualMode ? styles.cardImageLarge : styles.cardImage}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Text style={visualMode ? styles.emojiLarge : styles.emoji}>{card.emoji}</Text>
        )}

        <Text style={visualMode ? styles.titleVisual : styles.title}>{card.title}</Text>
        {showSubtitle && <Text style={styles.subtitle}>{card.subtitle}</Text>}
      </View>

    </View>
  );
}

export function KidsCardBookScreen({
  appTitle,
  categories,
  cardsByCategory,
  resolveCardImageUri,
  resolveCardAudioUri,
  onSpeakCard,
  onStopSpeaking,
}) {
  const orderedCategoryIds = useMemo(
    () => categories.filter((item) => (cardsByCategory[item.id] || []).length > 0).map((item) => item.id),
    [cardsByCategory, categories],
  );
  const defaultCategory = orderedCategoryIds[0] || "alphabet";

  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedIdsByCategory, setViewedIdsByCategory] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [voiceOn, setVoiceOn] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [delayMs, setDelayMs] = useState(3000);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const cards = useMemo(() => cardsByCategory[selectedCategory] || [], [cardsByCategory, selectedCategory]);
  const normalizedIndex = useMemo(() => wrapIndex(currentIndex, cards.length || 1), [currentIndex, cards.length]);
  const card = cards[normalizedIndex] || null;
  const imageUri = useMemo(() => resolveCardImageUri(selectedCategory, card), [card, resolveCardImageUri, selectedCategory]);
  const isFavorite = card ? favorites.includes(favoriteKey(selectedCategory, card.id)) : false;

  const bgColors = useMemo(() => {
    const fallback = ["#fde7ef", "#e9f6ff"];
    if (!card?.colors || card.colors.length < 2) return fallback;
    return [card.colors[0], card.colors[1]];
  }, [card]);

  const currentViewed = (viewedIdsByCategory[selectedCategory] || []).length;
  const totalViewed = useMemo(
    () => categories.reduce((sum, category) => sum + (viewedIdsByCategory[category.id] || []).length, 0),
    [categories, viewedIdsByCategory],
  );
  const overallTotal = useMemo(() => totalCardsCount(categories, cardsByCategory), [cardsByCategory, categories]);

  const topInset = Platform.OS === "android" ? (RNStatusBar.currentHeight || 0) : 0;
  const bottomInset = Platform.OS === "ios" ? 28 : 26;

  useEffect(() => {
    if (!orderedCategoryIds.includes(selectedCategory)) {
      setSelectedCategory(defaultCategory);
      setCurrentIndex(0);
    }
  }, [defaultCategory, orderedCategoryIds, selectedCategory]);

  useEffect(() => {
    setCurrentIndex((prev) => wrapIndex(prev, cards.length || 1));
  }, [cards.length]);

  useEffect(() => {
    if (!card) return;
    setViewedIdsByCategory((prev) => {
      const existing = prev[selectedCategory] || [];
      if (existing.includes(card.id)) return prev;
      return {
        ...prev,
        [selectedCategory]: [...existing, card.id],
      };
    });
  }, [card, selectedCategory]);

  useEffect(() => {
    if (!voiceOn || !card) return;
    onSpeakCard?.({
      categoryId: selectedCategory,
      card,
      audioUri: resolveCardAudioUri(selectedCategory, card),
      fallbackText: card.audioLabel || card.subtitle || `${card.value} ${card.title}`,
    });

    return () => {
      onStopSpeaking?.();
    };
  }, [card, onSpeakCard, onStopSpeaking, resolveCardAudioUri, selectedCategory, voiceOn]);

  useEffect(
    () => () => {
      onStopSpeaking?.();
    },
    [onStopSpeaking],
  );

  const selectCategory = useCallback(
    (categoryId) => {
      if (!cardsByCategory[categoryId]) return;
      onStopSpeaking?.();
      setSelectedCategory(categoryId);
      setCurrentIndex(0);
      setCategoryPickerOpen(false);
    },
    [cardsByCategory, onStopSpeaking],
  );

  const moveGlobal = useCallback(
    (step) => {
      if (!orderedCategoryIds.length) return;

      let categoryPos = orderedCategoryIds.indexOf(selectedCategory);
      if (categoryPos < 0) categoryPos = 0;
      let indexPos = currentIndex + step;

      while (true) {
        const categoryId = orderedCategoryIds[categoryPos];
        const cardsLength = (cardsByCategory[categoryId] || []).length;

        if (cardsLength <= 0) {
          categoryPos = (categoryPos + (step >= 0 ? 1 : -1) + orderedCategoryIds.length) % orderedCategoryIds.length;
          continue;
        }

        if (indexPos >= cardsLength) {
          indexPos -= cardsLength;
          categoryPos = (categoryPos + 1) % orderedCategoryIds.length;
          continue;
        }

        if (indexPos < 0) {
          categoryPos = (categoryPos - 1 + orderedCategoryIds.length) % orderedCategoryIds.length;
          indexPos += (cardsByCategory[orderedCategoryIds[categoryPos]] || []).length;
          continue;
        }

        onStopSpeaking?.();
        setSelectedCategory(orderedCategoryIds[categoryPos]);
        setCurrentIndex(indexPos);
        return;
      }
    },
    [cardsByCategory, currentIndex, onStopSpeaking, orderedCategoryIds, selectedCategory],
  );

  const onPrev = () => moveGlobal(-1);
  const onNext = () => moveGlobal(1);

  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = setInterval(() => {
      moveGlobal(1);
    }, delayMs);
    return () => clearInterval(timer);
  }, [autoplay, delayMs, moveGlobal]);

  const onToggleFavorite = () => {
    if (!card) return;
    const key = favoriteKey(selectedCategory, card.id);
    setFavorites((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const onToggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) onStopSpeaking?.();
  };

  const hasSheetOpen = categoryPickerOpen || settingsOpen;

  return (
    <SafeAreaView style={[styles.root, { paddingTop: topInset + 6 }]}> 
      <StatusBar style="dark" />
      <LinearGradient colors={bgColors} start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.appTitle}>{appTitle}</Text>
          <Text style={styles.currentCategoryLabel}>{categories.find((c) => c.id === selectedCategory)?.label || "Category"}</Text>
        </View>
      </View>

      <CardViewer
        categoryId={selectedCategory}
        card={card}
        imageUri={imageUri}
        onPrev={onPrev}
        onNext={onNext}
      />

      <View style={[styles.bottomNav, { paddingBottom: bottomInset }]}>
        <Pressable
          style={[styles.navPill, categoryPickerOpen && styles.navPillActive]}
          onPress={() => {
            setSettingsOpen(false);
            setCategoryPickerOpen((prev) => !prev);
          }}
        >
          <GridIcon active={categoryPickerOpen} />
          <Text style={[styles.navPillText, categoryPickerOpen && styles.navPillTextActive]}>Categories</Text>
        </Pressable>

        <Pressable style={[styles.navPill, autoplay && styles.navPillActive]} onPress={() => setAutoplay((prev) => !prev)}>
          <Text style={[styles.navIconGlyph, autoplay && styles.navPillTextActive]}>{autoplay ? "❚❚" : "▶"}</Text>
          <Text style={[styles.navPillText, autoplay && styles.navPillTextActive]}>{autoplay ? "Pause" : "Play"}</Text>
        </Pressable>

        <Pressable
          style={[styles.navPill, settingsOpen && styles.navPillActive]}
          onPress={() => {
            setCategoryPickerOpen(false);
            setSettingsOpen((prev) => !prev);
          }}
        >
          <SlidersIcon active={settingsOpen} />
          <Text style={[styles.navPillText, settingsOpen && styles.navPillTextActive]}>Settings</Text>
        </Pressable>
      </View>

      {hasSheetOpen && (
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            setCategoryPickerOpen(false);
            setSettingsOpen(false);
          }}
        />
      )}

      {hasSheetOpen && (
        <View style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {categoryPickerOpen ? (
              <CategorySheet categories={categories} selectedCategory={selectedCategory} onSelect={selectCategory} />
            ) : (
              <SettingsSheet
                voiceOn={voiceOn}
                isFavorite={isFavorite}
                onToggleVoice={onToggleVoice}
                onToggleFavorite={onToggleFavorite}
                currentViewed={currentViewed}
                cardsLength={cards.length}
                totalViewed={totalViewed}
                overallTotal={overallTotal}
                delayMs={delayMs}
                onSetDelay={setDelayMs}
              />
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    marginHorizontal: 12,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.26)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  appTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#142038",
  },
  currentCategoryLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: "#2b476f",
  },
  viewerWrap: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 150,
  },
  card: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  value: {
    fontSize: 106,
    fontWeight: "900",
    color: "#141d30",
    lineHeight: 110,
    marginBottom: 2,
  },
  emoji: {
    fontSize: 74,
    marginVertical: 10,
  },
  emojiLarge: {
    fontSize: 112,
    marginVertical: 12,
  },
  cardImage: {
    width: "74%",
    height: "34%",
    marginVertical: 10,
  },
  cardImageLarge: {
    width: "94%",
    height: "60%",
    marginVertical: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#17243b",
    textAlign: "center",
  },
  titleVisual: {
    fontSize: 36,
    fontWeight: "900",
    color: "#17243b",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "700",
    color: "#2f4b73",
    textAlign: "center",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    zIndex: 30,
    borderRadius: 0,
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navPill: {
    width: "30%",
    borderRadius: 999,
    paddingVertical: 8,
    backgroundColor: "transparent",
    alignItems: "center",
    marginHorizontal: 4,
  },
  navPillActive: {
    backgroundColor: "#3f8efc",
  },
  navPillText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#29486f",
  },
  gridIconWrap: {
    width: 18,
    height: 18,
    marginBottom: 3,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
  },
  iconSquare: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: "#29486f",
  },
  iconSquareActive: {
    backgroundColor: "#ffffff",
  },
  slidersWrap: {
    width: 18,
    height: 18,
    marginBottom: 3,
    justifyContent: "space-between",
  },
  sliderLine: {
    height: 2,
    borderRadius: 2,
    backgroundColor: "#29486f",
    position: "relative",
  },
  sliderLineActive: {
    backgroundColor: "#ffffff",
  },
  sliderDot: {
    position: "absolute",
    top: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#29486f",
  },
  sliderDotActive: {
    backgroundColor: "#ffffff",
  },
  sliderDotTop: {
    left: 2,
  },
  sliderDotMid: {
    left: 9,
  },
  sliderDotBottom: {
    left: 5,
  },
  navPillTextActive: {
    color: "#ffffff",
  },
  navIconGlyph: {
    fontSize: 14,
    fontWeight: "900",
    color: "#29486f",
    marginBottom: 2,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12, 20, 34, 0.3)",
    zIndex: 40,
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "70%",
    zIndex: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#dce8fb",
  },
  sheetContent: {
    padding: 14,
    paddingBottom: 26,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#17243b",
    marginBottom: 10,
  },
  sheetStats: {
    fontSize: 13,
    fontWeight: "800",
    color: "#445b7a",
  },
  delayLabel: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "900",
    color: "#2c466c",
  },
  settingsActions: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  pillBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d6e7ff",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  pillBtnActive: {
    backgroundColor: "#d6f3e0",
    borderColor: "#8ed2a4",
  },
  favoritePillBtnActive: {
    backgroundColor: "#ffeab3",
    borderColor: "#ffcf58",
  },
  pillBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2f46",
  },
  pillBtnTextActive: {
    color: "#14532d",
  },
  favoritePillBtnTextActive: {
    color: "#6f4d00",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  categoryChip: {
    width: "48%",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginHorizontal: "1%",
    marginBottom: 8,
    backgroundColor: "#f7fbff",
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
});
