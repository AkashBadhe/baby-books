import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, SafeAreaView, StyleSheet, Text, View, Platform, StatusBar as RNStatusBar, ScrollView, useWindowDimensions } from "react-native";
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
  if (categoryId === "sizes") return false;
  return /^(this is|these are)\b/i.test(subtitle.trim());
}

function totalCardsCount(categories, cardsByCategory) {
  return categories.reduce((sum, category) => sum + (cardsByCategory[category.id]?.length || 0), 0);
}

function hexToRgb(hex) {
  if (typeof hex !== "string") return null;
  const clean = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const n = Number.parseInt(clean, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function rgbToHex({ r, g, b }) {
  const to2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hp >= 1 && hp < 2) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hp >= 2 && hp < 3) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hp >= 3 && hp < 4) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hp >= 4 && hp < 5) {
    r1 = x; g1 = 0; b1 = c;
  } else {
    r1 = c; g1 = 0; b1 = x;
  }

  const m = l - c / 2;
  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

function softenColorForBabies(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);

  // Keep backgrounds calm: moderate saturation and bright/pastel lightness.
  const safeHsl = {
    h: hsl.h,
    s: Math.min(hsl.s, 0.35),
    l: Math.max(0.82, Math.min(hsl.l, 0.92)),
  };

  return rgbToHex(hslToRgb(safeHsl));
}

function swatchColorById(cardId) {
  const swatches = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#facc15",
    purple: "#a855f7",
    orange_color: "#f97316",
    black: "#1f2937",
    white: "#ffffff",
    pink: "#ec4899",
    brown: "#8b5e34",
  };
  return swatches[cardId] || "#94a3b8";
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

function CardViewer({ categoryId, card, imageUri, onPrev, onNext, transitionDirection = 1 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const previousCardKey = useRef(null);

  const alphabetMode = categoryId === "alphabet";
  const numberMode = categoryId === "numbers";
  const colorMode = categoryId === "colors";
  const visualMode = !alphabetMode && !numberMode;
  const isWeb = Platform.OS === "web";
  const rectangleShapeMode = categoryId === "shapes" && card?.id === "rectangle";
  const showSubtitle = !shouldHideSubtitle(categoryId, card?.subtitle);
  const visualEmojiSize = Math.max(isWeb ? 120 : 138, Math.round(Math.min(viewportWidth, viewportHeight) * (isWeb ? 0.22 : 0.24)));
  const visualTitleSize = Math.max(isWeb ? 34 : 38, Math.round(viewportWidth * (isWeb ? 0.064 : 0.075)));

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri, card?.id]);

  useEffect(() => {
    const currentKey = `${categoryId}:${card?.id || "none"}`;
    if (previousCardKey.current === null) {
      previousCardKey.current = currentKey;
      return;
    }
    if (previousCardKey.current === currentKey) return;
    previousCardKey.current = currentKey;

    cardOpacity.setValue(0);
    cardTranslateX.setValue((transitionDirection || 1) * 20);
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateX, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [card?.id, cardOpacity, cardTranslateX, categoryId, transitionDirection]);

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
      <Animated.View
        style={[
          styles.card,
          visualMode && styles.cardVisual,
          {
            opacity: cardOpacity,
            transform: [{ translateX: cardTranslateX }],
          },
        ]}
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
        {(alphabetMode || numberMode) && (
          <View style={styles.valueSlot}>
            <Text style={styles.value}>{card.value}</Text>
          </View>
        )}

        <View style={visualMode ? [styles.visualMediaWrap, !isWeb && styles.visualMediaWrapMobile] : [styles.mediaWrap, styles.classicMediaWrap]}>
          {colorMode ? (
            <View style={[styles.colorSwatchCircle, { backgroundColor: swatchColorById(card?.id) }]} />
          ) : !imageFailed && imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={visualMode ? styles.cardImageLarge : styles.cardImage}
              resizeMode="contain"
              onError={() => setImageFailed(true)}
            />
          ) : rectangleShapeMode ? (
            <View style={styles.rectangleShape} />
          ) : (
            <Text
              style={[
                visualMode ? styles.emojiLarge : styles.emoji,
                visualMode && { fontSize: visualEmojiSize },
                numberMode && styles.numberEmoji,
              ]}
            >
              {card.emoji}
            </Text>
          )}
        </View>

        <View style={[styles.textSlot, visualMode && styles.textSlotVisual]}>
          <Text style={[visualMode ? styles.titleVisual : styles.title, visualMode && { fontSize: visualTitleSize }]}>{card.title}</Text>
          {showSubtitle && <Text style={styles.subtitle}>{card.subtitle}</Text>}
        </View>
      </Animated.View>

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
  const [transitionDirection, setTransitionDirection] = useState(1);

  const cards = useMemo(() => cardsByCategory[selectedCategory] || [], [cardsByCategory, selectedCategory]);
  const normalizedIndex = useMemo(() => wrapIndex(currentIndex, cards.length || 1), [currentIndex, cards.length]);
  const card = cards[normalizedIndex] || null;
  const imageUri = useMemo(() => resolveCardImageUri(selectedCategory, card), [card, resolveCardImageUri, selectedCategory]);
  const isFavorite = card ? favorites.includes(favoriteKey(selectedCategory, card.id)) : false;

  const bgColors = useMemo(() => {
    const fallback = ["#fde7ef", "#e9f6ff"];
    if (!card?.colors || card.colors.length < 2) return fallback;
    return [softenColorForBabies(card.colors[0]), softenColorForBabies(card.colors[1])];
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
      setTransitionDirection(1);
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
        setTransitionDirection(step >= 0 ? 1 : -1);
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

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return undefined;

    const isEditableTarget = (target) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const onKeyDown = (event) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key;
      const normalized = typeof key === "string" ? key.toLowerCase() : "";

      if (key === "Escape") {
        if (categoryPickerOpen) {
          event.preventDefault();
          setCategoryPickerOpen(false);
          return;
        }
        if (settingsOpen) {
          event.preventDefault();
          setSettingsOpen(false);
        }
        return;
      }

      if (key === "ArrowLeft") {
        event.preventDefault();
        onPrev();
        return;
      }

      if (key === "ArrowRight") {
        event.preventDefault();
        onNext();
        return;
      }

      if (key === " " || key === "Spacebar" || key === "Space") {
        event.preventDefault();
        onNext();
        return;
      }

      if (normalized === "p") {
        event.preventDefault();
        setAutoplay((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [categoryPickerOpen, onNext, onPrev, settingsOpen]);

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
        transitionDirection={transitionDirection}
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
  cardVisual: {
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  value: {
    fontSize: 106,
    fontWeight: "900",
    color: "#141d30",
    lineHeight: 110,
    marginBottom: 0,
    textAlign: "center",
    includeFontPadding: false,
  },
  valueSlot: {
    width: "100%",
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 74,
    marginVertical: 10,
    textAlign: "center",
  },
  numberEmoji: {
    width: "100%",
    maxWidth: "92%",
    fontSize: 62,
    lineHeight: 74,
    includeFontPadding: false,
  },
  emojiLarge: {
    fontSize: 132,
    marginVertical: 6,
  },
  mediaWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  classicMediaWrap: {
    minHeight: 170,
  },
  visualMediaWrap: {
    flex: 1,
    width: "100%",
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  visualMediaWrapMobile: {
    minHeight: 280,
  },
  rectangleShape: {
    width: "88%",
    aspectRatio: 2.9,
    minHeight: 120,
    maxHeight: 220,
    backgroundColor: "rgba(23, 36, 59, 0.28)",
    borderWidth: 4,
    borderColor: "rgba(23, 36, 59, 0.5)",
  },
  colorSwatchCircle: {
    width: "70%",
    aspectRatio: 1,
    maxWidth: 280,
    borderRadius: 999,
    borderWidth: 8,
    borderColor: "rgba(23, 36, 59, 0.12)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  cardImage: {
    width: "74%",
    height: "34%",
    marginVertical: 10,
  },
  cardImageLarge: {
    width: "100%",
    height: "100%",
    marginVertical: 4,
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
    marginTop: 6,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "700",
    color: "#2f4b73",
    textAlign: "center",
  },
  textSlot: {
    width: "100%",
    minHeight: 76,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  textSlotVisual: {
    minHeight: 92,
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
