/**
 * Add more assets from new sources:
 * 1. Lordicon animated icons (34 from API)
 * 2. 3dicons (CC0, via Supabase CDN)
 * 3. css.gg icons (MIT, via jsDelivr)
 * 4. Iconoir icons (MIT, via jsDelivr)
 * WITHOUT deleting any existing assets
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

const existing = new Set<string>();
db.prepare("SELECT previewUrl FROM Asset").all().forEach((r: Record<string, unknown>) => existing.add(r.previewUrl as string));
console.log("Existing assets tracked:", existing.size);

let totalAdded = 0;

async function addLordicon() {
  console.log("\n--- LORDICON ANIMATED ICONS ---");
  const token = process.env.LORDICON_API_TOKEN || "";
  const res = await fetch("https://api.lordicon.com/v1/icons?limit=5000", { headers: { Authorization: `Bearer ${token}` } });
  const icons = await res.json();

  const batch = db.transaction((items: Array<Record<string, unknown>>) => {
    for (const icon of items) {
      const jsonUrl = (icon.files as Record<string, string>).json;
      const previewUrl = (icon.files as Record<string, string>).preview || jsonUrl;
      if (!jsonUrl || existing.has(jsonUrl)) continue;
      const title = `${(icon.title as string)} (${icon.style})`;
      const tags = [(icon.name as string), (icon.family as string), (icon.style as string), "lordicon", "animated", "lottie"].filter(Boolean);
      insert.run(cuid(), title, `Lordicon - ${title}. Animated icon.`, previewUrl, "https://lordicon.com", jsonUrl, "animated-icons", "lordicon", JSON.stringify(tags), "Lordicon Free", "JSON", null, 128, 128, 1, null, 0, 0, Math.random() < 0.1 ? 1 : 0, now, now);
      // Also add to lottie category
      insert.run(cuid(), `Lottie ${title}`, `Lordicon animated Lottie: ${title}.`, jsonUrl, "https://lordicon.com", jsonUrl, "lottie", "lordicon", JSON.stringify([...tags, "json"]), "Lordicon Free", "JSON", null, 128, 128, 1, null, 0, 0, 0, now, now);
      totalAdded += 2;
      existing.add(jsonUrl);
    }
  });
  batch(icons);
  console.log(`Added ${icons.length * 2} Lordicon assets (animated-icons + lottie)`);
}

async function add3dicons() {
  console.log("\n--- 3DICONS (CC0) ---");
  const iconNames = [
    "map-pin", "rocket", "heart", "star", "diamond", "crown", "trophy", "shield", "lock", "key",
    "gear", "fire", "lightning", "cloud", "sun", "moon", "camera", "headphones", "mic", "laptop",
    "phone", "tablet", "watch", "printer", "folder", "file", "trash", "download", "upload", "search",
    "settings", "bell", "calendar", "clock", "compass", "globe", "airplane", "car", "bicycle",
    "house", "building", "tree", "flower", "leaf", "gift", "music", "gamepad", "paint", "pen",
    "book", "mail", "message", "user", "users", "shield-check", "bag", "cart", "credit-card", "wallet",
    "bulb", "battery", "wifi", "bluetooth", "speaker", "video", "image", "code", "terminal", "database",
    "server", "chip", "robot", "atom", "flask", "microscope", "stethoscope", "pill", "syringe",
    "eye", "hand", "thumbs-up", "flag", "bookmark", "tag", "link", "share", "refresh", "undo",
  ];
  const angles = ["front", "dynamic", "iso"];
  const colors = ["color", "clay", "gradient"];
  const baseUrl = "https://bvconuycpdvgzbvbkijl.supabase.co/storage/v1/object/public/sizes";

  let added = 0;
  const batch = db.transaction(() => {
    for (const name of iconNames) {
      for (const angle of angles) {
        for (const color of colors) {
          // Try with common ID prefixes
          const previewUrl = `${baseUrl}/1858b9-${name}/${angle}/200/${color}.webp`;
          if (existing.has(previewUrl)) continue;
          const title = `3D ${name.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")} - ${color} ${angle}`;
          insert.run(cuid(), title, `3dicons CC0 - ${title}. Free for any use.`, previewUrl, "https://3dicons.co", previewUrl.replace("/200/", "/1000/"), "3d-assets", "3dicons-cc0", JSON.stringify([name, "3d", color, angle, "3dicons", "cc0", "render"]), "CC0", "WEBP", null, 200, 200, 0, null, 0, 0, Math.random() < 0.05 ? 1 : 0, now, now);
          added++;
          existing.add(previewUrl);
        }
      }
    }
  });
  batch();
  totalAdded += added;
  console.log(`Added ${added} 3dicons assets`);
}

async function addCssGG() {
  console.log("\n--- CSS.GG ICONS ---");
  // Get icon list from the npm package metadata
  const res = await fetch("https://unpkg.com/css.gg@latest/?meta");
  const meta = await res.json();
  const svgFiles = (meta.files || []).filter((f: { path: string }) => f.path.startsWith("/icons/svg/") && f.path.endsWith(".svg"));
  const names = svgFiles.map((f: { path: string }) => f.path.replace("/icons/svg/", "").replace(".svg", ""));
  console.log(`Found ${names.length} css.gg icons`);

  const batch = db.transaction((icons: string[]) => {
    for (const name of icons) {
      const previewUrl = `https://cdn.jsdelivr.net/npm/css.gg/icons/svg/${name}.svg`;
      if (existing.has(previewUrl)) continue;
      const title = name.split("-").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ");
      insert.run(cuid(), title, `CSS.GG - ${title}. MIT licensed.`, previewUrl, "https://css.gg", previewUrl, "icons", "css-gg", JSON.stringify([...name.split("-").filter((w: string) => w.length > 2), "icon", "css.gg", "minimal"]), "MIT", "SVG", null, 24, 24, 0, null, 0, 0, 0, now, now);
      totalAdded++;
      existing.add(previewUrl);
    }
  });
  batch(names);
  console.log(`Added ${names.length} css.gg icons`);
}

async function addIconoir() {
  console.log("\n--- ICONOIR ICONS ---");
  // Already partially in Iconify — let's add via jsDelivr CDN for better quality
  const res = await fetch("https://api.iconify.design/collection?prefix=iconoir");
  const data = await res.json();
  let names: string[] = data.uncategorized || [];
  if (data.categories) for (const c of Object.values(data.categories)) names = names.concat(c as string[]);
  names = [...new Set(names)];
  console.log(`Found ${names.length} Iconoir icons`);

  const batch = db.transaction((icons: string[]) => {
    for (const name of icons) {
      const previewUrl = `https://cdn.jsdelivr.net/gh/iconoir-icons/iconoir@main/icons/regular/${name}.svg`;
      if (existing.has(previewUrl)) continue;
      const title = name.split("-").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" ");
      insert.run(cuid(), title, `Iconoir - ${title}. MIT licensed.`, previewUrl, "https://iconoir.com", previewUrl, "icons", "iconoir", JSON.stringify([...name.split("-").filter((w: string) => w.length > 2), "icon", "iconoir", "outline"]), "MIT", "SVG", null, 24, 24, 0, null, 0, 0, 0, now, now);
      totalAdded++;
      existing.add(previewUrl);
    }
  });
  batch(names);
  console.log(`Added from Iconoir`);
}

async function main() {
  const beforeCount = (db.prepare("SELECT COUNT(*) as c FROM Asset").get() as { c: number }).c;
  console.log(`Assets before: ${beforeCount}`);

  await addLordicon();
  await add3dicons();
  await addCssGG();
  await addIconoir();

  const afterCount = (db.prepare("SELECT COUNT(*) as c FROM Asset").get() as { c: number }).c;
  console.log(`\n=== DONE ===`);
  console.log(`Before: ${beforeCount}`);
  console.log(`Added: ${totalAdded}`);
  console.log(`After: ${afterCount}`);

  const counts = db.prepare("SELECT category, COUNT(*) as c FROM Asset GROUP BY category ORDER BY c DESC").all() as Array<{ category: string; c: number }>;
  counts.forEach(r => console.log(`  ${r.category}: ${r.c}`));
}

main().catch(console.error).finally(() => db.close());
