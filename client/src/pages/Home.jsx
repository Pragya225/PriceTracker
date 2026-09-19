// ============================================
// src/pages/Home.jsx
// ============================================
import { useState, useEffect } from "react";
import { searchProducts, trackProduct } from "../api.js";
import ProductSearchResult from "../components/ProductSearchResult.jsx";
import "./styles/Home.css";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trackedIds, setTrackedIds] = useState(new Set());

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await searchProducts(query);
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  async function handleTrack(product) {
    try {
      await trackProduct({
        external_id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
      });
      setTrackedIds((prev) => new Set(prev).add(product.id));
    } catch (err) {
      alert("Tracking failed: " + err.message);
    }
  }

  return (
    <div className="page">
      <h1>Find a product to track</h1>

      <input
        type="text"
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, brand, or category"
      />

      {loading && <p className="search-status">Searching…</p>}
      {error && (
        <p className="search-status" style={{ color: "var(--red)" }}>
          {error}
        </p>
      )}

      <div>
        {results.map((product, index) => (
          <ProductSearchResult
            key={`${product.id}-${index}`}
            product={product}
            isTracked={trackedIds.has(product.id)}
            onTrack={() => handleTrack(product)}
          />
        ))}
      </div>

      {!loading && query && results.length === 0 && (
        <p className="search-status">No results found.</p>
      )}
    </div>
  );
}
