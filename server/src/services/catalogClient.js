// src/services/catalogClient.js
const BASE = "https://demo.inelabteamdev.com";
const PAGE_SIZE = 20;
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = { items: null, fetchedAt: 0 };
let inFlight = null; // holds the current in-progress fetch promise, if any

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchCatalogPage(page, maxAttempts = 4) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(
        `${BASE}/api/catalog?page=${page}&pageSize=${PAGE_SIZE}`,
        {
          headers: { Referer: `${BASE}/` },
        },
      );

      if (res.status === 429) {
        // real rate limit — back off much longer, this is the store telling
        // us to slow down, not a random flaky failure
        const wait = 1500 * attempt;
        console.log(
          `[catalog] page ${page} rate limited (429), waiting ${wait}ms`,
        );
        await sleep(wait);
        throw new Error(`catalog page ${page} -> 429`);
      }

      if (!res.ok) throw new Error(`catalog page ${page} -> ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      console.log(
        `[catalog] page ${page} attempt ${attempt} failed: ${err.message}`,
      );
      if (attempt < maxAttempts && !err.message.includes("429")) {
        await sleep(400 * attempt);
      }
    }
  }
  throw lastErr;
}

async function fetchAllPages() {
  const first = await fetchCatalogPage(1);
  let items = [...first.items];
  const totalPages = first.pages;

  for (let p = 2; p <= totalPages; p++) {
    // small gap between every page, even on success — avoids tripping
    // the rate limiter in the first place instead of just reacting to it
    await sleep(150);
    const page = await fetchCatalogPage(p);
    items = items.concat(page.items);
  }

  return items;
}

export async function getFullCatalog() {
  const now = Date.now();
  if (cache.items && now - cache.fetchedAt < CACHE_TTL_MS) return cache.items;

  // if a fetch is already running, wait for that one instead of starting
  // a second parallel loop — this is what was causing the 429 storm
  if (inFlight) return inFlight;

  inFlight = fetchAllPages()
    .then((items) => {
      cache = { items, fetchedAt: Date.now() };
      inFlight = null;
      return items;
    })
    .catch((err) => {
      inFlight = null; // let a future call retry instead of getting stuck
      throw err;
    });

  return inFlight;
}

export async function searchProducts(query) {
  const items = await getFullCatalog();
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)),
  );
}

export async function getProductDetail(productId) {
  const res = await fetch(`${BASE}/api/product/${productId}`, {
    headers: { Referer: `${BASE}/product/${productId}` },
  });
  if (!res.ok) throw new Error(`product ${productId} -> ${res.status}`);
  return res.json();
}
