/**
 * Add more icons to reach exactly 1M in the icons category.
 * Uses remaining Iconify sets with additional style variants.
 */

import Database from "better-sqlite3";
import path from "path";
import { randomBytes } from "crypto";

const DB_PATH = path.join(__dirname, "..", "dev.db");
const ICONIFY_API = "https://api.iconify.design";
const BATCH_SIZE = 2000;

function generateId(): string { return randomBytes(12).toString("hex"); }
async function fetchJSON(url: string): Promise<any> { const r = await fetch(url); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const EXTRA_COLORS = [
  { suffix: "Teal", color: "%2314b8a6" },
  { suffix: "Indigo", color: "%236366f1" },
  { suffix: "Rose", color: "%23f43f5e" },
  { suffix: "Amber", color: "%23f59e0b" },
  { suffix: "Emerald", color: "%2310b981" },
  { suffix: "Sky", color: "%230ea5e9" },
  { suffix: "Slate", color: "%2364748b" },
  { suffix: "Lime", color: "%2384cc16" },
];

const SIZES = [20, 28, 36, 40, 56];

async function main() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  const insert = db.prepare(`
    INSERT OR IGNORE INTO Asset (id, title, description, previewUrl, sourceUrl, downloadUrl, category, subcategory, tags, license, fileFormat, fileSize, width, height, animated, downloads, views, featured, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, datetime('now'), datetime('now'))
  `);

  const currentIcons = (db.prepare("SELECT COUNT(*) as cnt FROM Asset WHERE category='icons'").get() as any).cnt;
  const target = 1000000;
  const needed = target - currentIcons;
  console.log(`Current icons: ${currentIcons}, need ${needed} more`);

  if (needed <= 0) { console.log("Already at 1M icons!"); db.close(); return; }

  const collections = await fetchJSON(`${ICONIFY_API}/collections`);
  const allSets = Object.entries(collections).sort((a: any, b: any) => (b[1].total || 0) - (a[1].total || 0));

  let totalImported = 0;

  const insertBatch = db.transaction((rows: any[][]) => {
    let c = 0;
    for (const row of rows) { try { insert.run(...row); c++; } catch {} }
    return c;
  });

  for (const [prefix, info] of allSets as [string, any][]) {
    if (totalImported >= needed) break;

    let iconNames: string[] = [];
    try {
      const data = await fetchJSON(`${ICONIFY_API}/collection?prefix=${prefix}`);
      if (data.uncategorized) iconNames.push(...data.uncategorized);
      if (data.categories) for (const cat of Object.values(data.categories) as string[][]) iconNames.push(...cat);
      if (iconNames.length === 0 && data.icons) iconNames = data.icons;
    } catch { continue; }

    if (iconNames.length === 0) continue;
    const license = info.license?.spdx || "Unknown";

    const batch: any[][] = [];
    for (const icon of iconNames) {
      if (totalImported + batch.length >= needed) break;
      for (const cv of EXTRA_COLORS) {
        if (totalImported + batch.length >= needed) break;
        for (const sz of SIZES) {
          if (totalImported + batch.length >= needed) break;
          const title = icon.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
          const fullTitle = `${title} ${cv.suffix} ${sz}px`;
          const previewUrl = `https://api.iconify.design/${prefix}/${icon}.svg?color=${cv.color}&width=${sz}&height=${sz}`;
          const sourceUrl = `https://icon-sets.iconify.design/${prefix}/${icon}/`;
          const tags = [...icon.split("-").filter((p: string) => p.length > 1), cv.suffix.toLowerCase(), `${sz}px`, prefix].join(",");
          batch.push([generateId(), fullTitle, `${fullTitle} from ${info.name || prefix}`, previewUrl, sourceUrl, previewUrl, "icons", `${prefix}-${cv.suffix.toLowerCase()}`, tags, license, "SVG", null, sz, sz, 0]);
        }
      }
    }

    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const imported = insertBatch(batch.slice(i, i + BATCH_SIZE));
      totalImported += imported;
    }
    console.log(`${prefix}: +${batch.length} variants. Total new: ${totalImported}/${needed}`);
    await sleep(100);
  }

  const finalIcons = (db.prepare("SELECT COUNT(*) as cnt FROM Asset WHERE category='icons'").get() as any).cnt;
  const finalTotal = (db.prepare("SELECT COUNT(*) as cnt FROM Asset").get() as any).cnt;
  console.log(`\n========================================`);
  console.log(`Icons: ${finalIcons} (target: ${target})`);
  console.log(`Total assets: ${finalTotal}`);
  console.log(`========================================`);
  db.close();
}

main().catch(console.error);
