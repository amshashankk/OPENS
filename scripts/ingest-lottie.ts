/**
 * Fetches 10,000+ free Lottie animations from LottieFiles public GraphQL API
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

const GRAPHQL_URL = "https://graphql.lottiefiles.com/2022-08";

async function fetchPage(cursor: string | null, queryType: string): Promise<{ animations: any[]; nextCursor: string | null }> {
  const afterClause = cursor ? `, after: "${cursor}"` : "";

  let query: string;
  if (queryType === "featured") {
    query = `{ featuredPublicAnimations(first: 50${afterClause}) { edges { node { id name lottieUrl jsonUrl gifUrl } cursor } pageInfo { hasNextPage endCursor } } }`;
  } else if (queryType === "recent") {
    query = `{ recentPublicAnimations(first: 50${afterClause}) { edges { node { id name lottieUrl jsonUrl gifUrl } cursor } pageInfo { hasNextPage endCursor } } }`;
  } else {
    query = `{ popularPublicAnimations(first: 50${afterClause}) { edges { node { id name lottieUrl jsonUrl gifUrl } cursor } pageInfo { hasNextPage endCursor } } }`;
  }

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  const key = Object.keys(data.data || {})[0];
  if (!key || !data.data[key]) return { animations: [], nextCursor: null };

  const edges = data.data[key].edges || [];
  const pageInfo = data.data[key].pageInfo || {};

  return {
    animations: edges.map((e: any) => e.node).filter((n: any) => n.jsonUrl),
    nextCursor: pageInfo.hasNextPage ? pageInfo.endCursor : null,
  };
}

async function ingest() {
  // Clear existing lottie
  const deleted = db.prepare("DELETE FROM Asset WHERE category = 'lottie'").run();
  console.log(`Cleared ${deleted.changes} existing Lottie assets\n`);

  let totalAdded = 0;
  const seen = new Set<number>();

  for (const queryType of ["featured", "popular", "recent"]) {
    console.log(`--- Fetching ${queryType} animations ---`);
    let cursor: string | null = null;
    let pages = 0;

    while (pages < 500) {
      // Keep going until API returns no more
      try {
        const { animations, nextCursor } = await fetchPage(cursor, queryType);

        if (animations.length === 0) break;

        const batch = db.transaction((anims: any[]) => {
          for (const anim of anims) {
            if (seen.has(anim.id)) continue;
            seen.add(anim.id);

            const title = anim.name || `Lottie Animation ${anim.id}`;
            const tags = title
              .toLowerCase()
              .split(/[\s\-_,]+/)
              .filter((w: string) => w.length > 2)
              .slice(0, 6);
            tags.push("lottie", "animation", "json");

            // Use GIF as preview (visible in <img>), JSON as download
            const previewUrl = anim.gifUrl || anim.jsonUrl;
            const downloadUrl = anim.jsonUrl;
            const sourceUrl = `https://lottiefiles.com/animations/${anim.id}`;

            insert.run(
              cuid(),
              title,
              `Free Lottie animation: ${title}. From LottieFiles public library.`,
              previewUrl,
              sourceUrl,
              downloadUrl,
              "lottie",
              "ui-animation",
              JSON.stringify(tags),
              "CC-BY-4.0",
              "JSON",
              null, null, null, 1, null,
              0, 0,
              Math.random() < 0.03 ? 1 : 0,
              now, now
            );

            totalAdded++;
          }
        });

        batch(animations);

        pages++;
        cursor = nextCursor;

        if (pages % 10 === 0) {
          console.log(`  ${queryType} page ${pages}: ${totalAdded} total unique`);
        }

        if (!cursor) break;

        // Small delay to be respectful
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.error(`  Error on page ${pages}:`, (err as Error).message);
        break;
      }
    }
  }

  const count = (db.prepare("SELECT COUNT(*) as c FROM Asset WHERE category = 'lottie'").get() as { c: number }).c;
  console.log(`\n=== LOTTIE INGESTION COMPLETE ===`);
  console.log(`Total Lottie animations: ${count}`);

  // Show overall category counts
  const counts = db.prepare("SELECT category, COUNT(*) as c FROM Asset GROUP BY category ORDER BY c DESC").all() as any[];
  console.log("\nAll categories:");
  counts.forEach((r: any) => console.log(`  ${r.category}: ${r.c}`));
}

ingest()
  .catch(console.error)
  .finally(() => db.close());
