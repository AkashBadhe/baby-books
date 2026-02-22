import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categoryCards } from "../src/slides.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "public", "assets", "cards");

function escapeSvgText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function cardSvg(card) {
  const title = escapeSvgText(card.title);
  const value = escapeSvgText(card.value);
  const subtitle = escapeSvgText(card.subtitle);
  const emoji = escapeSvgText(card.emoji || "");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${card.colors[0]}"/>
      <stop offset="100%" stop-color="${card.colors[1]}"/>
    </linearGradient>
  </defs>
  <rect width="640" height="640" rx="46" fill="url(#g)"/>
  <rect x="24" y="24" width="592" height="592" rx="34" fill="rgba(255,255,255,0.35)"/>
  <text x="320" y="220" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="170" font-weight="900" fill="#0f172a">${value}</text>
  <text x="320" y="330" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Segoe UI, Arial, sans-serif" font-size="92" fill="#0f172a">${emoji}</text>
  <text x="320" y="435" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="54" font-weight="800" fill="#0f172a">${title}</text>
  <text x="320" y="500" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" fill="#0f172a" opacity="0.78">${subtitle}</text>
</svg>`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  await ensureDir(outDir);
  let total = 0;

  for (const [categoryId, cards] of Object.entries(categoryCards)) {
    const categoryDir = path.join(outDir, categoryId);
    await ensureDir(categoryDir);
    for (const card of cards) {
      const filePath = path.join(categoryDir, `${card.id}.svg`);
      await fs.writeFile(filePath, cardSvg(card), "utf8");
      total += 1;
    }
  }

  console.log(`Generated ${total} local card SVG assets in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
