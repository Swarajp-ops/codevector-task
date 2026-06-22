import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.get("/api/products", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    const category =
      req.query.category && req.query.category !== "all"
        ? req.query.category
        : null;

    const snapshot = req.query.snapshot || new Date().toISOString();
    const cursorUpdatedAt = req.query.cursorUpdatedAt || null;
    const cursorId = req.query.cursorId ? Number(req.query.cursorId) : null;

    const { data, error } = await supabase.rpc("get_products_page", {
      p_limit: limit + 1,
      p_category: category,
      p_snapshot: snapshot,
      p_cursor_updated_at: cursorUpdatedAt,
      p_cursor_id: cursorId
    });

    if (error) throw error;

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    const last = items[items.length - 1];

    res.json({
      snapshot,
      items,
      nextCursor:
        hasMore && last
          ? { updatedAt: last.updated_at, id: last.id }
          : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});