// ============================================
// src/controllers/scrapeController.js
// ============================================
import db2 from "../db/db.js";
import { scrapeOne as scrapeOneProduct } from "../services/scraper.js";

export const runAll = async (req, res) => {
  const { data: products, error } = await db2
    .from("tracked_products")
    .select("*");
  if (error) return res.status(500).json({ error: error.message });

  const results = [];
  for (const p of products) {
    await scrapeOneProduct(p);
    results.push(p.external_id);
    await new Promise((r) => setTimeout(r, 300));
  }
  res.json({ scraped: results.length, productIds: results });
};

export const runOne = async (req, res) => {
  const { data: p, error } = await db2
    .from("tracked_products")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (error || !p) return res.status(404).json({ error: "not tracked" });
  await scrapeOneProduct(p);
  res.json({ ok: true });
};
