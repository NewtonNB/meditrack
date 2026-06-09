import { useApi } from '../hooks/useApi';
import { auditLogs as api } from '../api';

export default function AuditLogs() {
  const { data, loading, error } = useApi(() => api.list());
  const items = data?.data ?? data ?? [];

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading audit logs…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {['User','Action','Model','Description','IP','Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No audit logs found.</td></tr>
            ) : items.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{l.user?.name ?? 'System'}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{l.action}</span></td>
                <td className="px-4 py-3 text-gray-500">{l.auditable_type?.split('\\').pop()}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{l.description ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400">{l.ip_address ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
