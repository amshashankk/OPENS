/**
 * OPENS MEGA Ingestion — Pulls ALL free assets from Iconify (290K+ icons)
 * Plus illustrations, animated icons, stickers, 3D-style assets
 */

import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function cuid(): string {
  return "c" + randomBytes(12).toString("hex");
}

const now = new Date().toISOString();

// License mapping: spdx -> display
const LICENSE_MAP: Record<string, string> = {
  "MIT": "MIT", "ISC": "MIT", "Apache-2.0": "Apache-2.0",
  "CC0-1.0": "CC0", "CC-BY-4.0": "CC-BY-4.0", "CC-BY-SA-4.0": "CC-BY-SA-4.0",
  "OFL-1.1": "OFL-1.1",
};

// Category classification by prefix
const ANIMATED_PREFIXES = new Set(["line-md", "svg-spinners"]);
const STICKER_PREFIXES = new Set(["fluent-emoji", "fluent-emoji-flat", "fluent-emoji-high-contrast", "fluent-color"]);
const ILLUSTRATION_PREFIXES = new Set([
  "twemoji", "noto", "openmoji", "emojione", "fxemoji",
  "fluent-emoji-high-contrast", "streamline-emojis", "streamline-stickies-color",
  "streamline-kameleon-color",
]);
const THREED_PREFIXES = new Set([
  "noto-v1", "emojione-v1", "flat-color-icons", "emojione-monotone",
  "streamline-color", "streamline-plump-color", "streamline-freehand-color",
  "streamline-flex-color", "streamline-sharp-color", "streamline-ultimate-color",
  "streamline-cyber-color", "streamline-block",
]);
const LOGO_PREFIXES = new Set([
  "simple-icons", "logos", "devicon", "devicon-plain", "cib", "skill-icons",
  "vscode-icons", "file-icons", "material-icon-theme", "catppuccin",
  "cryptocurrency", "cryptocurrency-color", "token", "token-branded",
  "circle-flags", "flag", "flagpack",
]);

function categorize(prefix: string): { category: string; subcategory: string } {
  if (ANIMATED_PREFIXES.has(prefix)) return { category: "animated-icons", subcategory: "micro-interaction" };
  if (STICKER_PREFIXES.has(prefix)) return { category: "stickers", subcategory: "emoji-sticker" };
  if (ILLUSTRATION_PREFIXES.has(prefix)) return { category: "illustrations", subcategory: "emoji-illustration" };
  if (THREED_PREFIXES.has(prefix)) return { category: "3d-assets", subcategory: "3d-icon" };
  if (LOGO_PREFIXES.has(prefix)) return { category: "icons", subcategory: "brand-icons" };
  // Default: regular icons
  return { category: "icons", subcategory: "outline-icons" };
}

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

async function ingest() {
  console.log("=== OPENS MEGA Ingestion ===\n");

  // Clear
  console.log("Clearing existing data...");
  db.exec("DELETE FROM Download");
  db.exec("DELETE FROM Bookmark");
  db.exec("DELETE FROM Collection");
  db.exec("DELETE FROM Asset");
  db.exec("DELETE FROM User");

  // Demo user
  const { hashSync } = await import("bcryptjs");
  db.prepare(
    "INSERT INTO User (id, name, email, password, bio, avatar, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(cuid(), "Demo User", "demo@opens.dev", hashSync("password123", 12), "Design enthusiast exploring open-source assets", null, now, now);
  console.log("Created demo user\n");

  const insert = db.prepare(
    `INSERT INTO Asset (id, title, description, previewUrl, sourceUrl, downloadUrl, category, subcategory, tags, license, fileFormat, fileSize, width, height, animated, lottieData, downloads, views, featured, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // Get all collections
  console.log("Fetching Iconify collections...");
  const collectionsRes = await fetch("https://api.iconify.design/collections");
  const collections = await collectionsRes.json();

  const freeLicenses = ["MIT", "Apache 2.0", "CC0 1.0", "CC BY 4.0", "ISC", "CC BY-SA 4.0", "OFL 1.1"];
  const allSets = Object.entries(collections)
    .map(([prefix, v]: [string, any]) => ({
      prefix,
      name: v.name as string,
      total: v.total as number,
      license: v.license?.title as string || "unknown",
      spdx: v.license?.spdx as string || "",
      homepage: (v.author?.url as string) || `https://iconify.design/icon-sets/${prefix}/`,
    }))
    .filter(s => freeLicenses.some(l => (s.license || "").includes(l)))
    .sort((a, b) => b.total - a.total);

  console.log(`Found ${allSets.length} free icon sets\n`);

  let totalInserted = 0;
  let setsDone = 0;

  // Also add Lucide, Tabler, Bootstrap from their native CDNs (better URLs)
  const nativeSources = [
    {
      prefix: "lucide-native",
      name: "Lucide Icons",
      license: "MIT",
      homepage: "https://lucide.dev",
      fetchNames: async () => {
        const res = await fetch("https://unpkg.com/lucide-static@latest/icon-nodes.json");
        return Object.keys(await res.json());
      },
      previewUrl: (n: string) => `https://unpkg.com/lucide-static@latest/icons/${n}.svg`,
      sourceUrl: (n: string) => `https://lucide.dev/icons/${n}`,
    },
    {
      prefix: "tabler-native",
      name: "Tabler Icons",
      license: "MIT",
      homepage: "https://tabler.io/icons",
      fetchNames: async () => {
        const res = await fetch("https://unpkg.com/@tabler/icons@latest/icons/outline/?meta");
        const data = await res.json();
        return (data.files || []).filter((f: any) => f.path.endsWith(".svg")).map((f: any) => f.path.replace("/icons/outline/", "").replace(".svg", ""));
      },
      previewUrl: (n: string) => `https://unpkg.com/@tabler/icons@latest/icons/outline/${n}.svg`,
      sourceUrl: (n: string) => `https://tabler.io/icons/icon/${n}`,
    },
    {
      prefix: "bootstrap-native",
      name: "Bootstrap Icons",
      license: "MIT",
      homepage: "https://icons.getbootstrap.com",
      fetchNames: async () => {
        const res = await fetch("https://unpkg.com/bootstrap-icons@latest/?meta");
        const data = await res.json();
        return (data.files || []).filter((f: any) => f.path.startsWith("/icons/") && f.path.endsWith(".svg")).map((f: any) => f.path.replace("/icons/", "").replace(".svg", ""));
      },
      previewUrl: (n: string) => `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/${n}.svg`,
      sourceUrl: (n: string) => `https://icons.getbootstrap.com/icons/${n}/`,
    },
  ];

  // Native sources first
  for (const src of nativeSources) {
    try {
      console.log(`[Native] ${src.name}...`);
      const names = await src.fetchNames();

      const batch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const title = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          const tags = [...iconName.split(/[-_]/).filter(w => w.length > 2), "icon", src.name.toLowerCase().replace(" icons", "")];
          insert.run(
            cuid(), title, `${src.name} - ${title}. ${src.license} licensed.`,
            src.previewUrl(iconName), src.sourceUrl(iconName), src.previewUrl(iconName),
            "icons", "outline-icons", JSON.stringify(tags), src.license, "SVG",
            null, 24, 24, 0, null,
            Math.floor(Math.random() * 5000), Math.floor(Math.random() * 15000),
            Math.random() < 0.02 ? 1 : 0, now, now
          );
        }
      });

      batch(names);
      totalInserted += names.length;
      console.log(`  -> ${names.length} icons`);
    } catch (err) {
      console.error(`  Error: ${(err as Error).message}`);
    }
  }

  // Skip native prefixes from Iconify to avoid duplicates
  const skipPrefixes = new Set(["lucide", "tabler", "bi"]);

  // Process ALL Iconify sets
  for (const set of allSets) {
    if (skipPrefixes.has(set.prefix)) {
      console.log(`[Skip] ${set.prefix} (native source used)`);
      continue;
    }

    try {
      const names = await fetchIconNames(set.prefix);
      if (names.length === 0) continue;

      const { category, subcategory } = categorize(set.prefix);
      const isAnimated = ANIMATED_PREFIXES.has(set.prefix) || category === "animated-icons";
      const license = LICENSE_MAP[set.spdx] || set.license;

      const batch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const title = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          const previewUrl = `https://api.iconify.design/${set.prefix}/${iconName}.svg`;
          const tags = [
            ...iconName.split(/[-_]/).filter(w => w.length > 2),
            category.replace("-", " "), set.name.toLowerCase().split(" ")[0],
          ];

          insert.run(
            cuid(), title, `${set.name} - ${title}. ${license} licensed.`,
            previewUrl, set.homepage, previewUrl,
            category, subcategory, JSON.stringify(tags), license, "SVG",
            null, category === "illustrations" || category === "3d-assets" || category === "stickers" ? 128 : 24,
            category === "illustrations" || category === "3d-assets" || category === "stickers" ? 128 : 24,
            isAnimated ? 1 : 0, null,
            Math.floor(Math.random() * 5000), Math.floor(Math.random() * 15000),
            Math.random() < 0.02 ? 1 : 0, now, now
          );
        }
      });

      batch(names);
      totalInserted += names.length;
      setsDone++;

      if (setsDone % 10 === 0 || names.length > 2000) {
        console.log(`[${setsDone}/${allSets.length}] ${set.prefix}: ${names.length} -> ${category} (total: ${totalInserted})`);
      }
    } catch (err) {
      console.error(`  Error ${set.prefix}: ${(err as Error).message}`);
    }
  }

  // Add Lottie category entries using line-md animated icons
  console.log("\n--- Adding Lottie category entries ---");
  const lottieNames = await fetchIconNames("line-md");
  const lottieInsert = db.transaction((icons: string[]) => {
    for (const iconName of icons) {
      const title = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      insert.run(
        cuid(), `Lottie ${title}`, `Animated Lottie-style: ${title}. MIT licensed.`,
        `https://api.iconify.design/line-md/${iconName}.svg?width=96&height=96`,
        `https://iconify.design/icon-sets/line-md/${iconName}`,
        `https://api.iconify.design/line-md/${iconName}.svg`,
        "lottie", "ui-animation",
        JSON.stringify([...iconName.split(/[-_]/).filter(w => w.length > 2), "lottie", "animation", "animated"]),
        "MIT", "SVG", null, 96, 96, 1, null,
        Math.floor(Math.random() * 3000), Math.floor(Math.random() * 10000),
        Math.random() < 0.04 ? 1 : 0, now, now
      );
    }
  });
  lottieInsert(lottieNames);
  totalInserted += lottieNames.length;
  console.log(`  Added ${lottieNames.length} Lottie entries`);

  // Summary
  const counts = db.prepare("SELECT category, COUNT(*) as count FROM Asset GROUP BY category ORDER BY count DESC").all() as Array<{ category: string; count: number }>;
  const total = (db.prepare("SELECT COUNT(*) as c FROM Asset").get() as { c: number }).c;

  console.log("\n=== INGESTION COMPLETE ===");
  console.log(`Total assets: ${total.toLocaleString()}\n`);
  console.log("By category:");
  for (const row of counts) {
    console.log(`  ${row.category}: ${row.count.toLocaleString()}`);
  }
  console.log(`\nSets processed: ${setsDone}`);
  console.log("Demo login: demo@opens.dev / password123");
}

ingest()
  .catch(console.error)
  .finally(() => db.close());
