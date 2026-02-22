import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categoryDefinitions, categoryCards } from "../src/slides.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outPath = path.join(rootDir, "apps", "mobile", "src", "content.generated.json");

const payload = {
  generatedAt: new Date().toISOString(),
  categoryDefinitions,
  categoryCards,
};

await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outPath}`);
