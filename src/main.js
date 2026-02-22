import "./styles.css";
import { wrapIndex, detectSwipe } from "./logic.js";
import { categoryCards, categoryDefinitions, categoryOrder } from "./slides.js";
import { chooseVoice, speakText } from "./voice.js";
import twemoji from "twemoji";

const TWEMOJI_BASE = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/";
const STORAGE_RECENT_CATEGORIES = "kids_card_book_recent_categories_v1";
const STORAGE_LAST_CATEGORY = "kids_card_book_last_category_v1";
const STORAGE_CATEGORY_LAST_INDEX = "kids_card_book_category_last_index_v1";
const STORAGE_CATEGORY_VIEWED_IDS = "kids_card_book_category_viewed_ids_v1";
const STORAGE_FAVORITES = "kids_card_book_favorites_v1";
const SETTINGS_UNLOCK_WINDOW_MS = 30000;

const els = {
  card: document.getElementById("card"),
  cardImage: document.getElementById("cardImage"),
  letter: document.getElementById("letter"),
  emoji: document.getElementById("emoji"),
  word: document.getElementById("word"),
  sub: document.getElementById("sub"),
  bg: document.getElementById("bg"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsPanel: document.getElementById("settingsPanel"),
  categoryBtn: document.getElementById("categoryBtn"),
  recentBtn: document.getElementById("recentBtn"),
  categoryOverlay: document.getElementById("categoryOverlay"),
  categoryGrid: document.getElementById("categoryGrid"),
  categoryCloseBtn: document.getElementById("categoryCloseBtn"),
  overallStatsValue: document.getElementById("overallStatsValue"),
  currentStatsValue: document.getElementById("currentStatsValue"),
  favoriteStatsValue: document.getElementById("favoriteStatsValue"),
  fullscreenBtn: document.getElementById("fullscreenBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  playBtn: document.getElementById("playBtn"),
  swipeBtn: document.getElementById("swipeBtn"),
  voiceBtn: document.getElementById("voiceBtn"),
  musicBtn: document.getElementById("musicBtn"),
  favoriteBtn: document.getElementById("favoriteBtn"),
  speed: document.getElementById("speed"),
  speedLabel: document.getElementById("speedLabel"),
  tapZone: document.getElementById("tapZone"),
};

const state = {
  index: 0,
  category: "alphabet",
  autoplay: false,
  timer: null,
  voiceOn: false,
  swipeOn: true,
  preferredVoice: null,
  touchStartX: 0,
  touchStartY: 0,
  touchMoved: false,
  touchDragging: false,
  suppressTapUntil: 0,
  audioCtx: null,
  musicOn: false,
  musicTimer: null,
  twemojiReady: false,
  categoryPickerOpen: false,
  recentCategories: [],
  imageRequestId: 0,
  audioRequestId: 0,
  activeAudio: null,
  settingsUnlocked: true,
  categoryLastIndex: {},
  categoryViewedIds: {},
  favorites: [],
  transitionDirection: "next",
  hasRenderedCard: false,
};

const audioAvailabilityCache = new Map();
let settingsRelockTimer = null;
let settingsToggleDebounceUntil = 0;

function activeSlides() {
  return categoryCards[state.category] || categoryCards.alphabet;
}

function currentCategoryMeta() {
  return categoryDefinitions.find((item) => item.id === state.category) || categoryDefinitions[0];
}

function categoryMetaById(categoryId) {
  return categoryDefinitions.find((item) => item.id === categoryId) || null;
}

function saveCategoryLastIndex() {
  try {
    localStorage.setItem(STORAGE_CATEGORY_LAST_INDEX, JSON.stringify(state.categoryLastIndex));
  } catch {
    // Ignore storage failures.
  }
}

function loadCategoryLastIndex() {
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORY_LAST_INDEX);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out = {};
    for (const [categoryId, value] of Object.entries(parsed)) {
      if (!categoryCards[categoryId]) continue;
      const n = Number(value);
      if (!Number.isFinite(n)) continue;
      out[categoryId] = Math.max(0, Math.trunc(n));
    }
    return out;
  } catch {
    return {};
  }
}

function saveCategoryViewedIds() {
  try {
    localStorage.setItem(STORAGE_CATEGORY_VIEWED_IDS, JSON.stringify(state.categoryViewedIds));
  } catch {
    // Ignore storage failures.
  }
}

function loadCategoryViewedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_CATEGORY_VIEWED_IDS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out = {};
    for (const [categoryId, ids] of Object.entries(parsed)) {
      if (!categoryCards[categoryId] || !Array.isArray(ids)) continue;
      const validIds = ids
        .map((id) => String(id))
        .filter((id) => categoryCards[categoryId].some((card) => card.id === id));
      out[categoryId] = [...new Set(validIds)];
    }
    return out;
  } catch {
    return {};
  }
}

function categoryViewedCount(categoryId) {
  return (state.categoryViewedIds[categoryId] || []).length;
}

function cardFavoriteKey(categoryId, cardId) {
  return `${categoryId}:${cardId}`;
}

function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(state.favorites));
  } catch {
    // Ignore storage failures.
  }
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((item) => String(item)))];
  } catch {
    return [];
  }
}

function isCurrentCardFavorite() {
  const card = activeSlides()[state.index];
  if (!card) return false;
  return state.favorites.includes(cardFavoriteKey(state.category, card.id));
}

function favoriteCountForCategory(categoryId) {
  const prefix = `${categoryId}:`;
  return state.favorites.filter((key) => key.startsWith(prefix)).length;
}

function totalCardsCount() {
  return Object.values(categoryCards).reduce((sum, cards) => sum + cards.length, 0);
}

function totalViewedCount() {
  return categoryDefinitions.reduce((sum, category) => sum + categoryViewedCount(category.id), 0);
}

function totalFavoritesCount() {
  return state.favorites.length;
}

function updateStatsDashboard() {
  const currentViewed = categoryViewedCount(state.category);
  const currentTotal = activeSlides().length;
  const overallViewed = totalViewedCount();
  const overallTotal = totalCardsCount();
  els.overallStatsValue.textContent = `${overallViewed}/${overallTotal}`;
  els.currentStatsValue.textContent = `${currentViewed}/${currentTotal}`;
  els.favoriteStatsValue.textContent = String(totalFavoritesCount());
}

function updateFavoriteButton() {
  const active = isCurrentCardFavorite();
  els.favoriteBtn.textContent = active ? "Favorite: ON" : "Favorite: OFF";
  els.favoriteBtn.classList.toggle("active", active);
}

function persistCategoryProgress(card) {
  state.categoryLastIndex[state.category] = state.index;
  const existingIds = state.categoryViewedIds[state.category] || [];
  if (!existingIds.includes(card.id)) {
    state.categoryViewedIds[state.category] = [...existingIds, card.id];
    saveCategoryViewedIds();
  }
  saveCategoryLastIndex();
}

function saveRecentCategories() {
  try {
    localStorage.setItem(STORAGE_RECENT_CATEGORIES, JSON.stringify(state.recentCategories));
  } catch {
    // Ignore storage failures.
  }
}

function loadRecentCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_CATEGORIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => Boolean(categoryCards[id])).slice(0, 8);
  } catch {
    return [];
  }
}

function markCategoryRecent(categoryId) {
  state.recentCategories = [
    categoryId,
    ...state.recentCategories.filter((id) => id !== categoryId),
  ].slice(0, 8);
  saveRecentCategories();
}

function findRecentShortcutCategory() {
  return state.recentCategories.find((id) => id !== state.category) || null;
}

function setCategory(nextCategoryIdValue, resetIndex = true) {
  if (!categoryCards[nextCategoryIdValue]) return;
  state.category = nextCategoryIdValue;
  state.index = 0;
  markCategoryRecent(nextCategoryIdValue);
  try {
    localStorage.setItem(STORAGE_LAST_CATEGORY, nextCategoryIdValue);
  } catch {
    // Ignore storage failures.
  }
  updateCategoryButton();
  updateRecentButton();
  renderCategoryGrid();
  updateStatsDashboard();
  updateUI();
}

const lullaby = [
  261.63, 329.63, 392.0, 329.63,
  293.66, 369.99, 440.0, 369.99,
  261.63, 329.63, 392.0, 329.63,
  246.94, 311.13, 392.0, 311.13,
];

const highContrastLetterColors = [
  "#0f2a8a",
  "#7a1027",
  "#0f5e35",
  "#5a2a7d",
  "#6a4300",
  "#101010",
  "#ffffff",
];

const emojiHtmlCache = new Map();

function parseEmojiToHtml(text) {
  if (emojiHtmlCache.has(text)) return emojiHtmlCache.get(text);

  const html = twemoji.parse(text, {
    folder: "svg",
    ext: ".svg",
    base: TWEMOJI_BASE,
    className: "twemoji",
  });
  emojiHtmlCache.set(text, html);
  return html;
}

function extractImageUrls(html) {
  const urls = [];
  const matches = html.matchAll(/src="([^"]+)"/g);
  for (const match of matches) {
    if (match[1]) urls.push(match[1]);
  }
  return urls;
}

function preloadTwemojiAssets() {
  const emojiTexts = [
    ...Object.values(categoryCards).flat().map((slide) => slide.emoji),
  ];

  const uniqueUrls = new Set();
  for (const text of emojiTexts) {
    const html = parseEmojiToHtml(text);
    for (const url of extractImageUrls(html)) uniqueUrls.add(url);
  }

  const preloadTasks = [...uniqueUrls].map((url) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  }));

  Promise.all(preloadTasks).finally(() => {
    state.twemojiReady = true;
    updateUI();
  });
}

function escapeSvgText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function generatedCardImageDataUri(card) {
  const label = escapeSvgText(card.title);
  const value = escapeSvgText(card.value);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" role="img" aria-label="${label}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${card.colors[0]}"/>
        <stop offset="100%" stop-color="${card.colors[1]}"/>
      </linearGradient>
    </defs>
    <rect width="640" height="640" rx="46" fill="url(#g)"/>
    <rect x="24" y="24" width="592" height="592" rx="34" fill="rgba(255,255,255,0.35)"/>
    <text x="320" y="300" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="180" font-weight="900" fill="#0f172a">${value}</text>
    <text x="320" y="420" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="58" font-weight="800" fill="#0f172a">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function resolveCardImageSrc(card) {
  return card.image || null;
}

function loadCardImage(card) {
  const src = resolveCardImageSrc(card);
  if (!src) {
    els.card.classList.remove("expects-image");
    els.card.classList.remove("image-loading");
    els.card.classList.remove("image-mode");
    els.cardImage.removeAttribute("src");
    els.cardImage.alt = "";
    return;
  }

  const requestId = ++state.imageRequestId;
  els.card.classList.add("expects-image");
  els.card.classList.add("image-loading");
  els.cardImage.alt = `${card.title} card`;
  els.cardImage.onload = () => {
    if (requestId !== state.imageRequestId) return;
    els.card.classList.remove("image-loading");
    els.card.classList.add("image-mode");
  };
  els.cardImage.onerror = () => {
    if (requestId !== state.imageRequestId) return;
    els.card.classList.remove("image-loading");
    els.card.classList.remove("image-mode");
  };
  if (els.cardImage.src === src && els.cardImage.complete && els.cardImage.naturalWidth > 0) {
    els.card.classList.remove("image-loading");
    els.card.classList.add("image-mode");
    return;
  }
  els.cardImage.src = src;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    const r = Number.parseInt(normalized[0] + normalized[0], 16);
    const g = Number.parseInt(normalized[1] + normalized[1], 16);
    const b = Number.parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

function toLinear(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb) {
  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b);
}

function contrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function chooseLetterColor(bgColors) {
  let best = highContrastLetterColors[0];
  let bestScore = 0;

  for (const candidate of highContrastLetterColors) {
    const score = Math.min(
      contrastRatio(candidate, bgColors[0]),
      contrastRatio(candidate, bgColors[1]),
    );
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function setBackground(colors) {
  els.bg.style.background = `
    radial-gradient(circle at 30% 20%, rgba(255,255,255,.9) 0%, rgba(255,255,255,0) 45%),
    radial-gradient(circle at 70% 80%, rgba(255,255,255,.85) 0%, rgba(255,255,255,0) 55%),
    linear-gradient(135deg, ${colors[0]}, ${colors[1]})
  `;
}

function refreshVoices() {
  if (!("speechSynthesis" in window)) return;
  state.preferredVoice = chooseVoice(window.speechSynthesis.getVoices());
}

function stopActiveAudio() {
  if (!state.activeAudio) return;
  try {
    state.activeAudio.pause();
    state.activeAudio.currentTime = 0;
  } catch {
    // Ignore media stop failures.
  }
  state.activeAudio = null;
}

function cancelAllSpeech() {
  stopActiveAudio();
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

async function ensureAudioAvailable(src) {
  if (!src) return false;
  if (audioAvailabilityCache.has(src)) return audioAvailabilityCache.get(src);
  try {
    const response = await fetch(src, { method: "HEAD" });
    const exists = response.ok;
    audioAvailabilityCache.set(src, exists);
    return exists;
  } catch {
    audioAvailabilityCache.set(src, false);
    return false;
  }
}

async function playRecordedAudio(src, requestId) {
  try {
    const audio = new Audio(src);
    audio.preload = "auto";
    state.activeAudio = audio;
    await audio.play();
    if (requestId !== state.audioRequestId || !state.voiceOn) {
      stopActiveAudio();
      return false;
    }
    return true;
  } catch {
    stopActiveAudio();
    return false;
  }
}

function speakCurrentSlide() {
  const s = activeSlides()[state.index];
  void playCardAudioOrSpeech(s);
}

async function playCardAudioOrSpeech(card) {
  if (!state.voiceOn) return;

  const requestId = ++state.audioRequestId;
  cancelAllSpeech();

  if (card.audio) {
    const available = await ensureAudioAvailable(card.audio);
    if (requestId !== state.audioRequestId || !state.voiceOn) return;
    if (available) {
      const played = await playRecordedAudio(card.audio, requestId);
      if (played) return;
    }
  }

  if (requestId !== state.audioRequestId || !state.voiceOn) return;
  speakText(card.audioLabel || card.subtitle || `${card.value} ${card.title}`, {
    voiceOn: state.voiceOn,
    preferredVoice: state.preferredVoice,
  });
}

function updateUI() {
  if (state.categoryPickerOpen) return;
  const s = activeSlides()[state.index];
  const letterColor = chooseLetterColor(s.colors);
  const isLightLetter = contrastRatio(letterColor, "#ffffff") < contrastRatio(letterColor, "#101010");
  const numberMode = state.category === "numbers";
  const alphabetMode = state.category === "alphabet";
  const visualMode = !alphabetMode && !numberMode;
  const duplicatePrimaryLabel = String(s.value).trim().toLowerCase()
    === String(s.title).trim().toLowerCase();

  els.card.classList.toggle("number-mode", numberMode);
  els.card.classList.toggle("alphabet-mode", alphabetMode);
  els.card.classList.toggle("visual-mode", visualMode);

  if (state.hasRenderedCard) {
    els.card.classList.remove("turn-next", "turn-prev");
    void els.card.offsetWidth;
    els.card.classList.add(state.transitionDirection === "prev" ? "turn-prev" : "turn-next");
  }

  els.letter.style.animation = "none";
  els.emoji.style.animation = "none";
  void els.letter.offsetHeight;
  void els.emoji.offsetHeight;
  if (!numberMode) {
    els.letter.style.animation = "pop .55s ease";
    els.emoji.style.animation = "floaty 2.4s ease-in-out infinite";
  }

  els.letter.textContent = s.value;
  els.letter.style.backgroundImage = "none";
  els.letter.style.color = letterColor;
  els.letter.style.textShadow = isLightLetter
    ? "0 3px 0 rgba(16,16,16,.28), 0 10px 22px rgba(0,0,0,.22)"
    : "0 3px 0 rgba(255,255,255,.36), 0 10px 22px rgba(0,0,0,.18)";
  els.word.textContent = s.title;
  els.word.classList.toggle("hidden", duplicatePrimaryLabel && !visualMode);
  if (state.twemojiReady) {
    els.emoji.innerHTML = parseEmojiToHtml(s.emoji);
  } else {
    els.emoji.textContent = s.emoji;
  }
  loadCardImage(s);
  els.sub.textContent = `"${s.subtitle}"`;

  setBackground(s.colors);
  persistCategoryProgress(s);
  updateFavoriteButton();
  renderCategoryGrid();
  updateStatsDashboard();
  speakCurrentSlide();
  state.hasRenderedCard = true;
}

function go(nextIndex, direction = "next") {
  state.transitionDirection = direction;
  state.index = wrapIndex(nextIndex, activeSlides().length);
  updateUI();
}

function orderedCategoryIds() {
  return categoryOrder.filter((id) => (categoryCards[id] || []).length > 0);
}

function nextCategoryId(currentCategoryId) {
  const order = orderedCategoryIds();
  if (order.length === 0) return "alphabet";
  const currentIndex = order.indexOf(currentCategoryId);
  if (currentIndex < 0) return order[0];
  return order[(currentIndex + 1) % order.length];
}

function next() {
  state.transitionDirection = "next";
  if (state.index >= activeSlides().length - 1) {
    setCategory(nextCategoryId(state.category), true);
    return;
  }

  go(state.index + 1, "next");
}

function prev() {
  go(state.index - 1, "prev");
}

function clearSwipeCardTransform() {
  els.card.style.transform = "";
  els.card.style.opacity = "";
  els.card.style.transition = "";
}

function applySwipeCardDrag(dx) {
  const limitedDx = Math.max(-220, Math.min(220, dx * 0.92));
  const rotate = limitedDx / 28;
  const progress = Math.min(1, Math.abs(limitedDx) / 220);
  const opacity = 1 - progress * 0.33;

  els.card.style.transition = "none";
  els.card.style.transform = `translate3d(${limitedDx}px, 0, 0) rotate(${rotate}deg)`;
  els.card.style.opacity = String(opacity);
}

function settleSwipeCard() {
  els.card.style.transition = "transform 180ms ease, opacity 180ms ease";
  els.card.style.transform = "";
  els.card.style.opacity = "";
  setTimeout(() => {
    if (state.touchDragging) return;
    els.card.style.transition = "";
  }, 220);
}

function animateSwipeCommit(direction) {
  const sign = direction === "left" ? -1 : 1;
  const distance = Math.min(240, Math.max(160, window.innerWidth * 0.34));
  els.card.style.transition = "transform 150ms ease, opacity 150ms ease";
  els.card.style.transform = `translate3d(${sign * distance}px, 0, 0) rotate(${sign * 8}deg)`;
  els.card.style.opacity = "0.32";
}

function setAutoplay(on) {
  state.autoplay = on;
  els.playBtn.textContent = state.autoplay ? "Pause" : "Play";
  els.playBtn.classList.toggle("active", state.autoplay);

  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }

  if (state.autoplay) {
    const seconds = Number(els.speed.value);
    state.timer = setInterval(next, seconds * 1000);
  }
}

function updateSpeedLabel() {
  const seconds = Number(els.speed.value);
  els.speedLabel.textContent = `${seconds}s`;
  if (state.autoplay) setAutoplay(true);
}

function toggleSettings(forceOpen) {
  const open = typeof forceOpen === "boolean"
    ? forceOpen
    : !els.settingsPanel.classList.contains("open");
  console.debug("[settings] toggleSettings", {
    forceOpen,
    computedOpen: open,
    wasOpen: els.settingsPanel.classList.contains("open"),
  });

  els.settingsPanel.classList.toggle("open", open);
  els.settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
  els.settingsBtn.classList.toggle("active", open);
  console.debug("[settings] panel state after toggle", {
    isOpen: els.settingsPanel.classList.contains("open"),
    ariaExpanded: els.settingsBtn.getAttribute("aria-expanded"),
  });
}

function setSettingsUnlocked(unlocked) {
  state.settingsUnlocked = unlocked;
  els.settingsBtn.classList.toggle("locked", !unlocked);
  els.settingsBtn.title = unlocked
    ? "Settings unlocked"
    : "Hold to open settings";
}

function refreshSettingsRelockTimer() {
  if (settingsRelockTimer) clearTimeout(settingsRelockTimer);
  settingsRelockTimer = setTimeout(() => {
    toggleSettings(false);
  }, SETTINGS_UNLOCK_WINDOW_MS);
}

function fullscreenSupported() {
  return Boolean(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled,
  );
}

function isFullscreen() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

async function toggleFullscreen() {
  if (!fullscreenSupported()) return;

  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }

    const root = document.documentElement;
    if (root.requestFullscreen) await root.requestFullscreen();
    else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
  } catch {
    // Some browsers block fullscreen without a direct user gesture.
  }
}

function updateCategoryButton() {
  const meta = currentCategoryMeta();
  els.categoryBtn.textContent = `${meta.icon} ${meta.label}`;
  els.categoryBtn.classList.add("active");
}

function updateRecentButton() {
  const shortcutCategoryId = findRecentShortcutCategory();
  if (!shortcutCategoryId) {
    els.recentBtn.textContent = "Recent: N/A";
    els.recentBtn.disabled = true;
    els.recentBtn.classList.remove("active");
    return;
  }

  const meta = categoryMetaById(shortcutCategoryId);
  if (!meta) {
    els.recentBtn.textContent = "Recent: N/A";
    els.recentBtn.disabled = true;
    els.recentBtn.classList.remove("active");
    return;
  }

  els.recentBtn.disabled = false;
  els.recentBtn.classList.add("active");
  els.recentBtn.textContent = `Recent: ${meta.icon} ${meta.label}`;
}

function updateFullscreenButton() {
  if (!fullscreenSupported()) {
    els.fullscreenBtn.textContent = "Fullscreen: N/A";
    els.fullscreenBtn.disabled = true;
    els.fullscreenBtn.classList.remove("active");
    return;
  }

  els.fullscreenBtn.disabled = false;
  const fullscreenOn = isFullscreen();
  els.fullscreenBtn.textContent = fullscreenOn ? "Fullscreen: ON" : "Fullscreen: OFF";
  els.fullscreenBtn.classList.toggle("active", fullscreenOn);
}

function updateToggleButtons() {
  els.swipeBtn.classList.toggle("active", state.swipeOn);
  els.voiceBtn.classList.toggle("active", state.voiceOn);
  els.musicBtn.classList.toggle("active", state.musicOn);
}

function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;
  const swUrl = `${import.meta.env.BASE_URL}sw.js`;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl, { updateViaCache: "none" }).catch(() => {
      // Ignore service worker registration errors.
    });
  });
}

function cleanupServiceWorkerInDev() {
  if (import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(
      registrations.map((registration) => registration.unregister()),
    )).catch(() => {
      // Ignore service worker cleanup errors in development.
    });

    if ("caches" in window) {
      caches.keys().then((keys) => Promise.all(
        keys.map((key) => caches.delete(key)),
      )).catch(() => {
        // Ignore cache cleanup errors in development.
      });
    }
  });
}

function openCategoryPicker(open) {
  state.categoryPickerOpen = open;
  if (open) toggleSettings(false);
  els.categoryOverlay.classList.toggle("open", open);
  els.categoryOverlay.setAttribute("aria-hidden", open ? "false" : "true");
  if (!open) updateUI();
}

function renderCategoryGrid() {
  els.categoryGrid.innerHTML = "";
  for (const category of categoryDefinitions) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "categoryCard";
    if (category.id === state.category) btn.classList.add("active");
    btn.setAttribute("aria-label", `Open ${category.label} category`);
    btn.innerHTML = `
      <span class="categoryCardIcon" aria-hidden="true">${category.icon}</span>
      <span class="categoryCardLabel">${category.label}</span>
      <span class="categoryCardMeta">${categoryViewedCount(category.id)}/${categoryCards[category.id].length} | ★${favoriteCountForCategory(category.id)}</span>
    `;
    btn.addEventListener("click", () => {
      setCategory(category.id, false);
      openCategoryPicker(false);
      toggleSettings(false);
    });
    els.categoryGrid.appendChild(btn);
  }
}

function ensureAudio() {
  if (state.audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  state.audioCtx = new AC();
}

function playNote(freq, duration = 0.22) {
  if (!state.audioCtx) return;
  const oscillator = state.audioCtx.createOscillator();
  const gain = state.audioCtx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = freq;
  gain.gain.value = 0.0001;

  oscillator.connect(gain);
  gain.connect(state.audioCtx.destination);

  const now = state.audioCtx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function startMusic() {
  ensureAudio();
  if (!state.audioCtx) return;
  if (state.audioCtx.state === "suspended") state.audioCtx.resume();

  let step = 0;
  stopMusic();
  state.musicTimer = setInterval(() => {
    playNote(lullaby[step % lullaby.length], 0.22);
    step += 1;
  }, 280);
}

function stopMusic() {
  if (!state.musicTimer) return;
  clearInterval(state.musicTimer);
  state.musicTimer = null;
}

function requestSettingsToggle(e) {
  e.stopPropagation();
  if (typeof e.preventDefault === "function") e.preventDefault();

  const now = performance.now();
  if (now < settingsToggleDebounceUntil) return;
  settingsToggleDebounceUntil = now + 250;

  console.debug("[settings] settingsBtn toggle request", {
    type: e.type,
    targetId: e.target?.id || e.target?.className || "unknown",
  });
  toggleSettings();
}

els.settingsBtn.addEventListener("click", requestSettingsToggle);
els.settingsBtn.addEventListener("pointerup", requestSettingsToggle);
els.settingsBtn.addEventListener("touchend", requestSettingsToggle, { passive: false });

els.settingsPanel.addEventListener("click", (e) => {
  e.stopPropagation();
  console.debug("[settings] settingsPanel click", {
    type: e.type,
    targetId: e.target?.id || e.target?.className || "unknown",
  });
  refreshSettingsRelockTimer();
});
els.categoryBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  openCategoryPicker(true);
});
els.recentBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const shortcutCategoryId = findRecentShortcutCategory();
  if (!shortcutCategoryId) return;
  setCategory(shortcutCategoryId, true);
  toggleSettings(false);
});
els.categoryCloseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  openCategoryPicker(false);
});
els.categoryOverlay.addEventListener("click", (e) => {
  if (e.target === els.categoryOverlay) openCategoryPicker(false);
});
els.fullscreenBtn.addEventListener("click", async (e) => {
  e.stopPropagation();
  await toggleFullscreen();
  updateFullscreenButton();
});
els.prevBtn.addEventListener("click", (e) => { e.stopPropagation(); prev(); });
els.nextBtn.addEventListener("click", (e) => { e.stopPropagation(); next(); });
els.playBtn.addEventListener("click", (e) => { e.stopPropagation(); setAutoplay(!state.autoplay); });

els.swipeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  state.swipeOn = !state.swipeOn;
  els.swipeBtn.textContent = state.swipeOn ? "Swipe: ON" : "Swipe: OFF";
  if (!state.swipeOn) clearSwipeCardTransform();
  updateToggleButtons();
});

els.voiceBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  state.voiceOn = !state.voiceOn;
  els.voiceBtn.textContent = state.voiceOn ? "Voice: ON" : "Voice: OFF";
  updateToggleButtons();

  if (!state.voiceOn) cancelAllSpeech();
  if (state.voiceOn) speakCurrentSlide();
});

els.musicBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  state.musicOn = !state.musicOn;
  els.musicBtn.textContent = state.musicOn ? "Music: ON" : "Music: OFF";
  updateToggleButtons();
  if (state.musicOn) startMusic();
  else stopMusic();
});
els.favoriteBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const card = activeSlides()[state.index];
  if (!card) return;
  const key = cardFavoriteKey(state.category, card.id);
  if (state.favorites.includes(key)) {
    state.favorites = state.favorites.filter((item) => item !== key);
  } else {
    state.favorites = [...state.favorites, key];
  }
  saveFavorites();
  updateFavoriteButton();
  renderCategoryGrid();
  updateStatsDashboard();
  refreshSettingsRelockTimer();
});

els.speed.addEventListener("input", (e) => {
  e.stopPropagation();
  updateSpeedLabel();
});

els.tapZone.addEventListener("click", () => {
  if (state.categoryPickerOpen) return;
  if (Date.now() < state.suppressTapUntil) return;
  if (state.audioCtx && state.audioCtx.state === "suspended") state.audioCtx.resume();
  next();
});

els.tapZone.addEventListener("touchstart", (e) => {
  if (!state.swipeOn || !e.touches || e.touches.length !== 1) return;
  state.touchStartX = e.touches[0].clientX;
  state.touchStartY = e.touches[0].clientY;
  state.touchMoved = false;
  state.touchDragging = true;
}, { passive: true });

els.tapZone.addEventListener("touchmove", (e) => {
  if (!state.swipeOn || !e.touches || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - state.touchStartX;
  const dy = e.touches[0].clientY - state.touchStartY;
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) state.touchMoved = true;
  if (Math.abs(dx) <= Math.abs(dy)) return;
  applySwipeCardDrag(dx);
}, { passive: true });

els.tapZone.addEventListener("touchend", (e) => {
  if (!state.swipeOn || !e.changedTouches || e.changedTouches.length !== 1) {
    state.touchDragging = false;
    clearSwipeCardTransform();
    return;
  }

  state.touchDragging = false;
  if (!state.touchMoved) {
    settleSwipeCard();
    return;
  }

  const direction = detectSwipe({
    startX: state.touchStartX,
    startY: state.touchStartY,
    endX: e.changedTouches[0].clientX,
    endY: e.changedTouches[0].clientY,
  });

  if (!direction) {
    settleSwipeCard();
    return;
  }

  animateSwipeCommit(direction);
  state.suppressTapUntil = Date.now() + 320;
  setTimeout(() => {
    clearSwipeCardTransform();
    if (direction === "left") next();
    if (direction === "right") prev();
  }, 155);
}, { passive: true });

els.tapZone.addEventListener("touchcancel", () => {
  state.touchDragging = false;
  settleSwipeCard();
}, { passive: true });

window.addEventListener("keydown", (e) => {
  if (state.categoryPickerOpen && e.key === "Escape") {
    openCategoryPicker(false);
    return;
  }
  if (e.key === "ArrowRight" || e.key === " ") next();
  if (e.key === "ArrowLeft") prev();
  if (e.key.toLowerCase() === "p") setAutoplay(!state.autoplay);
  if (e.key === "Escape") toggleSettings(false);
});

function handleOutsideSettingsInteraction(e) {
  console.debug("[settings] document interaction", {
    type: e.type,
    panelCurrentlyOpen: els.settingsPanel.classList.contains("open"),
    targetId: e.target?.id || e.target?.className || "unknown",
    insidePanel: els.settingsPanel.contains(e.target),
    insideButton: els.settingsBtn.contains(e.target),
  });
  if (!els.settingsPanel.classList.contains("open")) return;
  if (els.settingsPanel.contains(e.target) || els.settingsBtn.contains(e.target)) return;
  console.debug("[settings] closing panel from outside interaction");
  toggleSettings(false);
}

document.addEventListener("pointerdown", handleOutsideSettingsInteraction, true);
document.addEventListener("click", handleOutsideSettingsInteraction, true);

if ("speechSynthesis" in window) {
  refreshVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

document.addEventListener("fullscreenchange", updateFullscreenButton);
document.addEventListener("webkitfullscreenchange", updateFullscreenButton);

state.recentCategories = loadRecentCategories();
state.categoryLastIndex = loadCategoryLastIndex();
state.categoryViewedIds = loadCategoryViewedIds();
state.favorites = loadFavorites();
const savedCategory = (() => {
  try {
    return localStorage.getItem(STORAGE_LAST_CATEGORY);
  } catch {
    return null;
  }
})();
if (savedCategory && categoryCards[savedCategory]) {
  state.category = savedCategory;
}
state.index = 0;
markCategoryRecent(state.category);

updateSpeedLabel();
updateCategoryButton();
updateRecentButton();
updateFullscreenButton();
updateToggleButtons();
setAutoplay(false);
renderCategoryGrid();
updateStatsDashboard();
openCategoryPicker(false);
updateUI();
preloadTwemojiAssets();
cleanupServiceWorkerInDev();
registerServiceWorker();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAllSpeech();
    toggleSettings(false);
  }
});

setSettingsUnlocked(true);
