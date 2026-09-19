// ============================================
// src/components/ScrapeLogTable.jsx
// ============================================
import "./component.css";
export default function ScrapeLogTable({ log }) {
  if (log.length === 0)
    return <p className="empty-state">No scrape attempts logged yet.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Attempted at</th>
          <th>Status</th>
          <th>Attempt</th>
          <th>Duration</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        {log.map((row) => (
          <tr key={row.id}>
            <td className="num">
              {new Date(row.attempted_at).toLocaleString()}
            </td>
            <td>
              <span className={`status-dot ${row.status}`} />
              {row.status}
            </td>
            <td className="num">{row.attempt_number}</td>
            <td className="num">{row.duration_ms} ms</td>
            <td className="result-meta">{row.error_message || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
