// ============================================
// src/api.js
// Saari backend calls ek jagah — koi bhi component isse import karega
// ============================================
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function searchProducts(query) {
  const res = await fetch(
    `${BASE_URL}/products/search?q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function trackProduct({ external_id, name, brand, category }) {
  const res = await fetch(`${BASE_URL}/products/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ external_id, name, brand, category }),
  });
  if (!res.ok) throw new Error("Tracking failed");
  return res.json();
}

export async function getTrackedProducts() {
  const res = await fetch(`${BASE_URL}/products`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function getProductHistory(id) {
  const res = await fetch(`${BASE_URL}/products/${id}/history`);
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

export async function getProductLog(id) {
  const res = await fetch(`${BASE_URL}/products/${id}/log`);
  if (!res.ok) throw new Error("Failed to load log");
  return res.json();
}
