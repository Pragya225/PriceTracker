// src/routes/route.js
// Sab routes ek hi jagah — chhote project ke liye ye kaafi hai.

import { Router } from "express";
const router = Router();

import {
  search,
  track,
  list,
  history,
  log,
} from "../controllers/productController.js";
import { runAll, runOne } from "../controllers/scrapeController.js";
import cronAuth from "../middleware/cronAuth.js";

// ---------- PRODUCT ROUTES ----------
// koi middleware nahi chahiye, koi bhi public search/dekh sakta hai
router.get("/products/search", search);
router.post("/products/track", track);
router.get("/products", list);
router.get("/products/:id/history", history);
router.get("/products/:id/log", log);

// ---------- SCRAPE ROUTES ----------
// yahan cronAuth middleware lagaya hai — bina sahi secret ke koi ye
// routes nahi chala payega, warna koi bhi bar-bar scrape trigger kar
// sakta hai aur mock store ko spam kar dega
router.post("/scrape/run", cronAuth, runAll);
router.post("/scrape/run/:id", cronAuth, runOne);

export default router;

// ============================================
// index.js mein isko attach kaise karna hai
// ============================================
// const express = require('express');
// const app = express();
// app.use(express.json());
// app.use('/api', require('./src/routes/route'));
//
// Notice: yahan '/api' prefix diya hai, isliye upar wale sab routes
// ke aage khud '/api' lag jaayega. Matlab:
//   router.get('/products/search', ...)  ->  actual URL: /api/products/search
//   router.post('/scrape/run', ...)      ->  actual URL: /api/scrape/run
