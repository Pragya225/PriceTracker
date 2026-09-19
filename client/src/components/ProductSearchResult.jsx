// ============================================
// src/components/ProductSearchResult.jsx
// ============================================
import "./component.css";
export default function ProductSearchResult({ product, isTracked, onTrack }) {
  return (
    <div className="result-row">
      <div>
        <div className="result-name">{product.name}</div>
        <div className="result-meta">
          {product.brand} — {product.category}
        </div>
      </div>
      <button onClick={onTrack} disabled={isTracked}>
        {isTracked ? "Tracked" : "Track"}
      </button>
    </div>
  );
}
