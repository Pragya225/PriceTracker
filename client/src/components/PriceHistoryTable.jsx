// ============================================
// src/components/PriceHistoryTable.jsx
// ============================================
import "./component.css";
export default function PriceHistoryTable({ history }) {
  if (history.length === 0)
    return <p className="empty-state">No price history yet.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Scraped at</th>
          <th>Price</th>
          <th>MRP</th>
          <th>Stock</th>
        </tr>
      </thead>
      <tbody>
        {history.map((row) => (
          <tr key={row.id}>
            <td className="num">{new Date(row.scraped_at).toLocaleString()}</td>
            <td className="num">₹{row.price}</td>
            <td className="num">₹{row.mrp}</td>
            <td>
              <span
                className={`status-dot ${row.in_stock ? "in-stock" : "out-stock"}`}
              />
              {row.in_stock ? "Yes" : "No"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
