import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targets = [
  { category: "fruits", id: "apple", query: "apple,fruit" },
  { category: "fruits", id: "banana", query: "banana,fruit" },
  { category: "fruits", id: "orange", query: "orange,fruit" },
  { category: "fruits", id: "grapes", query: "grapes,fruit" },
  { category: "fruits", id: "watermelon", query: "watermelon,fruit" },
  { category: "fruits", id: "mango", query: "mango,fruit" },
  { category: "fruits", id: "pear", query: "pear,fruit" },
  { category: "fruits", id: "pineapple", query: "pineapple,fruit" },
  { category: "fruits", id: "strawberry", query: "strawberry,fruit" },
  { category: "fruits", id: "cherries", query: "cherries,fruit" },
  { category: "vegetables", id: "carrot", query: "carrot,vegetable" },
  { category: "vegetables", id: "tomato", query: "tomato,vegetable" },
  { category: "vegetables", id: "potato", query: "potato,vegetable" },
  { category: "vegetables", id: "broccoli", query: "broccoli,vegetable" },
  { category: "vegetables", id: "corn", query: "corn,vegetable" },
  { category: "vegetables", id: "cucumber", query: "cucumber,vegetable" },
  { category: "vegetables", id: "onion", query: "onion,vegetable" },
  { category: "vegetables", id: "peas", query: "peas,vegetable" },
  { category: "vegetables", id: "pumpkin", query: "pumpkin,vegetable" },
  { category: "vegetables", id: "eggplant", query: "eggplant,vegetable" },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function downloadOne(item, index) {
  const outDir = path.join(rootDir, "public", "assets", "photos", item.category);
  await ensureDir(outDir);
  const outFile = path.join(outDir, `${item.id}.jpg`);

  const keyword = item.query.split(",")[0];
  const url = `https://loremflickr.com/1200/1200/${encodeURIComponent(keyword)}?lock=${index + 1}`;
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Failed for ${item.id}: ${response.status}`);

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(outFile, buffer);

  return { id: item.id, bytes: buffer.length, finalUrl: response.url };
}

async function main() {
  let total = 0;
  for (let i = 0; i < targets.length; i += 1) {
    const result = await downloadOne(targets[i], i);
    total += result.bytes;
    console.log(`Downloaded ${targets[i].category}/${result.id}.jpg (${result.bytes} bytes)`);
    console.log(`  Source: ${result.finalUrl}`);
  }
  console.log(`Done. Downloaded ${targets.length} files, total ${(total / (1024 * 1024)).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
