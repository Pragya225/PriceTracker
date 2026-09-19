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

router.get("/products/search", search);
router.post("/products/track", track);
router.get("/products", list);
router.get("/products/:id/history", history);
router.get("/products/:id/log", log);

router.post("/scrape/run", cronAuth, runAll);
router.post("/scrape/run/:id", cronAuth, runOne);

export default router;
