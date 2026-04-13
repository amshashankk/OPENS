/** Parse tags from either JSON array string or CSV string */
export function parseTags(raw: unknown): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    if (raw.startsWith("[")) return JSON.parse(raw);
    return raw.split(",").map(t => t.trim()).filter(Boolean);
  } catch {
    return [];
  }
}
