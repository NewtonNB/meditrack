import { useState } from 'react';
import { useApi, getListItems } from '../hooks/useApi';
import { auditLogs as api } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuditLogs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);
  const { data, loading, error } = useApi(() => api.list({ page, per_page: perPage }), [page, perPage]);
  const items = getListItems(data);
  const total = data?.total ?? items.length;
  const currentPage = data?.current_page ?? 1;
  const lastPage = data?.last_page ?? 1;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading audit logs…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <i className="bi bi-arrow-left" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
          <i className="bi bi-shield-lock mr-1" />Viewing as {user?.role?.replace('_', ' ')}
        </span>
      </div>
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
        {items.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              Page {currentPage} of {lastPage} · {total} total log{total !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage(p => Math.max(1, p-1))} disabled={currentPage <= 1} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button type="button" onClick={() => setPage(p => Math.min(lastPage, p+1))} disabled={currentPage >= lastPage} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
