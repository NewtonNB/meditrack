import { useState } from 'react';
import { useApi, getListItems } from '../hooks/useApi';
import { auditLogs as api } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const downloadBlob = (data, filename) => {
  const url = URL.createObjectURL(new Blob([data]));
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const ACTION_COLORS = {
  created:  'bg-green-100 text-green-700',
  updated:  'bg-blue-100 text-blue-700',
  deleted:  'bg-red-100 text-red-700',
  login:    'bg-purple-100 text-purple-700',
  logout:   'bg-gray-100 text-gray-600',
  viewed:   'bg-teal-100 text-teal-700',
};

const TABS = [
  { id: 'all',         label: 'All Logs',   icon: 'bi-list-ul' },
  { id: 'security',    label: 'Security',   icon: 'bi-shield-check' },
  { id: 'compliance',  label: 'Compliance', icon: 'bi-file-earmark-check' },
];

export default function AuditLogs() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [page,      setPage]      = useState(1);
  const [perPage]                 = useState(50);

  // Filters
  const [search,   setSearch]   = useState('');
  const [action,   setAction]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [exporting, setExporting] = useState(false);
  const [flagging,  setFlagging]  = useState({});

  const params = {
    page,
    per_page: perPage,
    ...(search   && { search }),
    ...(action   && { action }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo   && { date_to: dateTo }),
  };

  const allLogs  = useApi(() => api.list(params), [page, perPage, search, action, dateFrom, dateTo, activeTab]);
  const secLogs  = useApi(() => api.security(),   [activeTab]);
  const compLogs = useApi(() => api.compliance(), [activeTab]);

  const currentSource = activeTab === 'all' ? allLogs : activeTab === 'security' ? secLogs : compLogs;
  const items       = getListItems(currentSource.data);
  const total       = currentSource.data?.total ?? items.length;
  const currentPage = currentSource.data?.current_page ?? 1;
  const lastPage    = currentSource.data?.last_page ?? 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.export({ search, action, date_from: dateFrom, date_to: dateTo });
      downloadBlob(data, 'audit-logs.csv');
      toast.success('Audit logs exported.');
    } catch {
      toast.error('Failed to export audit logs.');
    } finally {
      setExporting(false);
    }
  };

  const handleFlag = async (id) => {
    setFlagging(prev => ({ ...prev, [id]: true }));
    try {
      await api.flag(id);
      toast.success('Flagged for review.');
    } catch {
      toast.error('Failed to flag entry.');
    } finally {
      setFlagging(prev => ({ ...prev, [id]: false }));
    }
  };

  const clearFilters = () => {
    setSearch(''); setAction(''); setDateFrom(''); setDateTo(''); setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <i className="bi bi-arrow-left" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
            <i className="bi bi-shield-lock mr-1" />Viewing as {user?.role?.replace('_', ' ')}
          </span>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60 transition-colors">
            {exporting ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-download" />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === t.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <i className={`bi ${t.icon}`} />{t.label}
          </button>
        ))}
      </div>

      {/* Filters (all tab only) */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">Search</label>
              <div className="relative">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search description, model…"
                  className="w-full pl-8 pr-3 border border-gray-300 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Action</label>
              <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Actions</option>
                {['created','updated','deleted','login','logout','viewed'].map(a => (
                  <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {(search || action || dateFrom || dateTo) && (
              <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Clear</button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {['User','Action','Model','Description','IP','Date','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentSource.loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {[1,2,3,4,5,6,7].map(c => (
                    <td key={c} className="px-4 py-3"><div className="skeleton-shimmer h-3 rounded w-full" /></td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No audit logs found.</td></tr>
            ) : items.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{l.user?.name ?? 'System'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${ACTION_COLORS[l.action] ?? 'bg-blue-100 text-blue-700'}`}>
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{l.auditable_type?.split('\\').pop() ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{l.description ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{l.ip_address ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleFlag(l.id)} disabled={!!flagging[l.id]}
                    title="Flag for review"
                    className="text-gray-400 hover:text-orange-500 disabled:opacity-40 transition-colors">
                    {flagging[l.id] ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-flag" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Page {currentPage} of {lastPage} · {total} total log{total !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={currentPage <= 1}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <button onClick={() => setPage(p => Math.min(lastPage, p+1))} disabled={currentPage >= lastPage}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
