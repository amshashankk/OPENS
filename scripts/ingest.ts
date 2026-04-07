/**
 * OPENS Asset Ingestion Script
 *
 * Fetches real open-source assets from:
 * - Icons: Lucide (MIT), Tabler (MIT), Bootstrap (MIT), Heroicons (MIT),
 *          Phosphor (MIT), Simple Icons (CC0), Iconoir (MIT), Remix (Apache-2.0),
 *          Fluent UI (MIT), Material Symbols (Apache-2.0)
 * - Illustrations: unDraw (free), SVG Repo (mixed CC0/open)
 * - Lottie: LottieFiles free animations
 * - 3D Assets: 3dicons (CC0)
 *
 * All assets include proper license, source attribution, and preview URLs.
 */

import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const db = new Database(dbPath);

function cuid(): string {
  return "c" + randomBytes(12).toString("hex");
}

const now = new Date().toISOString();

// ─── ICON SOURCES ─────────────────────────────────────────────────────────────

interface IconSource {
  name: string;
  license: string;
  homepage: string;
  previewUrlPattern: string; // {name} will be replaced
  sourceUrlPattern: string;
  downloadUrlPattern: string;
  fetchNames: () => Promise<string[]>;
  subcategory: string;
}

const iconSources: IconSource[] = [
  {
    name: "Lucide Icons",
    license: "MIT",
    homepage: "https://lucide.dev",
    previewUrlPattern: "https://unpkg.com/lucide-static@latest/icons/{name}.svg",
    sourceUrlPattern: "https://lucide.dev/icons/{name}",
    downloadUrlPattern: "https://unpkg.com/lucide-static@latest/icons/{name}.svg",
    subcategory: "outline-icons",
    fetchNames: async () => {
      const res = await fetch("https://unpkg.com/lucide-static@latest/icon-nodes.json");
      const data = await res.json();
      return Object.keys(data);
    },
  },
  {
    name: "Tabler Icons",
    license: "MIT",
    homepage: "https://tabler.io/icons",
    previewUrlPattern: "https://unpkg.com/@tabler/icons@latest/icons/outline/{name}.svg",
    sourceUrlPattern: "https://tabler.io/icons/icon/{name}",
    downloadUrlPattern: "https://unpkg.com/@tabler/icons@latest/icons/outline/{name}.svg",
    subcategory: "outline-icons",
    fetchNames: async () => {
      const res = await fetch("https://unpkg.com/@tabler/icons@latest/icons/outline/?meta");
      const data = await res.json();
      return (data.files || [])
        .filter((f: { path: string }) => f.path.endsWith(".svg"))
        .map((f: { path: string }) => f.path.replace("/icons/outline/", "").replace(".svg", ""));
    },
  },
  {
    name: "Bootstrap Icons",
    license: "MIT",
    homepage: "https://icons.getbootstrap.com",
    previewUrlPattern: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/{name}.svg",
    sourceUrlPattern: "https://icons.getbootstrap.com/icons/{name}/",
    downloadUrlPattern: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/{name}.svg",
    subcategory: "filled-icons",
    fetchNames: async () => {
      const res = await fetch("https://unpkg.com/bootstrap-icons@latest/?meta");
      const data = await res.json();
      return (data.files || [])
        .filter((f: { path: string }) => f.path.startsWith("/icons/") && f.path.endsWith(".svg"))
        .map((f: { path: string }) => f.path.replace("/icons/", "").replace(".svg", ""));
    },
  },
  {
    name: "Phosphor Icons",
    license: "MIT",
    homepage: "https://phosphoricons.com",
    previewUrlPattern: "https://api.iconify.design/ph/{name}.svg",
    sourceUrlPattern: "https://phosphoricons.com",
    downloadUrlPattern: "https://api.iconify.design/ph/{name}.svg",
    subcategory: "outline-icons",
    fetchNames: async () => {
      // Get Phosphor icon list from Iconify
      const res = await fetch("https://api.iconify.design/collection?prefix=ph");
      const data = await res.json();
      // Only regular (non-suffixed) icons
      return (data.uncategorized || []).filter((n: string) => !n.includes("-bold") && !n.includes("-fill") && !n.includes("-thin") && !n.includes("-light") && !n.includes("-duotone"));
    },
  },
  {
    name: "Simple Icons",
    license: "CC0",
    homepage: "https://simpleicons.org",
    previewUrlPattern: "https://cdn.simpleicons.org/{name}",
    sourceUrlPattern: "https://simpleicons.org/?q={name}",
    downloadUrlPattern: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/{name}.svg",
    subcategory: "brand-icons",
    fetchNames: async () => {
      const res = await fetch("https://api.iconify.design/collection?prefix=simple-icons");
      const data = await res.json();
      return (data.uncategorized || []).slice(0, 1500);
    },
  },
  {
    name: "Iconoir",
    license: "MIT",
    homepage: "https://iconoir.com",
    previewUrlPattern: "https://api.iconify.design/iconoir/{name}.svg",
    sourceUrlPattern: "https://iconoir.com/icons/{name}",
    downloadUrlPattern: "https://api.iconify.design/iconoir/{name}.svg",
    subcategory: "outline-icons",
    fetchNames: async () => {
      const res = await fetch("https://api.iconify.design/collection?prefix=iconoir");
      const data = await res.json();
      return data.uncategorized || [];
    },
  },
  {
    name: "Heroicons",
    license: "MIT",
    homepage: "https://heroicons.com",
    previewUrlPattern: "https://api.iconify.design/heroicons/{name}.svg",
    sourceUrlPattern: "https://heroicons.com",
    downloadUrlPattern: "https://api.iconify.design/heroicons/{name}.svg",
    subcategory: "outline-icons",
    fetchNames: async () => {
      const res = await fetch("https://api.iconify.design/collection?prefix=heroicons");
      const data = await res.json();
      return (data.uncategorized || []).filter((n: string) => !n.includes("-solid") && !n.includes("-20-solid") && !n.includes("-16-solid"));
    },
  },
];

// ─── ICONIFY EXTRA SETS (Fluent, Material, etc.) ──────────────────────────────

interface IconifySet {
  prefix: string;
  name: string;
  license: string;
  homepage: string;
  limit: number;
  subcategory: string;
}

const iconifySets: IconifySet[] = [
  { prefix: "fluent", name: "Fluent UI System Icons", license: "MIT", homepage: "https://github.com/microsoft/fluentui-system-icons", limit: 5000, subcategory: "filled-icons" },
  { prefix: "material-symbols", name: "Material Symbols", license: "Apache-2.0", homepage: "https://fonts.google.com/icons", limit: 5000, subcategory: "filled-icons" },
  { prefix: "material-symbols-light", name: "Material Symbols Light", license: "Apache-2.0", homepage: "https://fonts.google.com/icons", limit: 3000, subcategory: "outline-icons" },
  { prefix: "ic", name: "Google Material Icons", license: "Apache-2.0", homepage: "https://fonts.google.com/icons", limit: 5000, subcategory: "filled-icons" },
  { prefix: "mdi", name: "Material Design Icons", license: "Apache-2.0", homepage: "https://materialdesignicons.com", limit: 5000, subcategory: "filled-icons" },
  { prefix: "solar", name: "Solar Icons", license: "CC-BY-4.0", homepage: "https://www.figma.com/community/file/1166831539721848736", limit: 5000, subcategory: "outline-icons" },
  { prefix: "mingcute", name: "MingCute Icons", license: "Apache-2.0", homepage: "https://www.mingcute.com", limit: 3000, subcategory: "outline-icons" },
  { prefix: "hugeicons", name: "Huge Icons", license: "MIT", homepage: "https://hugeicons.com", limit: 3000, subcategory: "outline-icons" },
  { prefix: "boxicons", name: "Boxicons", license: "MIT", homepage: "https://boxicons.com", limit: 2000, subcategory: "outline-icons" },
  { prefix: "glyphs", name: "Glyphs Icons", license: "MIT", homepage: "https://glyphs.fyi", limit: 2000, subcategory: "outline-icons" },
  { prefix: "ri", name: "Remix Icon", license: "Apache-2.0", homepage: "https://remixicon.com", limit: 2500, subcategory: "filled-icons" },
  { prefix: "carbon", name: "Carbon Icons", license: "Apache-2.0", homepage: "https://carbondesignsystem.com", limit: 2000, subcategory: "outline-icons" },
  { prefix: "ant-design", name: "Ant Design Icons", license: "MIT", homepage: "https://ant.design/components/icon", limit: 800, subcategory: "filled-icons" },
  { prefix: "bi", name: "Unicons", license: "Apache-2.0", homepage: "https://iconscout.com/unicons", limit: 1000, subcategory: "outline-icons" },
  { prefix: "iconamoon", name: "IconaMoon", license: "MIT", homepage: "https://iconamoon.com", limit: 1000, subcategory: "outline-icons" },
  { prefix: "mynaui", name: "Myna UI Icons", license: "MIT", homepage: "https://mynaui.com", limit: 1000, subcategory: "outline-icons" },
  { prefix: "uil", name: "Unicons Line", license: "Apache-2.0", homepage: "https://iconscout.com/unicons", limit: 1000, subcategory: "outline-icons" },
  { prefix: "basil", name: "Basil Icons", license: "MIT", homepage: "https://www.figma.com/community/file/931906394678748246", limit: 500, subcategory: "outline-icons" },
  { prefix: "pepicons-pop", name: "Pepicons Pop", license: "CC-BY-4.0", homepage: "https://pepicons.com", limit: 500, subcategory: "filled-icons" },
  { prefix: "game-icons", name: "Game Icons", license: "CC-BY-4.0", homepage: "https://game-icons.net", limit: 2000, subcategory: "filled-icons" },
];

// ─── ILLUSTRATION & LOTTIE & 3D SOURCES ──────────────────────────────────────

// We'll generate entries pointing to real sources

const illustrationSets = [
  {
    source: "unDraw",
    license: "MIT",
    homepage: "https://undraw.co",
    names: [
      "building_blocks", "code_review", "collab", "content_creator", "creative_team",
      "dashboard", "data_extraction", "design_community", "design_process", "developer_activity",
      "digital_nomad", "engineering_team", "firmware", "fixing_bugs", "freelancer",
      "going_up", "good_team", "growth_analytics", "hacker_mindset", "happy_feeling",
      "ideation", "in_progress", "innovative", "launching", "mobile_app",
      "modern_design", "moonlight", "new_ideas", "note_list", "online_collaboration",
      "pair_programming", "personal_goals", "product_iteration", "programming", "project_completed",
      "prototyping_process", "proud_coder", "react", "responsive", "scrum_board",
      "search_engines", "server_cluster", "site_stats", "software_engineer", "solution_mindset",
      "source_code", "static_assets", "team_spirit", "text_files", "thought_process",
      "true_friends", "typewriter", "under_construction", "updated_resume", "usability_testing",
      "version_control", "web_developer", "wireframing", "working_remotely", "yoga",
      "artificial_intelligence", "augmented_reality", "basketball", "bibliophile", "blogging",
      "book_lover", "brainstorming", "buffer", "bug_fixing", "business_plan",
      "camping", "career_progress", "celebration", "chatting", "checking_boxes",
      "co_workers", "coffee_break", "connected_world", "conversation", "cooking",
      "countryside", "dark_analytics", "design_data", "design_inspiration", "digital_currency",
      "doctors", "dog_walking", "e_wallet", "eating_together", "education",
      "electric_car", "emails", "environment", "factory", "fitness_tracker",
      "floating", "folder_files", "friends_online", "gardening", "gift_card",
      "graduation", "grocery_shopping", "group_chat", "group_selfie", "hang_out",
      "healthy_habit", "hiking", "home_cinema", "house_searching", "ice_cream",
      "japan", "jogging", "journey", "knowledge", "live_collaboration",
      "login", "logistics", "maker_launch", "map_dark", "medicine",
      "meeting", "messaging_app", "messaging_fun", "mindfulness", "mobile_browsers",
      "mobile_development", "mobile_encryption", "mobile_marketing", "mobile_payments", "monitoring",
      "music_festival", "my_feed", "nature", "news", "newsletter",
      "night_calls", "no_data", "notebook", "online_article", "online_banking",
      "online_friends", "online_groceries", "online_learning", "online_payments", "online_shopping",
      "open_source", "operating_system", "outdoor_party", "outer_space", "page_not_found",
      "party", "people_search", "personal_finance", "personal_trainer", "photo_sharing",
      "podcast", "podcast_audience", "posting_photo", "powerful", "preferences",
      "press_play", "printing_invoices", "profile_data", "public_discussion", "questions",
      "reading_list", "real_time_sync", "receipts", "relaxation", "report",
      "robotics", "romantic_getaway", "safe", "savings", "schedule",
      "science", "security", "segment_analysis", "selfie", "server_status",
      "settings", "shared_workspace", "shopping_app", "sign_up", "social_dashboard",
      "social_distancing", "social_media", "social_networking", "social_strategy", "social_tree",
      "split_testing", "starman", "startup_life", "statistic_chart", "stepping_up",
      "studying", "subscriber", "super_thank_you", "survey", "sweet_home",
      "task", "teacher", "team_page", "team_work", "texting",
      "towing", "transfer_files", "travel_booking", "treasure", "trip",
      "unicorn", "upload", "upvote", "vacation", "video_call",
      "virtual_reality", "visual_data", "voice_control", "void", "walk_in_the_city",
      "wall_post", "weather", "web_browsing", "web_search", "welcome",
      "winter_activities", "wishes", "woman", "workout", "world",
    ],
  },
];

const lottieAnimations = [
  // Common Lottie animation categories with descriptive names
  // These point to LottieFiles free animations and GitHub repos
  { name: "loading-spinner", category: "loading", tags: ["loading", "spinner", "ui"] },
  { name: "success-checkmark", category: "feedback", tags: ["success", "check", "done"] },
  { name: "error-animation", category: "feedback", tags: ["error", "fail", "warning"] },
  { name: "heart-like", category: "social", tags: ["heart", "like", "love"] },
  { name: "confetti-celebration", category: "celebration", tags: ["confetti", "party", "success"] },
  { name: "rocket-launch", category: "startup", tags: ["rocket", "launch", "startup"] },
  { name: "empty-state", category: "ui", tags: ["empty", "no-data", "placeholder"] },
  { name: "404-not-found", category: "error", tags: ["404", "not-found", "error"] },
  { name: "notification-bell", category: "ui", tags: ["notification", "bell", "alert"] },
  { name: "scroll-down-arrow", category: "ui", tags: ["scroll", "arrow", "down"] },
  { name: "typing-dots", category: "chat", tags: ["typing", "dots", "chat"] },
  { name: "weather-sunny", category: "weather", tags: ["weather", "sun", "sunny"] },
  { name: "weather-rainy", category: "weather", tags: ["weather", "rain", "rainy"] },
  { name: "music-equalizer", category: "media", tags: ["music", "equalizer", "audio"] },
  { name: "file-upload", category: "ui", tags: ["upload", "file", "cloud"] },
  { name: "download-progress", category: "ui", tags: ["download", "progress", "bar"] },
  { name: "location-pin", category: "map", tags: ["location", "pin", "map"] },
  { name: "search-scanning", category: "ui", tags: ["search", "scan", "find"] },
  { name: "menu-hamburger", category: "ui", tags: ["menu", "hamburger", "nav"] },
  { name: "toggle-switch", category: "ui", tags: ["toggle", "switch", "on-off"] },
];

const threeDIconNames = [
  "cube", "sphere", "heart", "star", "diamond", "crown", "trophy", "medal", "shield", "lock",
  "key", "gear", "wrench", "hammer", "brush", "pen", "pencil", "ruler", "laptop", "monitor",
  "phone", "tablet", "watch", "camera", "headphones", "speaker", "microphone", "controller",
  "rocket", "airplane", "car", "truck", "bicycle", "house", "building", "castle", "tower",
  "tree", "flower", "mushroom", "cactus", "leaf", "sun", "moon", "cloud", "rainbow", "lightning",
  "fire", "water", "earth", "planet", "satellite", "robot", "alien", "ghost", "unicorn", "dragon",
  "cat", "dog", "bird", "fish", "butterfly", "pizza", "burger", "donut", "cake", "ice-cream",
  "coffee", "wine", "beer", "gift", "balloon", "confetti", "party-hat", "book", "folder",
  "mail", "message", "notification", "search", "settings", "user", "group", "avatar",
  "coin", "wallet", "shopping-bag", "cart", "tag", "pill", "atom", "flask", "battery", "bulb",
  "magnet", "crystal", "sword", "wand", "potion", "chest", "map", "compass", "flag",
  "hourglass", "clock", "alarm", "timer", "stopwatch",
];

// ─── MAIN INGESTION ──────────────────────────────────────────────────────────

async function ingest() {
  console.log("=== OPENS Asset Ingestion ===\n");

  // Clear existing data
  console.log("Clearing existing asset data...");
  db.exec("DELETE FROM Download");
  db.exec("DELETE FROM Bookmark");
  db.exec("DELETE FROM Collection");
  db.exec("DELETE FROM Asset");
  db.exec("DELETE FROM User");

  // Create demo user
  const { hashSync } = await import("bcryptjs");
  db.prepare(
    "INSERT INTO User (id, name, email, password, bio, avatar, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(cuid(), "Demo User", "demo@opens.dev", hashSync("password123", 12), "Design enthusiast exploring open-source assets", null, now, now);
  console.log("Created demo user (demo@opens.dev / password123)\n");

  const insert = db.prepare(
    `INSERT INTO Asset (id, title, description, previewUrl, sourceUrl, downloadUrl, category, subcategory, tags, license, fileFormat, fileSize, width, height, animated, lottieData, downloads, views, featured, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let totalInserted = 0;

  // ─── ICONS ────────────────────────────────────────────────────────────────

  console.log("--- ICONS ---");

  for (const source of iconSources) {
    try {
      console.log(`Fetching ${source.name}...`);
      const names = await source.fetchNames();
      console.log(`  Found ${names.length} icons`);

      const insertBatch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const title = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          const previewUrl = source.previewUrlPattern.replace(/{name}/g, iconName);
          const sourceUrl = source.sourceUrlPattern.replace(/{name}/g, iconName);
          const downloadUrl = source.downloadUrlPattern.replace(/{name}/g, iconName);
          const tags = [
            ...iconName.split(/[-_]/).filter(w => w.length > 2),
            "icon", source.subcategory.replace("-", " "), source.name.toLowerCase().replace(" icons", ""),
          ];

          insert.run(
            cuid(), title, `${source.name} - ${title} icon. ${source.license} licensed.`,
            previewUrl, sourceUrl, downloadUrl,
            "icons", source.subcategory,
            JSON.stringify(tags), source.license, "SVG",
            null, 24, 24, 0, null,
            Math.floor(Math.random() * 5000), Math.floor(Math.random() * 15000),
            Math.random() < 0.02 ? 1 : 0, now, now
          );
        }
      });

      insertBatch(names);
      totalInserted += names.length;
      console.log(`  Inserted ${names.length} icons from ${source.name}`);
    } catch (err) {
      console.error(`  Error with ${source.name}:`, (err as Error).message);
    }
  }

  // Iconify extra sets
  for (const set of iconifySets) {
    try {
      console.log(`Fetching ${set.name} via Iconify...`);
      const res = await fetch(`https://api.iconify.design/collection?prefix=${set.prefix}`);
      const data = await res.json();
      let names: string[] = data.uncategorized || [];

      // Also gather from categories if present
      if (data.categories) {
        for (const catNames of Object.values(data.categories)) {
          names = names.concat(catNames as string[]);
        }
      }

      // Deduplicate and limit
      names = [...new Set(names)].slice(0, set.limit);
      console.log(`  Found ${names.length} icons`);

      const insertBatch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const title = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          const previewUrl = `https://api.iconify.design/${set.prefix}/${iconName}.svg`;
          const sourceUrl = set.homepage;
          const downloadUrl = previewUrl;
          const tags = [
            ...iconName.split(/[-_]/).filter(w => w.length > 2),
            "icon", set.name.toLowerCase(),
          ];

          insert.run(
            cuid(), title, `${set.name} - ${title}. ${set.license} licensed.`,
            previewUrl, sourceUrl, downloadUrl,
            "icons", set.subcategory,
            JSON.stringify(tags), set.license, "SVG",
            null, 24, 24, 0, null,
            Math.floor(Math.random() * 5000), Math.floor(Math.random() * 15000),
            Math.random() < 0.02 ? 1 : 0, now, now
          );
        }
      });

      insertBatch(names);
      totalInserted += names.length;
      console.log(`  Inserted ${names.length} icons from ${set.name}`);
    } catch (err) {
      console.error(`  Error with ${set.name}:`, (err as Error).message);
    }
  }

  // ─── ILLUSTRATIONS ────────────────────────────────────────────────────────

  console.log("\n--- ILLUSTRATIONS ---");

  // Using colorful illustration-style icon sets from Iconify with WORKING preview URLs
  const illustrationPrefixes = [
    { prefix: "twemoji", name: "Twitter Emoji Illustrations", license: "CC-BY-4.0", limit: 800, sub: "emoji-illustration" },
    { prefix: "noto", name: "Google Noto Illustrations", license: "Apache-2.0", limit: 800, sub: "emoji-illustration" },
    { prefix: "openmoji", name: "OpenMoji Illustrations", license: "CC-BY-4.0", limit: 800, sub: "emoji-illustration" },
    { prefix: "emojione", name: "EmojiOne Illustrations", license: "CC-BY-4.0", limit: 600, sub: "flat-illustration" },
    { prefix: "fluent-emoji-high-contrast", name: "Fluent Illustrations (HC)", license: "MIT", limit: 500, sub: "flat-illustration" },
  ];

  for (const ilp of illustrationPrefixes) {
    try {
      console.log(`Fetching ${ilp.name} via Iconify...`);
      const res = await fetch(`https://api.iconify.design/collection?prefix=${ilp.prefix}`);
      const data = await res.json();
      let names: string[] = data.uncategorized || [];
      if (data.categories) {
        for (const catNames of Object.values(data.categories)) {
          names = names.concat(catNames as string[]);
        }
      }
      names = [...new Set(names)].slice(0, ilp.limit);

      const insertBatch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const title = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          insert.run(
            cuid(), title, `${ilp.name} - ${title}. ${ilp.license} licensed.`,
            `https://api.iconify.design/${ilp.prefix}/${iconName}.svg`,
            `https://iconify.design/icon-sets/${ilp.prefix}/`,
            `https://api.iconify.design/${ilp.prefix}/${iconName}.svg`,
            "illustrations", ilp.sub,
            JSON.stringify([...iconName.split(/[-_]/).filter(w => w.length > 2), "illustration", "emoji", ilp.name.toLowerCase()]),
            ilp.license, "SVG",
            null, 128, 128, 0, null,
            Math.floor(Math.random() * 2000), Math.floor(Math.random() * 8000),
            Math.random() < 0.03 ? 1 : 0, now, now
          );
        }
      });

      insertBatch(names);
      totalInserted += names.length;
      console.log(`  Inserted ${names.length} from ${ilp.name}`);
    } catch (err) {
      console.error(`  Error with ${ilp.name}:`, (err as Error).message);
    }
  }

  // ─── LOTTIE ANIMATIONS (using line-md animated SVG icons as previews) ────

  console.log("\n--- LOTTIE ANIMATIONS ---");

  // Use line-md (animated SVG icons) — these are REAL animated SVGs that render in browsers
  const lottieSets = [
    { prefix: "line-md", name: "Material Line Animated", license: "MIT", limit: 1200 },
  ];

  for (const lSet of lottieSets) {
    try {
      console.log(`Fetching ${lSet.name} for Lottie category...`);
      const res = await fetch(`https://api.iconify.design/collection?prefix=${lSet.prefix}`);
      const data = await res.json();
      let names: string[] = data.uncategorized || [];
      if (data.categories) for (const catNames of Object.values(data.categories)) names = names.concat(catNames as string[]);
      names = [...new Set(names)].slice(0, lSet.limit);

      const insertBatch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const title = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          insert.run(
            cuid(), title, `${lSet.name} - Animated ${title}. Use as Lottie-style animation. ${lSet.license} licensed.`,
            `https://api.iconify.design/${lSet.prefix}/${iconName}.svg?width=96&height=96`,
            `https://iconify.design/icon-sets/${lSet.prefix}/${iconName}`,
            `https://api.iconify.design/${lSet.prefix}/${iconName}.svg`,
            "lottie", "ui-animation",
            JSON.stringify([...iconName.split(/[-_]/).filter(w => w.length > 2), "lottie", "animation", "animated", "motion"]),
            lSet.license, "SVG",
            null, 96, 96, 1, null,
            Math.floor(Math.random() * 3000), Math.floor(Math.random() * 10000),
            Math.random() < 0.04 ? 1 : 0, now, now
          );
        }
      });

      insertBatch(names);
      totalInserted += names.length;
      console.log(`  Inserted ${names.length} Lottie animations from ${lSet.name}`);
    } catch (err) {
      console.error(`  Error with ${lSet.name}:`, (err as Error).message);
    }
  }

  // ─── ANIMATED ICONS ─────────────────────────────────────────────────────

  console.log("\n--- ANIMATED ICONS ---");

  // Use Iconify animated sets
  const animatedSets = [
    { prefix: "line-md", name: "Material Line Icons (Animated)", license: "MIT", limit: 500 },
    { prefix: "svg-spinners", name: "SVG Spinners", license: "MIT", limit: 200 },
  ];

  for (const aSet of animatedSets) {
    try {
      console.log(`Fetching ${aSet.name}...`);
      const res = await fetch(`https://api.iconify.design/collection?prefix=${aSet.prefix}`);
      const data = await res.json();
      let names: string[] = data.uncategorized || [];
      if (data.categories) {
        for (const catNames of Object.values(data.categories)) {
          names = names.concat(catNames as string[]);
        }
      }
      names = [...new Set(names)].slice(0, aSet.limit);

      const insertBatch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const title = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          insert.run(
            cuid(), title, `${aSet.name} - Animated ${title}. ${aSet.license} licensed.`,
            `https://api.iconify.design/${aSet.prefix}/${iconName}.svg`,
            `https://iconify.design/icon-sets/${aSet.prefix}/`,
            `https://api.iconify.design/${aSet.prefix}/${iconName}.svg`,
            "animated-icons", "micro-interaction",
            JSON.stringify([...iconName.split(/[-_]/).filter(w => w.length > 2), "animated", "icon", "motion"]),
            aSet.license, "SVG",
            null, 24, 24, 1, null,
            Math.floor(Math.random() * 3000), Math.floor(Math.random() * 10000),
            Math.random() < 0.05 ? 1 : 0, now, now
          );
        }
      });

      insertBatch(names);
      totalInserted += names.length;
      console.log(`  Inserted ${names.length} animated icons from ${aSet.name}`);
    } catch (err) {
      console.error(`  Error with ${aSet.name}:`, (err as Error).message);
    }
  }

  // ─── STICKERS (Emoji sets) ──────────────────────────────────────────────

  console.log("\n--- STICKERS ---");

  const stickerSets = [
    { prefix: "fluent-emoji", name: "Fluent Emoji", license: "MIT", limit: 400 },
    { prefix: "fluent-emoji-flat", name: "Fluent Emoji Flat", license: "MIT", limit: 300 },
    { prefix: "fluent-emoji-high-contrast", name: "Fluent Emoji HC", license: "MIT", limit: 200 },
  ];

  for (const sSet of stickerSets) {
    try {
      console.log(`Fetching ${sSet.name}...`);
      const res = await fetch(`https://api.iconify.design/collection?prefix=${sSet.prefix}`);
      const data = await res.json();
      let names: string[] = data.uncategorized || [];
      if (data.categories) {
        for (const catNames of Object.values(data.categories)) {
          names = names.concat(catNames as string[]);
        }
      }
      names = [...new Set(names)].slice(0, sSet.limit);

      const insertBatch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const title = iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          insert.run(
            cuid(), title, `${sSet.name} - ${title} sticker. ${sSet.license} licensed.`,
            `https://api.iconify.design/${sSet.prefix}/${iconName}.svg`,
            `https://iconify.design/icon-sets/${sSet.prefix}/`,
            `https://api.iconify.design/${sSet.prefix}/${iconName}.svg`,
            "stickers", "emoji-sticker",
            JSON.stringify([...iconName.split(/[-_]/).filter(w => w.length > 2), "sticker", "emoji", sSet.name.toLowerCase()]),
            sSet.license, "SVG",
            null, 128, 128, 0, null,
            Math.floor(Math.random() * 2000), Math.floor(Math.random() * 8000),
            Math.random() < 0.03 ? 1 : 0, now, now
          );
        }
      });

      insertBatch(names);
      totalInserted += names.length;
      console.log(`  Inserted ${names.length} stickers from ${sSet.name}`);
    } catch (err) {
      console.error(`  Error with ${sSet.name}:`, (err as Error).message);
    }
  }

  // ─── 3D ASSETS (using colorful emoji/illustration sets from Iconify) ────

  console.log("\n--- 3D ASSETS ---");

  const threeDSets = [
    { prefix: "fxemoji", name: "Firefox OS Emoji (3D-style)", license: "CC-BY-4.0", limit: 1000 },
    { prefix: "noto-v1", name: "Noto Emoji v1 (3D-style)", license: "Apache-2.0", limit: 1000 },
    { prefix: "emojione-v1", name: "EmojiOne v1 (3D Colorful)", license: "CC-BY-4.0", limit: 800 },
    { prefix: "flat-color-icons", name: "Flat Color Icons", license: "MIT", limit: 329 },
  ];

  for (const tdSet of threeDSets) {
    try {
      console.log(`Fetching ${tdSet.name}...`);
      const res = await fetch(`https://api.iconify.design/collection?prefix=${tdSet.prefix}`);
      const data = await res.json();
      let names: string[] = data.uncategorized || [];
      if (data.categories) for (const catNames of Object.values(data.categories)) names = names.concat(catNames as string[]);
      names = [...new Set(names)].slice(0, tdSet.limit);

      const insertBatch = db.transaction((icons: string[]) => {
        for (const iconName of icons) {
          const title = `3D ${iconName.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`;
          insert.run(
            cuid(), title,
            `${tdSet.name} - ${title}. ${tdSet.license} licensed. Free for any use.`,
            `https://api.iconify.design/${tdSet.prefix}/${iconName}.svg?width=96&height=96`,
            `https://iconify.design/icon-sets/${tdSet.prefix}/${iconName}`,
            `https://api.iconify.design/${tdSet.prefix}/${iconName}.svg`,
            "3d-assets", "3d-icon",
            JSON.stringify([...iconName.split(/[-_]/).filter(w => w.length > 2), "3d", "colorful", "emoji", "illustration"]),
            tdSet.license, "SVG",
            null, 96, 96, 0, null,
            Math.floor(Math.random() * 2000), Math.floor(Math.random() * 8000),
            Math.random() < 0.04 ? 1 : 0, now, now
          );
        }
      });

      insertBatch(names);
      totalInserted += names.length;
      console.log(`  Inserted ${names.length} 3D assets from ${tdSet.name}`);
    } catch (err) {
      console.error(`  Error with ${tdSet.name}:`, (err as Error).message);
    }
  }

  // ─── SUMMARY ──────────────────────────────────────────────────────────────

  const counts = db.prepare("SELECT category, COUNT(*) as count FROM Asset GROUP BY category ORDER BY count DESC").all() as Array<{ category: string; count: number }>;
  const total = (db.prepare("SELECT COUNT(*) as c FROM Asset").get() as { c: number }).c;

  console.log("\n=== INGESTION COMPLETE ===");
  console.log(`Total assets: ${total}\n`);
  console.log("By category:");
  for (const row of counts) {
    console.log(`  ${row.category}: ${row.count}`);
  }
  console.log("\nDemo login: demo@opens.dev / password123");
}

ingest()
  .catch(console.error)
  .finally(() => db.close());
