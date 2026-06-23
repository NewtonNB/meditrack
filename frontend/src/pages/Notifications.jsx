import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { notifications as api } from '../api';
import { toast } from 'react-toastify';

const priorityColors = { high: 'border-red-400 bg-red-50', medium: 'border-yellow-400 bg-yellow-50', low: 'border-blue-400 bg-blue-50' };

export default function Notifications() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => api.list());
  const items = data?.notifications ?? data?.data ?? data ?? [];

  const markRead = async (id) => {
    try { await api.markRead(id); refetch(); }
    catch { toast.error('Failed to mark as read.'); }
  };

  const markAllRead = async () => {
    try { await api.markAllRead(); toast.success('All marked as read.'); refetch(); }
    catch { toast.error('Failed.'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading notifications…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <i className="bi bi-arrow-left" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        </div>
        <button type="button" onClick={markAllRead} className="text-sm text-blue-600 hover:underline">Mark all as read</button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <i className="bi bi-bell-slash text-4xl text-gray-300" />
          <p className="text-gray-400 mt-3">No notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(n => (
            <div key={n.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${priorityColors[n.priority] ?? 'border-gray-300 bg-white'} ${!n.read ? 'opacity-100' : 'opacity-70'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{n.customIcon ?? '🔔'}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
