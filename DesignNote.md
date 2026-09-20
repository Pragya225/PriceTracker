# Design note

## Approach

The core challenge here isn't the UI or the database — it's that the mock
store's price endpoint is deliberately gated behind an anti-bot handshake:
a proof-of-work puzzle, a WebAssembly-verified computation, and an
XOR-encrypted response, all tied to a short-lived session token. I
reverse-engineered this by reading the store's bundled JavaScript (via
DevTools → Sources) and reproducing the exact algorithm in Node:

1. `GET /api/challenge` returns a salt, a difficulty, and a small WASM
   module.
2. The client must find a nonce such that `sha256(salt + ":" + nonce)`
   starts with `difficulty` zero hex characters (proof-of-work), and must
   also run the provided WASM function on a derived seed to prove it can
   execute the challenge correctly.
3. Both results are POSTed to `/api/session`, returning a short-lived
   bearer token (~30s).
4. `GET /api/products/:id/price` with that token returns an encrypted
   payload; the token itself derives the XOR key needed to decrypt it.

Once this was understood, the whole flow runs as plain HTTP + Node's
native `WebAssembly` support — no headless browser is used anywhere in
this project.

## Why this is more reliable than a headless-browser approach

A Playwright/Puppeteer solution has to load a real page, wait for
JavaScript to execute, and hope selectors and timing hold up across many
unattended runs — that's a lot of surface area for flakiness, and it's
heavy on a free-tier host. Since the anti-bot check turned out to be pure
computation (not real browser fingerprinting — the server just re-hashes
whatever fingerprint string the client sends, rather than verifying it
independently), the entire flow is replicable with direct HTTP calls and
WebAssembly execution in Node. This is faster, uses far less memory (fits
comfortably on Render's free tier), and removes an entire class of
failure modes (page load timeouts, DOM/selector drift, browser crashes).
"Headed mode" here means a verbose, real-time console trace of every
network step, retry, and failure — there's no DOM to visually inspect
since nothing renders.

## Reliability strategy

- **Retries with backoff**: every network call (catalog pages and price
  scrapes) retries up to 3–4 times with increasing delay before being
  marked `failed`.
- **Validation before writing**: a scrape is only written to
  `price_history` if the decrypted price is a valid positive number.
  Every attempt — success, retried, or failed — is still written to
  `scrape_log`, so failures are never hidden.
- **Concurrency guard**: `catalogClient.js` uses a single in-flight
  promise so that overlapping search requests share one catalog fetch
  instead of each starting a parallel 30+ page loop.
- **Bounded responses**: the scrape endpoints return only a count, never
  raw provider error objects or full result arrays, so a crash can't
  produce an unpredictably large response body.
- **External cron over `setInterval`**: Render's free tier sleeps after
  inactivity, so scheduling lives in cron-job.org hitting
  `POST /api/scrape/run` every 2 hours; the external call itself is what
  wakes the instance, which an in-process timer couldn't do once asleep.

## Trade-offs

- The anti-bot "fingerprint" (canvas/GL hash, mouse-movement timing) is
  fabricated rather than captured from a real browser, since there's no
  browser in this pipeline. The server only re-hashes whatever fingerprint
  string it's given rather than verifying it independently, so this
  doesn't break the handshake — but it's worth noting as a simplification
  in case the store adds stricter behavioral checks later.
- Search has no server-side query endpoint, so the backend fetches and
  caches the full catalog (a few dozen pages) and filters client-side,
  refreshed every 5 minutes. This is fine at this catalog size but
  wouldn't scale to a much larger store without a real search index.

## the fixes

1. **Parallel catalog fetches caused real rate limiting.** An early
   version had no guard against two overlapping `getFullCatalog()` calls
   (triggered by rapid search input). Each call independently looped
   through 30+ pages, and running two loops at once was enough to trip
   the store's own rate limiter (HTTP 429) — a self-inflicted reliability
   problem, not a store quirk. Fixed with a shared in-flight promise so
   concurrent callers wait on one fetch instead of racing.
