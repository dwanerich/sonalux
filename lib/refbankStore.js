import fs from "node:fs/promises";
import path from "node:path";

let CACHE = null;
let LAST_MTIME = 0;

// Change path via env if you want: REFBANK_PATH=/absolute/or/relative/path.json
const DEFAULT_PATH = path.join(process.cwd(), "refbank", "ref_bulk.json");
const REFBANK_PATH = process.env.REFBANK_PATH || DEFAULT_PATH;

function normalizeItem(x = {}) {
  // Map common possible field names → your minimal shape
  let openl3 = x.openl3_vec || x.embedding || x.openl3_embedding || null;
  if (Array.isArray(openl3)) {
    // ok
  } else if (typeof openl3 === "string") {
    // handle "1,2,3" etc.
    openl3 = openl3.split(/[,\s]+/).map(Number).filter(n => Number.isFinite(n));
  } else {
    openl3 = null;
  }
  return {
    title: x.title || x.name || x.song_title || "",
    artist: x.artist || x.artists || "",
    traits: Array.isArray(x.traits) ? x.traits : (Array.isArray(x.tags) ? x.tags : []),
    openl3_vec: openl3,
    audio_url: x.audio_url || x.url || x.audio || null
  };
}

export async function getRefbank() {
  try {
    const stat = await fs.stat(REFBANK_PATH);
    const mtime = stat.mtimeMs;
    if (CACHE && mtime === LAST_MTIME) return CACHE;

    const raw = await fs.readFile(REFBANK_PATH, "utf8");
    let data = JSON.parse(raw);

    // Handle shapes: [{...}], {data:[...]}, etc.
    if (Array.isArray(data)) {
      // ok
    } else if (data && Array.isArray(data.data)) {
      data = data.data;
    } else if (data && Array.isArray(data.items)) {
      data = data.items;
    } else {
      throw new Error("ref_bulk.json format not recognized (expected array).");
    }

    const normalized = data.map(normalizeItem);
    CACHE = normalized;
    LAST_MTIME = mtime;
    return CACHE;
  } catch (e) {
    console.error("RefBank load error:", e.message);
    return [];
  }
}
