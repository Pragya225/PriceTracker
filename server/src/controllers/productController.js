// ============================================
// src/controllers/productController.js
// ============================================
import { searchProducts, getProductDetail } from "../services/catalogClient.js";
import { scrapeOne } from "../services/scraper.js";
import db from "../db/db.js";

export const search = async (req, res) => {
  try {
    const results = await searchProducts(req.query.q || "");
    res.json(results.slice(0, 30));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};

export const track = async (req, res) => {
  const { external_id, name, brand, category } = req.body;
  if (!external_id || !name)
    return res.status(400).json({ error: "external_id and name required" });

  const { data: existing } = await db
    .from("tracked_products")
    .select("id")
    .eq("external_id", String(external_id))
    .maybeSingle();
  if (existing) return res.json(existing);

  const { data, error } = await db
    .from("tracked_products")
    .insert({ external_id: String(external_id), name, brand, category })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  scrapeOne(data).catch(() => {});
  res.json(data);
};

export const list = async (req, res) => {
  const { data: products, error } = await db
    .from("tracked_products")
    .select("*");
  if (error) return res.status(500).json({ error: error.message });

  const withLatest = await Promise.all(
    products.map(async (p) => {
      const { data: latest } = await db
        .from("price_history")
        .select("*")
        .eq("product_id", p.id)
        .order("scraped_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { ...p, latest: latest || null };
    }),
  );
  res.json(withLatest);
};

export const history = async (req, res) => {
  const { data, error } = await db
    .from("price_history")
    .select("*")
    .eq("product_id", req.params.id)
    .order("scraped_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const log = async (req, res) => {
  const { data, error } = await db
    .from("scrape_log")
    .select("*")
    .eq("product_id", req.params.id)
    .order("attempted_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};
