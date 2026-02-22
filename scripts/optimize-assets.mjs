import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { optimize as optimizeSvg } from "svgo";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targetDirs = [
  path.join(rootDir, "public", "assets"),
  path.join(rootDir, "public", "icons"),
];

const cacheFile = path.join(rootDir, ".asset-optimize-cache.json");
const rasterExts = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const maxDimension = 1280;

function sha1(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readCache() {
  try {
    const raw = await fs.readFile(cacheFile, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeCache(cache) {
  await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2), "utf8");
}

async function listFilesRecursive(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await listFilesRecursive(fullPath));
      continue;
    }
    if (entry.isFile()) out.push(fullPath);
  }
  return out;
}

function rel(filePath) {
  return path.relative(rootDir, filePath).replaceAll("\\", "/");
}

function shouldSkip(fileHash, cacheEntry) {
  return Boolean(cacheEntry && cacheEntry.hash === fileHash);
}

function createStats() {
  return {
    checked: 0,
    skipped: 0,
    updated: 0,
    svgOptimized: 0,
    rasterOptimized: 0,
    bytesBefore: 0,
    bytesAfter: 0,
  };
}

async function optimizeSvgFile(filePath, input) {
  const result = optimizeSvg(input.toString("utf8"), {
    path: filePath,
    multipass: true,
    plugins: ["preset-default"],
  });
  return Buffer.from(result.data, "utf8");
}

async function optimizeRasterFile(filePath, input) {
  const ext = path.extname(filePath).toLowerCase();
  const image = sharp(input, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const needsResize = Boolean(
    meta.width && meta.height && (meta.width > maxDimension || meta.height > maxDimension),
  );

  if (needsResize) {
    image.resize({
      width: maxDimension,
      height: maxDimension,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (ext === ".jpg" || ext === ".jpeg") {
    image.jpeg({ quality: 80, mozjpeg: true });
  } else if (ext === ".png") {
    image.png({ compressionLevel: 9, palette: true, quality: 80, effort: 10 });
  } else if (ext === ".webp") {
    image.webp({ quality: 80, effort: 6 });
  } else if (ext === ".avif") {
    image.avif({ quality: 50, effort: 6 });
  }

  return { output: await image.toBuffer(), needsResize };
}

async function processFile(filePath, cache, nextCache, stats) {
  const relativePath = rel(filePath);
  const input = await fs.readFile(filePath);
  const inputHash = sha1(input);
  stats.checked += 1;

  if (shouldSkip(inputHash, cache[relativePath])) {
    stats.skipped += 1;
    nextCache[relativePath] = cache[relativePath];
    return;
  }

  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".svg") {
    const output = await optimizeSvgFile(filePath, input);
    const shouldWrite = output.length < input.length;
    const finalBuffer = shouldWrite ? output : input;

    if (shouldWrite) {
      await fs.writeFile(filePath, finalBuffer);
      stats.updated += 1;
      stats.svgOptimized += 1;
      stats.bytesBefore += input.length;
      stats.bytesAfter += finalBuffer.length;
    }

    nextCache[relativePath] = {
      hash: sha1(finalBuffer),
      size: finalBuffer.length,
      type: "svg",
    };
    return;
  }

  if (rasterExts.has(ext)) {
    const { output, needsResize } = await optimizeRasterFile(filePath, input);
    const shouldWrite = needsResize || output.length < input.length;
    const finalBuffer = shouldWrite ? output : input;

    if (shouldWrite) {
      await fs.writeFile(filePath, finalBuffer);
      stats.updated += 1;
      stats.rasterOptimized += 1;
      stats.bytesBefore += input.length;
      stats.bytesAfter += finalBuffer.length;
    }

    nextCache[relativePath] = {
      hash: sha1(finalBuffer),
      size: finalBuffer.length,
      type: "raster",
    };
    return;
  }

  nextCache[relativePath] = {
    hash: inputHash,
    size: input.length,
    type: "other",
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

async function main() {
  const cache = await readCache();
  const nextCache = {};
  const stats = createStats();

  for (const dir of targetDirs) {
    if (!await pathExists(dir)) continue;
    const files = await listFilesRecursive(dir);
    for (const filePath of files) {
      await processFile(filePath, cache, nextCache, stats);
    }
  }

  await writeCache(nextCache);

  const savedBytes = Math.max(0, stats.bytesBefore - stats.bytesAfter);
  console.log("Asset optimization completed.");
  console.log(`Checked: ${stats.checked}, skipped (cache): ${stats.skipped}, updated: ${stats.updated}`);
  console.log(`SVG optimized: ${stats.svgOptimized}, raster optimized: ${stats.rasterOptimized}`);
  console.log(`Bytes before: ${formatBytes(stats.bytesBefore)}, after: ${formatBytes(stats.bytesAfter)}, saved: ${formatBytes(savedBytes)}`);
}

main().catch((error) => {
  console.error("Asset optimization failed:", error);
  process.exit(1);
});
