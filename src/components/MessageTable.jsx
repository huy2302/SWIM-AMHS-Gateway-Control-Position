import { useEffect } from 'react';
import { useMessageStore } from '../store/useMessageStore';

const formatTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MessageTable() {
  const { messages, loading, error, loadSampleData } = useMessageStore();

  useEffect(() => {
    loadSampleData();
    // Nếu muốn sử dụng API thực tế, thay bằng fetchMessages() và có thể giữ interval
    // fetchMessages();
    // const interval = setInterval(() => fetchMessages(), 30000);
    // return () => clearInterval(interval);
  }, [loadSampleData]);

  return (
    <div className="panel">
      <h4>Message Live Feed</h4>
      {loading && <p>Đang tải dữ liệu từ API...</p>}
      {error && <p className="error">Lỗi API: {error}</p>}
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
              <td colSpan={4} style={{ textAlign: 'center' }}>
                Không có dữ liệu
              </td>
            </tr>
          )}
          {messages.map((msg, index) => (
            <tr key={msg.id || `${msg.flight || 'none'}-${index}`}>
              <td>{formatTime(msg.time)}</td>
              <td>{msg.flight || '-'}</td>
              <td>{msg.type || '-'}</td>
              <td className={msg.status === 'FAILED' ? 'bad' : 'ok'}>{msg.status || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}