import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductHistory, getProductLog } from "../api.js";
import PriceHistoryTable from "../components/PriceHistoryTable.jsx";
import ScrapeLogTable from "../components/ScrapeLogTable.jsx";
import "./styles/ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getProductHistory(id), getProductLog(id)])
      .then(([historyData, logData]) => {
        setHistory(historyData);
        setLog(logData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="page">Loading…</p>;
  if (error)
    return (
      <p className="page" style={{ color: "var(--red)" }}>
        {error}
      </p>
    );

  const latest = history[history.length - 1];

  return (
    <div className="page">
      <Link to="/dashboard" className="back-link">
        Back to dashboard
      </Link>

      <h1>Product details</h1>

      {latest && (
        <div className="summary-panel">
          <div className="summary-price num">Rs.{latest.price}</div>
          <div className="summary-line">
            <span
              className={`status-dot ${latest.in_stock ? "in-stock" : "out-stock"}`}
            />
            {latest.in_stock ? "In stock" : "Out of stock"}
          </div>
          <dl className="summary-meta">
            <dt>Seller</dt>
            <dd>{latest.seller}</dd>
            <dt>Rating</dt>
            <dd>
              {latest.rating} ({latest.rating_count} reviews)
            </dd>
            <dt>Delivery</dt>
            <dd>{latest.delivery_days} days</dd>
          </dl>
        </div>
      )}

      <h2>Price history</h2>
      <PriceHistoryTable history={history} />

      <h2>Scrape log</h2>
      <ScrapeLogTable log={log} />
    </div>
  );
};

export default ProductDetail;
