import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categoryDefinitions, categoryCards } from "../src/slides.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outPath = path.join(rootDir, "apps", "mobile", "src", "content.generated.json");
const publicPhotosDir = path.join(rootDir, "public", "assets", "photos");
const mobilePhotosDir = path.join(rootDir, "apps", "mobile", "assets", "photos");
const localImageAssetsPath = path.join(rootDir, "apps", "mobile", "src", "localImageAssets.js");

const payload = {
  generatedAt: new Date().toISOString(),
  categoryDefinitions,
  categoryCards,
};

function toPosixPath(value) {
  return value.replaceAll(path.sep, "/");
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function listSubdirectories(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function listImageFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(png|jpg|jpeg|webp)$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function copyPhotoAssets() {
  await fs.rm(mobilePhotosDir, { recursive: true, force: true });
  await ensureDir(mobilePhotosDir);
  await fs.cp(publicPhotosDir, mobilePhotosDir, { recursive: true });
}

async function generateLocalImageAssetsModule() {
  const categoryDirs = await listSubdirectories(mobilePhotosDir);
  const categoryBlocks = [];

  for (const categoryId of categoryDirs) {
    const categoryDir = path.join(mobilePhotosDir, categoryId);
    const imageFiles = await listImageFiles(categoryDir);
    if (imageFiles.length === 0) continue;

    const entries = imageFiles.map((fileName) => {
      const cardId = path.parse(fileName).name;
      const requirePath = toPosixPath(path.relative(path.dirname(localImageAssetsPath), path.join(categoryDir, fileName)));
      return `    ${JSON.stringify(cardId)}: require(${JSON.stringify(requirePath)}),`;
    });

    categoryBlocks.push(`  ${JSON.stringify(categoryId)}: {\n${entries.join("\n")}\n  },`);
  }

  const moduleSource = `import { Asset } from "expo-asset";\n\nconst bundledCardImages = {\n${categoryBlocks.join("\n")}\n};\n\nconst bundledUriCache = new Map();\n\nexport function resolveBundledImageUri(categoryId, cardId) {\n  const moduleRef = bundledCardImages[categoryId]?.[cardId];\n  if (!moduleRef) return null;\n\n  const cacheKey = \`${"${categoryId}:${cardId}"}\`;\n  if (bundledUriCache.has(cacheKey)) return bundledUriCache.get(cacheKey);\n\n  const uri = Asset.fromModule(moduleRef).uri;\n  bundledUriCache.set(cacheKey, uri);\n  return uri;\n}\n`;

  await fs.writeFile(localImageAssetsPath, moduleSource, "utf8");
}

await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await copyPhotoAssets();
await generateLocalImageAssetsModule();

console.log(`Wrote ${outPath}`);
console.log(`Copied photo assets to ${mobilePhotosDir}`);
console.log(`Wrote ${localImageAssetsPath}`);
