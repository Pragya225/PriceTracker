# INE Price Tracker

A full-stack web application that lets a user search INE's mock storefront, track a
product, and automatically scrapes its price and stock every 2 hours. Tracked price
history and a full scrape log are shown per product.

## Live links

- Frontend: https://price-tracker-ruby-omega.vercel.app
- Backend: https://ine-price-tracker-backend-mawp.onrender.com

## Tech stack

- **Frontend:** React (Vite), deployed on Vercel
- **Backend:** Node.js + Express, deployed on Render
- **Database:** Supabase (PostgreSQL)
- **Scheduling:** cron-job.org, hitting `/api/scrape/run` every 2 hours
- **Scraping:** direct HTTP calls from Node — no headless browser. The target
  store gates its price endpoint behind a proof-of-work + WebAssembly + XOR-encrypted
  response challenge, which is solved and decrypted natively in Node
  (`src/services/priceClient.js`). See the DesignNote.md for details.

## Project structure

```
server/   Express backend (routes, controllers, services, Supabase client)
client/   React frontend (Vite)
```

## Setup — backend

```
cd server
npm install
```

Create `server/.env`:

```
PORT=3000
SUPABASE_URL=<your Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<your Supabase service_role key>
CRON_SECRET=<any random string — protects the scrape endpoints>
FRONTEND_ORIGIN=<your deployed frontend URL>
```

Run the Supabase schema (SQL Editor):

```sql
create table tracked_products (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  name text not null,
  category text,
  brand text,
  created_at timestamptz default now(),
  scrape_interval_minutes int default 120
);

create table price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references tracked_products(id) on delete cascade,
  price numeric not null,
  mrp numeric,
  sale_price numeric,
  in_stock boolean not null,
  rating numeric,
  rating_count int,
  seller text,
  delivery_days int,
  scraped_at timestamptz default now()
);

create table scrape_log (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references tracked_products(id) on delete cascade,
  attempted_at timestamptz default now(),
  status text check (status in ('success','retried','failed')),
  attempt_number int,
  error_message text,
  duration_ms int
);

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
```

Start the server:

```
node index.js
```

## Setup — frontend

```
cd client
npm install
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:3000/api
```

Run:

```
npm run dev
```

## Environment variables — full list

| Variable | Where | Purpose |
|---|---|---|
| `SUPABASE_URL` | backend | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | Full-access key for the backend to read/write tables |
| `CRON_SECRET` | backend | Shared secret checked on `/api/scrape/run*`, so only the cron job can trigger scrapes |
| `FRONTEND_ORIGIN` | backend | Allowed CORS origin (the deployed frontend URL) |
| `VITE_API_URL` | frontend | Base URL of the backend API |

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/products/search?q=` | Search the store's catalog |
| POST | `/api/products/track` | Start tracking a product |
| GET | `/api/products` | List tracked products with their latest price |
| GET | `/api/products/:id/history` | Full price/stock history for a product |
| GET | `/api/products/:id/log` | Full scrape attempt log for a product |
| POST | `/api/scrape/run` | Scrapes every tracked product (cron target, requires `x-cron-secret` header) |
| POST | `/api/scrape/run/:id` | Scrapes a single product (requires `x-cron-secret` header) |

## Scraping schedule

The scraper runs **every 2 hours**, triggered by an external cron service
(cron-job.org) sending `POST /api/scrape/run` with an `x-cron-secret` header.
An external trigger is used instead of an in-process interval because Render's
free tier puts the backend to sleep during inactivity — an in-process
`setInterval` would stop once the instance sleeps, whereas the external cron
call itself is what wakes the instance back up.

Each scrape attempt retries up to 3 times with backoff before being logged as
`failed`. Only validated, successful reads are written to `price_history`;
every attempt (success, retried, or failed) is written to `scrape_log`.

## Reliability notes

- Every scrape (price and catalog) uses retry-with-backoff; a run is only
  logged `success`/`retried`/`failed` after real validation of the response —
  bad or incomplete data is never written to `price_history`.
- Concurrent catalog fetches are deduplicated (an in-flight lock) after we
  found that parallel calls were triggering rate limiting (HTTP 429) from the
  store.
- See `DesignNote.md` for the full reliability strategy and trade-offs.
