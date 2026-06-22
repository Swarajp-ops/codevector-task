import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const categories = ["all", "electronics", "fashion", "books", "home", "sports"];

export default function App() {
  const [category, setCategory] = useState("all");
  const [items, setItems] = useState([]);
  const [snapshot, setSnapshot] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadFirstPage = async (selectedCategory = category) => {
    try {
      setLoading(true);
      setError("");

      const url = new URL(`${API}/api/products`);
      url.searchParams.set("limit", "20");
      if (selectedCategory !== "all") {
        url.searchParams.set("category", selectedCategory);
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load products");

      setItems(data.items);
      setSnapshot(data.snapshot);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor) return;

    try {
      setLoading(true);
      setError("");

      const url = new URL(`${API}/api/products`);
      url.searchParams.set("limit", "20");
      url.searchParams.set("snapshot", snapshot);
      url.searchParams.set("cursorUpdatedAt", nextCursor.updatedAt);
      url.searchParams.set("cursorId", nextCursor.id);
      if (category !== "all") {
        url.searchParams.set("category", category);
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to load more");

      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirstPage("all");
  }, []);

  const handleCategoryChange = (value) => {
    setCategory(value);
    loadFirstPage(value);
  };

  return (
    <div className="container">
      <div className="topbar">
        <h1>Product Browser</h1>

        <div className="actions">
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button onClick={() => loadFirstPage(category)} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <p className="hint">
        Browsing a fixed snapshot. Refresh to see newly added or updated products.
      </p>

      {error ? <p className="error">{error}</p> : null}

      <div className="grid">
        {items.map((item) => (
          <div className="card" key={item.id}>
            <div className="row">
              <strong>{item.name}</strong>
              <span>#{item.id}</span>
            </div>
            <div className="row">
              <span>{item.category}</span>
              <span>₹{Number(item.price).toFixed(2)}</span>
            </div>
            <small>Updated: {new Date(item.updated_at).toLocaleString()}</small>
          </div>
        ))}
      </div>

      <div className="footer">
        <button disabled={loading || !nextCursor} onClick={loadMore}>
          {loading ? "Loading..." : nextCursor ? "Load more" : "No more products"}
        </button>
      </div>
    </div>
  );
}