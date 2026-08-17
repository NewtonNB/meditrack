import { useState } from 'react';
import { useApi, getListItems } from '../hooks/useApi';
import { automation as api } from '../api';
import { toast } from 'react-toastify';
import { SkeletonStatCard } from '../Components/Skeleton';

const URGENCY_STYLES = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-gray-100 text-gray-600',
};

const INSIGHT_STYLES = {
  critical: 'border-red-300 bg-red-50 text-red-800',
  warning:  'border-yellow-300 bg-yellow-50 text-yellow-800',
  info:     'border-blue-300 bg-blue-50 text-blue-800',
};

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <i className={`bi ${icon} text-white text-lg`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
      </div>
    </div>
  );
}

export default function Automation() {
  const dashData     = useApi(() => api.dashboard());
  const insightsData = useApi(() => api.quickInsights());
  const { data: sugData, loading, error, refetch } = useApi(() => api.reorderSuggestions());

  const dash     = dashData.data ?? {};
  const insights = insightsData.data?.insights ?? insightsData.data ?? [];
  const items    = getListItems(sugData);
  const summary  = sugData?.summary ?? {};

  const [rowLoading, setRowLoading] = useState({});

  const setLoading = (id, key, val) =>
    setRowLoading(prev => ({ ...prev, [`${id}_${key}`]: val }));

  const isLoading = (id, key) => !!rowLoading[`${id}_${key}`];

  const handleApprove = async (id) => {
    setLoading(id, 'approve', true);
    try {
      await api.reorderAction(id, { action: 'ordered' });
      toast.success('Reorder marked as ordered.');
      refetch();
    } catch {
      toast.error('Failed to process action.');
    } finally {
      setLoading(id, 'approve', false);
    }
  };

  const handleGeneratePO = async (id) => {
    setLoading(id, 'po', true);
    try {
      await api.generatePO(id);
      toast.success('Purchase Order generated successfully.');
      refetch();
    } catch {
      toast.error('Failed to generate Purchase Order.');
    } finally {
      setLoading(id, 'po', false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Smart Automation</h1>
        <p className="text-sm text-gray-500 mt-0.5">AI-powered stock recommendations and reorder management</p>
      </div>

      {/* Dashboard cards */}
      {dashData.loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Suggestions" value={dash.total}    icon="bi-list-check"          color="bg-blue-500"   />
          <StatCard label="Critical"           value={dash.critical} icon="bi-exclamation-octagon" color="bg-red-500"    />
          <StatCard label="High Priority"      value={dash.high}     icon="bi-arrow-up-circle"     color="bg-orange-500" />
          <StatCard label="Ordered"            value={dash.ordered}  icon="bi-check-circle"         color="bg-green-500"  />
        </div>
      )}

      {/* Quick Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <i className="bi bi-lightbulb text-yellow-500" /> Quick Insights
        </h2>
        {insightsData.loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="skeleton-shimmer h-10 rounded-lg" />)}
          </div>
        ) : Array.isArray(insights) && insights.length > 0 ? (
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className={`border rounded-lg px-4 py-2.5 text-sm ${INSIGHT_STYLES[ins.severity] ?? INSIGHT_STYLES.info}`}>
                <span className="font-medium capitalize">{ins.type ?? ins.severity}: </span>
                {ins.message}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <i className="bi bi-check-circle-fill text-green-500" />
            All systems operating normally — no urgent insights.
          </div>
        )}
      </div>

      {/* Reorder Suggestions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Reorder Suggestions</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            AI-powered recommendations based on stock levels and sales history.
            {summary.total > 0 && ` · ${summary.total} suggestion${summary.total !== 1 ? 's' : ''}`}
            {summary.critical > 0 && ` · `}
            {summary.critical > 0 && <span className="text-red-600 font-medium">{summary.critical} critical</span>}
          </p>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton-shimmer h-14 rounded-lg" />)}
          </div>
        ) : error ? (
          <div className="p-5 text-red-500 text-sm">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <i className="bi bi-check-circle text-4xl text-green-300" />
            <p className="text-gray-400 mt-3">No reorder suggestions — all stock levels look good!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  {['Medicine', 'Current Stock', 'Suggested Qty', 'Urgency', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {s.medicine_name ?? s.medicine?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{s.current_stock ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{s.suggested_quantity ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${URGENCY_STYLES[s.urgency_level] ?? URGENCY_STYLES.low}`}>
                        {s.urgency_level ?? 'low'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(s.id)}
                          disabled={isLoading(s.id, 'approve')}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          {isLoading(s.id, 'approve') ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-check" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleGeneratePO(s.id)}
                          disabled={isLoading(s.id, 'po')}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          {isLoading(s.id, 'po') ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-file-earmark-plus" />}
                          Gen PO
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
