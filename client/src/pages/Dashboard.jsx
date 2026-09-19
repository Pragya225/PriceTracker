import { useEffect, useState } from "react";
import { getTrackedProducts } from "../api.js";
import TrackedProductCard from "../components/TrackedProductCard.jsx";
import "./styles/Dashboard.css";

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTrackedProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page">Loading…</p>;
  if (error)
    return (
      <p className="page" style={{ color: "var(--red)" }}>
        {error}
      </p>
    );

  return (
    <div className="page">
      <h1>Tracked products</h1>
      <p className="search-status">
        Click a product to see its full price history and scrape log.
      </p>

      {products.length === 0 && (
        <p className="empty-state">
          Nothing tracked yet - search for a product first.
        </p>
      )}

      <div>
        {products.map((p) => (
          <TrackedProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};
export default Dashboard;
