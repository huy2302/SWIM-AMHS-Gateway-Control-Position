import { useEffect } from "react";
import { useMessageStore } from "../store/useMessageStore";

/**
 * Formats a time value to HH:MM format.
 * @param {string|Date} value - The time value to format.
 * @returns {string} Formatted time string or original value if invalid.
 */
const formatTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * MessageTable component that displays a live feed of messages in a table format.
 * Shows message time, flight, type, and status with loading and error states.
 * @returns {JSX.Element} A table displaying message data.
 */
export default function MessageTable() {
  const { messages, loading, error, loadSampleData } = useMessageStore();

  useEffect(() => {
    loadSampleData();
    // If you want to use real API, replace with fetchMessages() and optionally keep interval
    // fetchMessages();
    // const interval = setInterval(() => fetchMessages(), 30000);
    // return () => clearInterval(interval);
  }, [loadSampleData]);

  return (
    <div className="panel">
      <h4>Message Live Feed</h4>
      {loading && <p>Loading data from API...</p>}
      {error && <p className="error">API Error: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Flight</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {messages.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: "center" }}>
                No data available
              </td>
            </tr>
          )}
          {messages.map((msg, index) => (
            <tr key={msg.id || `${msg.flight || "none"}-${index}`}>
              <td>{formatTime(msg.time)}</td>
              <td>{msg.flight || "-"}</td>
              <td>{msg.type || "-"}</td>
              <td className={msg.status === "FAILED" ? "bad" : "ok"}>
                {msg.status || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
