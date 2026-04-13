/**
 * Bulk import icons from Iconify API into OPENS database.
 * Iconify aggregates 225+ open-source icon sets with 300K+ icons.
 *
 * Usage: npx tsx scripts/import-iconify.ts
 */

import Database from "better-sqlite3";
import path from "path";
import { randomBytes } from "crypto";

const DB_PATH = path.join(__dirname, "..", "dev.db");
const ICONIFY_API = "https://api.iconify.design";
const BATCH_SIZE = 500;

function generateId(): string {
  return randomBytes(12).toString("hex");
}

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// Map Iconify set prefixes to subcategories for better organization
function getSubcategory(prefix: string, setName: string): string {
  const name = setName.toLowerCase();
  if (name.includes("emoji") || name.includes("twemoji") || name.includes("noto") || name.includes("openmoji")) return "emoji";
  if (name.includes("brand") || prefix === "simple-icons" || prefix === "logos" || prefix === "skill-icons" || prefix === "devicon") return "brand-icons";
  if (name.includes("fluent") && !name.includes("emoji")) return "fluent";
  if (name.includes("material")) return "material";
  if (prefix === "ph" || prefix === "phosphor") return "phosphor";
  if (prefix === "tabler") return "tabler";
  if (prefix === "lucide") return "lucide";
  if (prefix === "mdi") return "mdi";
  if (name.includes("game")) return "game-icons";
  if (name.includes("weather")) return "weather";
  if (name.includes("flag")) return "flags";
  return prefix;
}

function getCategory(prefix: string, setName: string): string {
  const name = setName.toLowerCase();
  if (name.includes("emoji") || name.includes("twemoji") || name.includes("noto") || name.includes("openmoji")) return "stickers";
  if (name.includes("3d") || name.includes("fluency")) return "3d-assets";
  return "icons";
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  // Prepare insert statement
  const insert = db.prepare(`
    INSERT OR IGNORE INTO Asset (id, title, description, previewUrl, sourceUrl, downloadUrl, category, subcategory, tags, license, fileFormat, fileSize, width, height, animated, downloads, views, featured, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, datetime('now'), datetime('now'))
  `);

  // Check existing count
  const existing = (db.prepare("SELECT COUNT(*) as cnt FROM Asset").get() as any).cnt;
  console.log(`Current asset count: ${existing}`);

  // Get all icon collections
  console.log("Fetching Iconify collections...");
  const collections = await fetchJSON(`${ICONIFY_API}/collections`);
  const sets = Object.entries(collections) as [string, any][];
  console.log(`Found ${sets.length} icon sets`);

  let totalImported = 0;
  let totalSkipped = 0;

  // Check which sets are already imported
  const existingSources = new Set<string>();
  const rows = db.prepare("SELECT sourceUrl FROM Asset WHERE sourceUrl LIKE '%iconify%' OR sourceUrl LIKE '%icon-sets%'").all() as any[];
  rows.forEach(r => existingSources.add(r.sourceUrl));
  console.log(`Already have ${existingSources.size} iconify assets`);

  for (let si = 0; si < sets.length; si++) {
    const [prefix, info] = sets[si];
    const setName = info.name || prefix;
    const iconCount = info.total || 0;
    const licenseSpdx = info.license?.spdx || "Unknown";
    const licenseTitle = info.license?.title || licenseSpdx;

    console.log(`\n[${si + 1}/${sets.length}] ${setName} (${prefix}): ${iconCount} icons [${licenseSpdx}]`);

    if (iconCount === 0) continue;

    // Fetch all icon names for this set
    let iconNames: string[];
    try {
      const collectionData = await fetchJSON(`${ICONIFY_API}/collection?prefix=${prefix}`);
      // Icons can be in categories or uncategorized
      iconNames = [];
      if (collectionData.uncategorized) {
        iconNames.push(...collectionData.uncategorized);
      }
      if (collectionData.categories) {
        for (const cat of Object.values(collectionData.categories) as string[][]) {
          iconNames.push(...cat);
        }
      }
      if (iconNames.length === 0 && collectionData.icons) {
        iconNames = collectionData.icons;
      }
    } catch (e) {
      console.log(`  Error fetching collection: ${e}`);
      continue;
    }

    console.log(`  Found ${iconNames.length} icon names`);

    const category = getCategory(prefix, setName);
    const subcategory = getSubcategory(prefix, setName);

    // Insert in batches
    const insertBatch = db.transaction((icons: string[]) => {
      let batchImported = 0;
      for (const iconName of icons) {
        const title = iconName
          .replace(/-/g, " ")
          .replace(/_/g, " ")
          .replace(/\b\w/g, c => c.toUpperCase());

        const previewUrl = `https://api.iconify.design/${prefix}/${iconName}.svg`;
        const sourceUrl = `https://icon-sets.iconify.design/${prefix}/${iconName}/`;
        const downloadUrl = `https://api.iconify.design/${prefix}/${iconName}.svg?download=1`;

        // Generate tags from icon name and set name
        const nameParts = iconName.split(/[-_]/).filter(p => p.length > 1);
        const tags = [...new Set([...nameParts, prefix, setName.toLowerCase().replace(/\s+/g, "-")])].join(",");

        try {
          insert.run(
            generateId(),
            title,
            `${title} icon from ${setName} collection`,
            previewUrl,
            sourceUrl,
            downloadUrl,
            category,
            subcategory,
            tags,
            licenseTitle,
            "SVG",
            null, // fileSize
            24,   // width
            24,   // height
            0     // animated
          );
          batchImported++;
        } catch (e) {
          // Skip duplicates
        }
      }
      return batchImported;
    });

    // Process in batches
    for (let i = 0; i < iconNames.length; i += BATCH_SIZE) {
      const batch = iconNames.slice(i, i + BATCH_SIZE);
      const imported = insertBatch(batch);
      totalImported += imported;
      totalSkipped += batch.length - imported;
    }

    console.log(`  Imported: ${totalImported} total (${totalSkipped} skipped)`);

    // Small delay between sets to be nice to the API
    await sleep(100);
  }

  // Final count
  const finalCount = (db.prepare("SELECT COUNT(*) as cnt FROM Asset").get() as any).cnt;
  console.log(`\n========================================`);
  console.log(`Import complete!`);
  console.log(`Previous count: ${existing}`);
  console.log(`New count: ${finalCount}`);
  console.log(`Added: ${finalCount - existing} icons`);
  console.log(`========================================`);

  db.close();
}

main().catch(console.error);
