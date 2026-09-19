// ============================================
// index.js  (server folder ke root mein)
// ============================================
import express from "express";
import cors from "cors";
import "dotenv/config";
import routes from "./src/routes/route.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api", routes);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`),
);
