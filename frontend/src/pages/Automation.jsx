import { useNavigate } from 'react-router-dom';
import { useApi, getListItems } from '../hooks/useApi';
import { automation as api } from '../api';
import { toast } from 'react-toastify';

export default function Automation() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(() => api.reorderSuggestions());
  const items = getListItems(data);
  const summary = data?.summary;

  const handleAction = async (id) => {
    try {
      await api.reorderAction(id, { action: 'ordered' });
      toast.success('Reorder marked as ordered.');
      refetch();
    } catch {
      toast.error('Failed to process action.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading automation…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <i className="bi bi-arrow-left" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Automation</h1>
            <p className="text-sm text-gray-500">AI-powered recommendations based on stock levels and sales history.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Reorder Suggestions</h2>
          <p className="text-sm text-gray-500 mt-1">AI-powered recommendations based on stock levels and sales history.</p>
          {summary && (
            <p className="text-xs text-gray-400 mt-2">
              {summary.total} suggestion{summary.total !== 1 ? 's' : ''}
              {summary.critical > 0 && ` · ${summary.critical} critical`}
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center">
            <i className="bi bi-check-circle text-4xl text-green-300" />
            <p className="text-gray-400 mt-3">No reorder suggestions — all stock levels look good!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map(s => (
              <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{s.medicine_name ?? s.medicine?.name}</p>
                  <p className="text-sm text-gray-500">Current: {s.current_stock} • Suggested order: {s.suggested_quantity}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  s.urgency_level === 'critical' ? 'bg-red-100 text-red-700' :
                  s.urgency_level === 'high'     ? 'bg-orange-100 text-orange-700' :
                                                   'bg-yellow-100 text-yellow-700'
                }`}>{s.urgency_level}</span>
                <button
                  onClick={() => handleAction(s.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
