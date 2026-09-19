// ============================================
// src/services/priceClient.js
// (yehi logic hai jo pehle diya tha, bas import/export mein)
// ============================================
import crypto from "crypto";

const BASE = "https://demo.inelabteamdev.com";
const SECRET = "ine-mock-store-shared-k3y";

function sha256hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function solvePow(salt, difficulty) {
  const target = "0".repeat(difficulty);
  let nonce = 0;
  while (sha256hex(`${salt}:${nonce}`).slice(0, difficulty) !== target) nonce++;
  return nonce;
}

function seedFromSalt(salt, s) {
  return parseInt(sha256hex(`${SECRET}|seed|${salt}|${s}`).slice(0, 8), 16) | 0;
}

function deriveSig(salt, wasmOut, s) {
  return sha256hex(`${SECRET}|derive|${salt}|${wasmOut | 0}|${s}`);
}

async function runWasm(wasmBase64, seed) {
  const bytes = Buffer.from(wasmBase64, "base64");
  const module = await WebAssembly.compile(bytes);
  const instance = await WebAssembly.instantiate(module);
  return instance.exports.f(seed) | 0;
}

function buildFingerprint() {
  const now = Date.now();
  const moves = [];
  let t = now - 1200;
  for (let i = 0; i < 10; i++) {
    moves.push([
      Math.round(100 + Math.random() * 300),
      Math.round(100 + Math.random() * 200),
      t,
    ]);
    t += 60 + Math.floor(Math.random() * 40);
  }
  const env = {
    canvas: crypto.randomBytes(8).toString("hex"),
    gl: crypto.randomBytes(8).toString("hex"),
    hc: 8,
    scr: [1920, 1080, 1],
    frames: Array.from({ length: 8 }, () => 16 + Math.round(Math.random() * 2)),
    at: now,
  };
  const ix = {
    hoverAt: now - 1200,
    dwellMs: 700,
    moves,
    clickAt: now,
    trusted: true,
  };
  return JSON.stringify({ env, ix });
}

function xorDecrypt(base64Cipher, token) {
  const key = crypto
    .createHash("sha256")
    .update(`${SECRET}|enc|${token}`, "utf8")
    .digest();
  const cipher = Buffer.from(base64Cipher, "base64");
  const out = Buffer.alloc(cipher.length);
  for (let i = 0; i < cipher.length; i++)
    out[i] = cipher[i] ^ key[i % key.length];
  const s = JSON.parse(out.toString("utf8"));
  return {
    shown: s.p,
    mrp: s.m,
    sale: s.n,
    badgePct: s.b,
    stock: s.s,
    currency: s.c,
    at: s.t,
    rating: s.r,
    ratingCount: s.rc,
    seller: s.sl,
    deliveryDays: s.dd,
    variant: s.v,
    pending: s.g === 1,
    format: s.f,
    triple: s.x === 1,
  };
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function getProductPrice(productId) {
  const commonHeaders = {
    Referer: `${BASE}/product/${productId}`,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
  };

  const chRes = await fetchWithTimeout(`${BASE}/api/challenge`, {
    headers: commonHeaders,
  });
  if (!chRes.ok) throw new Error(`challenge ${chRes.status}`);
  const challenge = await chRes.json();

  const att = buildFingerprint();
  const s = sha256hex(att);
  const seed = seedFromSalt(challenge.salt, s);
  const wasmOut = await runWasm(challenge.wasm, seed);
  const nonce = solvePow(challenge.salt, challenge.difficulty);
  const derived = deriveSig(challenge.salt, wasmOut, s);

  const sessionBody = { ...challenge, nonce, derived, wasmOut, att, productId };
  const sessRes = await fetchWithTimeout(`${BASE}/api/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      ...commonHeaders,
    },
    body: JSON.stringify(sessionBody),
  });
  if (sessRes.status === 429)
    throw new Error("rate limited (429) on /api/session");
  if (!sessRes.ok) throw new Error(`session ${sessRes.status}`);
  const { token } = await sessRes.json();

  const priceRes = await fetchWithTimeout(
    `${BASE}/api/products/${productId}/price`,
    {
      headers: { Authorization: `Bearer ${token}`, ...commonHeaders },
    },
  );
  if (priceRes.status === 401 || priceRes.status === 403)
    throw new Error(`auth rejected ${priceRes.status}`);
  if (!priceRes.ok) throw new Error(`price ${priceRes.status}`);
  const payload = await priceRes.json();

  return xorDecrypt(payload.e, token);
}
