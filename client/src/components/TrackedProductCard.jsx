import { Link } from "react-router-dom";
import "./component.css";

const TrackedProductCard = ({ product }) => {
  const latest = product.latest;

  return (
    <Link to={`/product/${product.id}`} className="tracked-row">
      <div className="tracked-row-inner">
        <div>
          <div className="result-name">{product.name}</div>
          <div className="result-meta">
            {product.brand} - {product.category}
          </div>
        </div>

        {latest ? (
          <div className="price-cell">
            <div className="price-value num">Rs.{latest.price}</div>
            <div className="price-sub">
              <span
                className={`status-dot ${latest.in_stock ? "in-stock" : "out-stock"}`}
              />
              {latest.in_stock ? "In stock" : "Out of stock"}
            </div>
            <div className="price-sub num">
              {new Date(latest.scraped_at).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="price-sub">No price data yet</div>
        )}
      </div>
    </Link>
  );
};

export default TrackedProductCard;
