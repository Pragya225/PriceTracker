// ============================================
// src/services/scraper.js
// ============================================
import { getProductPrice } from "./priceClient.js";
import db from "../db/db.js";

export async function scrapeOne(trackedProduct) {
  const start = Date.now();
  let attempt = 0;
  let lastErr;

  while (attempt < 3) {
    attempt++;
    try {
      const r = await getProductPrice(trackedProduct.external_id);
      if (typeof r.shown !== "number" || r.shown <= 0) {
        throw new Error("invalid price in payload");
      }

      await db.from("price_history").insert({
        product_id: trackedProduct.id,
        price: r.shown,
        mrp: r.mrp,
        sale_price: r.sale ?? null,
        in_stock: r.stock > 0,
        rating: r.rating,
        rating_count: r.ratingCount,
        seller: r.seller,
        delivery_days: r.deliveryDays,
      });

      await db.from("scrape_log").insert({
        product_id: trackedProduct.id,
        status: attempt === 1 ? "success" : "retried",
        attempt_number: attempt,
        duration_ms: Date.now() - start,
      });

      console.log(
        `[scrape] ${trackedProduct.name} -> success (attempt ${attempt})`,
      );
      return;
    } catch (err) {
      lastErr = err;
      console.log(
        `[scrape] ${trackedProduct.name} -> attempt ${attempt} failed: ${err.message}`,
      );
      if (attempt < 3)
        await new Promise((res) => setTimeout(res, 500 * attempt));
    }
  }

  await db.from("scrape_log").insert({
    product_id: trackedProduct.id,
    status: "failed",
    attempt_number: attempt,
    error_message: lastErr.message,
    duration_ms: Date.now() - start,
  });
  console.log(
    `[scrape] ${trackedProduct.name} -> FAILED after ${attempt} attempts`,
  );
}
