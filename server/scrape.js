import { getProductPrice } from "./src/services/priceClient.js";

const productId = process.argv[2];
if (!productId) {
  console.log("Usage: node scrape-demo.js <productId>");
  process.exit(1);
}

async function run() {
  console.log(`\n=== Scraping product ${productId} (headed mode) ===\n`);

  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`[attempt ${attempt}] fetching challenge...`);
    const start = Date.now();

    try {
      const result = await getProductPrice(productId);
      const ms = Date.now() - start;
      console.log(`[attempt ${attempt}] success in ${ms}ms`);
      console.log("\nDecrypted price data:");
      console.log(result);
      return;
    } catch (err) {
      const ms = Date.now() - start;
      console.log(`[attempt ${attempt}] failed after ${ms}ms: ${err.message}`);
      if (attempt < maxAttempts) {
        console.log(`retrying in ${500 * attempt}ms...\n`);
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  console.log(`\nAll ${maxAttempts} attempts failed for product ${productId}.`);
}

run();
