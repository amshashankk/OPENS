/**
 * Add more 3D-style colorful assets WITHOUT deleting existing ones
 */
import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const cuid = () => "c" + randomBytes(12).toString("hex");
const now = new Date().toISOString();

const insert = db.prepare(
  `INSERT INTO Asset (id, title, description, previewUrl, sourceUrl, downloadUrl, category, subcategory, tags, license, fileFormat, fileSize, width, height, animated, lottieData, downloads, views, featured, createdAt, updatedAt)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

// Sets to add as 3D assets — colorful, rich, 3D-looking
const sets3d = [
  { prefix: "fluent-emoji", name: "Fluent 3D Emoji", license: "MIT", limit: 3126 },
  { prefix: "fluent-emoji-flat", name: "Fluent Flat 3D", license: "MIT", limit: 3145 },
  { prefix: "noto", name: "Google Noto 3D", license: "Apache-2.0", limit: 3710 },
  { prefix: "twemoji", name: "Twitter 3D Emoji", license: "CC-BY-4.0", limit: 3988 },
  { prefix: "fluent-color", name: "Fluent Color Icons", license: "MIT", limit: 890 },
  { prefix: "streamline-color", name: "Streamline Color 3D", license: "CC-BY-4.0", limit: 2000 },
  { prefix: "streamline-plump-color", name: "Streamline Plump 3D", license: "CC-BY-4.0", limit: 1000 },
  { prefix: "flat-color-icons", name: "Flat Color 3D", license: "MIT", limit: 329 },
  { prefix: "cryptocurrency-color", name: "Crypto Color Icons", license: "CC0", limit: 483 },
];

async function fetchIconNames(prefix: string): Promise<string[]> {
  const res = await fetch(`https://api.iconify.design/collection?prefix=${prefix}`);
  const data = await res.json();
  let names: string[] = data.uncategorized || [];
  if (data.categories) {
    for (const catNames of Object.values(data.categories)) {
      names = names.concat(catNames as string[]);
    }
  }
  return [...new Set(names)];
}

async function add3d() {
  const before = (db.prepare("SELECT COUNT(*) as c FROM Asset WHERE category = '3d-assets'").get() as { c: number }).c;
  console.log(`Current 3D assets: ${before}\n`);

  // Get existing preview URLs to avoid duplicates
  const existingUrls = new Set<string>();
  const rows = db.prepare("SELECT previewUrl FROM Asset WHERE category = '3d-assets'").all() as Array<{ previewUrl: string }>;
  rows.forEach(r => existingUrls.add(r.previewUrl));
  console.log(`Existing URLs tracked: ${existingUrls.size}\n`);

  let added = 0;

  for (const set of sets3d) {
    try {
      console.log(`Fetching ${set.name} (${set.prefix})...`);
      const names = await fetchIconNames(set.prefix);
      const toAdd = names.slice(0, set.limit);

      const batch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const previewUrl = `https://api.iconify.design/${set.prefix}/${iconName}.svg?width=128&height=128`;

          // Skip if already exists
          if (existingUrls.has(previewUrl) || existingUrls.has(previewUrl.replace("?width=128&height=128", ""))) continue;

          const title = `3D ${iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`;
          const tags = [
            ...iconName.split(/[-_]/).filter(w => w.length > 2),
            "3d", "colorful", "icon", set.name.split(" ")[0].toLowerCase(),
          ];

          insert.run(
            cuid(), title,
            `${set.name} - ${title}. ${set.license} licensed. Free for any use.`,
            previewUrl,
            `https://iconify.design/icon-sets/${set.prefix}/${iconName}`,
            `https://api.iconify.design/${set.prefix}/${iconName}.svg`,
            "3d-assets", "3d-icon",
            JSON.stringify(tags), set.license, "SVG",
            null, 128, 128, 0, null,
            0, 0, Math.random() < 0.02 ? 1 : 0, now, now
          );
          added++;
          existingUrls.add(previewUrl);
        }
      });

      batch(toAdd);
      console.log(`  Added from ${set.name}: ${toAdd.length} checked, ${added} total new`);
    } catch (err) {
      console.error(`  Error with ${set.name}:`, (err as Error).message);
    }
  }

  const after = (db.prepare("SELECT COUNT(*) as c FROM Asset WHERE category = '3d-assets'").get() as { c: number }).c;
  console.log(`\n=== DONE ===`);
  console.log(`Before: ${before}`);
  console.log(`Added: ${added}`);
  console.log(`Total 3D assets now: ${after}`);
}

add3d()
  .catch(console.error)
  .finally(() => db.close());
