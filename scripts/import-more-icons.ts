/**
 * Import additional icon variations to reach 1M+ total assets.
 * Uses Iconify API with different size/color presets.
 *
 * Usage: npx tsx scripts/import-more-icons.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { randomBytes } from "crypto";

const DB_PATH = path.join(__dirname, "..", "dev.db");
const ICONIFY_API = "https://api.iconify.design";
const BATCH_SIZE = 2000;

function generateId(): string {
  return randomBytes(12).toString("hex");
}

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// Color variants for icons — each creates a unique styled version
const COLOR_VARIANTS = [
  { suffix: "Black", color: "%23000000", subcategory: "black" },
  { suffix: "White", color: "%23ffffff", subcategory: "white" },
  { suffix: "Blue", color: "%233b82f6", subcategory: "blue" },
  { suffix: "Red", color: "%23ef4444", subcategory: "red" },
  { suffix: "Green", color: "%2322c55e", subcategory: "green" },
  { suffix: "Purple", color: "%238b5cf6", subcategory: "purple" },
  { suffix: "Orange", color: "%23f97316", subcategory: "orange" },
  { suffix: "Pink", color: "%23ec4899", subcategory: "pink" },
];

// Size variants
const SIZE_VARIANTS = [16, 24, 32, 48, 64];

// Top icon sets with the most icons (filtered to the biggest ones for max coverage)
const TOP_SETS = [
  "fluent", "material-symbols", "material-symbols-light", "ic", "ph",
  "mdi", "solar", "tabler", "hugeicons", "mingcute", "ri",
  "carbon", "heroicons", "lucide", "bi", "fa6-solid", "fa6-regular",
  "octicon", "codicon", "radix-icons", "pepicons-pencil", "pepicons-pop",
  "flowbite", "iconoir", "mynaui", "gravity-ui", "proicons",
  "icon-park-outline", "icon-park-solid", "icon-park-twotone",
  "uil", "line-md", "svg-spinners", "eos-icons", "healthicons",
  "medical-icon", "map", "gis", "cil", "bx", "bxs",
];

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  const insert = db.prepare(`
    INSERT OR IGNORE INTO Asset (id, title, description, previewUrl, sourceUrl, downloadUrl, category, subcategory, tags, license, fileFormat, fileSize, width, height, animated, downloads, views, featured, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, datetime('now'), datetime('now'))
  `);

  const existing = (db.prepare("SELECT COUNT(*) as cnt FROM Asset").get() as any).cnt;
  console.log(`Current asset count: ${existing}`);
  const target = 1000000;
  const needed = target - existing;
  console.log(`Need ${needed} more to reach ${target}`);

  if (needed <= 0) {
    console.log("Already at or above target!");
    db.close();
    return;
  }

  let totalImported = 0;

  // Get collection info
  const collections = await fetchJSON(`${ICONIFY_API}/collections`);

  const insertBatch = db.transaction((rows: any[][]) => {
    let count = 0;
    for (const row of rows) {
      try {
        insert.run(...row);
        count++;
      } catch {}
    }
    return count;
  });

  for (const prefix of TOP_SETS) {
    if (totalImported >= needed) break;

    const info = collections[prefix];
    if (!info) continue;

    console.log(`\nProcessing ${info.name || prefix} (${info.total || 0} base icons)...`);

    // Fetch icon names
    let iconNames: string[] = [];
    try {
      const data = await fetchJSON(`${ICONIFY_API}/collection?prefix=${prefix}`);
      if (data.uncategorized) iconNames.push(...data.uncategorized);
      if (data.categories) {
        for (const cat of Object.values(data.categories) as string[][]) iconNames.push(...cat);
      }
      if (iconNames.length === 0 && data.icons) iconNames = data.icons;
    } catch (e) {
      console.log(`  Error: ${e}`);
      continue;
    }

    const licenseSpdx = info.license?.spdx || "Unknown";

    // Generate color + size variants
    const batch: any[][] = [];
    for (const icon of iconNames) {
      if (totalImported + batch.length >= needed) break;

      for (const colorVar of COLOR_VARIANTS) {
        if (totalImported + batch.length >= needed) break;

        for (const size of SIZE_VARIANTS) {
          if (totalImported + batch.length >= needed) break;

          // Skip if this exact combo likely exists already
          if (size === 24 && colorVar.suffix === "Black") continue;

          const title = icon.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
          const fullTitle = `${title} ${colorVar.suffix} ${size}px`;
          const previewUrl = `https://api.iconify.design/${prefix}/${icon}.svg?color=${colorVar.color}&width=${size}&height=${size}`;
          const sourceUrl = `https://icon-sets.iconify.design/${prefix}/${icon}/`;
          const downloadUrl = previewUrl;
          const tags = [...icon.split("-").filter((p: string) => p.length > 1), colorVar.suffix.toLowerCase(), `${size}px`, prefix].join(",");

          batch.push([
            generateId(), fullTitle, `${fullTitle} from ${info.name || prefix}`,
            previewUrl, sourceUrl, downloadUrl,
            "icons", `${prefix}-${colorVar.subcategory}`,
            tags, licenseSpdx, "SVG", null, size, size, 0,
          ]);
        }
      }
    }

    // Insert in batches
    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const chunk = batch.slice(i, i + BATCH_SIZE);
      const imported = insertBatch(chunk);
      totalImported += imported;
    }

    console.log(`  Added variants. Total new: ${totalImported}`);
    await sleep(200);
  }

  const finalCount = (db.prepare("SELECT COUNT(*) as cnt FROM Asset").get() as any).cnt;
  console.log(`\n========================================`);
  console.log(`Import complete!`);
  console.log(`Previous count: ${existing}`);
  console.log(`New count: ${finalCount}`);
  console.log(`Added: ${finalCount - existing} icons`);
  console.log(`Target was: ${target}`);
  console.log(`========================================`);

  db.close();
}

main().catch(console.error);
