import { useState, useEffect } from 'react';
import { useApi, getListItems } from '../hooks/useApi';
import { ai as aiApi, medicines as medsApi } from '../api';
import { toast } from 'react-toastify';

// ── helpers ────────────────────────────────────────────────────────────────────
const riskColor = (score) => {
  const n = Number(score);
  if (n >= 0.8) return 'bg-red-100 text-red-700';
  if (n >= 0.6) return 'bg-orange-100 text-orange-700';
  if (n >= 0.4) return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
};

const statusColors = {
  pending:       'bg-yellow-100 text-yellow-700',
  investigating: 'bg-blue-100 text-blue-700',
  resolved:      'bg-green-100 text-green-700',
  false_positive:'bg-gray-100 text-gray-600',
  acknowledged:  'bg-blue-100 text-blue-700',
};

const TABS = [
  { id: 'overview',    label: 'Overview',           icon: 'bi-grid' },
  { id: 'predictions', label: 'Stock Predictions',  icon: 'bi-graph-up-arrow' },
  { id: 'anomalies',   label: 'Anomaly Detection',  icon: 'bi-shield-exclamation' },
  { id: 'expiry',      label: 'Expiry Alerts',       icon: 'bi-clock-history' },
  { id: 'admin',       label: 'Admin',              icon: 'bi-gear' },
];

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

// ── Tab: Overview ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const health    = useApi(() => aiApi.health());
  const dashboard = useApi(() => aiApi.anomalyDashboard());

  const h    = health.data ?? {};
  const dash = dashboard.data?.dashboard ?? {};
  const sum  = dash.summary ?? {};
  const recentHighRisk = dash.recent_high_risk ?? [];

  const isHealthy  = h.overall_health === 'healthy';
  const isDegraded = h.overall_health === 'degraded';

  return (
    <div className="space-y-6">
      {/* Health Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <i className="bi bi-activity text-blue-500" /> AI Service Health
        </h3>
        {health.loading ? (
          <div className="skeleton-shimmer h-10 rounded-lg" />
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${
              isHealthy ? 'bg-green-100 text-green-700' : isDegraded ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <i className={`bi ${isHealthy ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} mr-2`} />
              {h.overall_health ?? 'Unknown'}
            </span>
            {h.services && Object.entries(h.services).map(([svc, ok]) => (
              <span key={svc} className={`text-xs px-2 py-1 rounded-full ${ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                <i className={`bi ${ok ? 'bi-check' : 'bi-x'} mr-1`} />{svc.replace(/_/g,' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Anomaly summary cards */}
      {dashboard.loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="skeleton-shimmer h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Anomalies"   value={sum.total_anomalies}   icon="bi-bug"             color="bg-blue-500"   />
          <StatCard label="Pending Review"     value={sum.pending_review}    icon="bi-hourglass-split" color="bg-yellow-500" />
          <StatCard label="High Risk"          value={sum.high_risk}         icon="bi-shield-x"        color="bg-red-500"    />
          <StatCard label="Resolved Today"     value={sum.resolved_today}    icon="bi-check-circle"    color="bg-green-500"  />
        </div>
      )}

      {/* Recent high-risk */}
      {recentHighRisk.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Recent High-Risk Anomalies</h3>
          <div className="space-y-2">
            {recentHighRisk.map((a, i) => (
              <div key={a.id ?? i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{a.anomaly_type?.replace(/_/g,' ')}</p>
                  <p className="text-xs text-gray-500">{a.detected_at ? new Date(a.detected_at).toLocaleString() : '—'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColor(a.risk_score)}`}>
                  Risk: {(Number(a.risk_score)*100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Stock Predictions ─────────────────────────────────────────────────────
function PredictionsTab() {
  const [medSearch, setMedSearch] = useState('');
  const [meds, setMeds]           = useState([]);
  const [selected, setSelected]   = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [trends, setTrends]         = useState(null);
  const [loadingPred, setLoadingPred] = useState(false);

  useEffect(() => {
    medsApi.list({ per_page: 100 }).then(res => {
      const list = res.data?.data ?? res.data ?? [];
      setMeds(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  const selectMedicine = async (med) => {
    setSelected(med);
    setPrediction(null);
    setTrends(null);
    setLoadingPred(true);
    try {
      const [predRes, trendRes] = await Promise.allSettled([
        aiApi.stockPrediction(med.id),
        aiApi.seasonalTrends(med.id),
      ]);
      if (predRes.status === 'fulfilled') setPrediction(predRes.value.data);
      if (trendRes.status === 'fulfilled') setTrends(trendRes.value.data);
    } catch { /* handled per-call */ }
    finally { setLoadingPred(false); }
  };

  const filtered = meds.filter(m =>
    m.name?.toLowerCase().includes(medSearch.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Medicine list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="text" value={medSearch} onChange={e => setMedSearch(e.target.value)}
              placeholder="Search medicines…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="overflow-y-auto max-h-96 divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center">No medicines found.</p>
          ) : filtered.slice(0, 30).map(m => (
            <button key={m.id} onClick={() => selectMedicine(m)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-blue-50 flex items-center justify-between ${selected?.id === m.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}>
              <span>{m.name}</span>
              {selected?.id === m.id && <i className="bi bi-chevron-right text-blue-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Prediction panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <i className="bi bi-graph-up-arrow text-4xl text-gray-200" />
            <p className="text-gray-400 mt-3 text-sm">Select a medicine to see its AI demand prediction</p>
          </div>
        ) : loadingPred ? (
          <div className="space-y-4">
            <div className="skeleton-shimmer h-6 rounded w-48" />
            {[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer h-4 rounded" />)}
          </div>
        ) : (
          <div className="space-y-5">
            <h3 className="font-semibold text-gray-900">{selected.name}</h3>

            {prediction && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Demand Prediction (30 days)</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Predicted Demand',    value: prediction.prediction?.predicted_demand ?? prediction.predicted_demand ?? '—' },
                    { label: 'Confidence',           value: prediction.prediction?.confidence != null
                        ? `${(prediction.prediction.confidence * 100).toFixed(0)}%`
                        : prediction.confidence != null
                        ? `${(prediction.confidence * 100).toFixed(0)}%`
                        : '—' },
                    { label: 'Recommended Action',   value: (prediction.prediction?.recommended_action ?? prediction.recommended_action ?? '—').replace(/_/g, ' ') },
                    { label: 'Safety Stock',         value: prediction.prediction?.safety_stock ?? prediction.safety_stock ?? '—' },
                    { label: 'Method',               value: (prediction.prediction?.method ?? prediction.method ?? '—').replace(/_/g, ' ') },
                    { label: 'Current Stock',        value: selected?.stock ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">{String(value)}</p>
                    </div>
                  ))}
                </div>
                {(prediction.prediction?.message ?? prediction.message) && (
                  <p className="text-xs text-gray-400 mt-2 italic">
                    {prediction.prediction?.message ?? prediction.message}
                  </p>
                )}
              </div>
            )}

            {trends && !trends.error && (trends.monthly_trends || trends.trends) && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Monthly Sales Trends</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {Object.entries(trends.monthly_trends ?? trends.trends ?? {}).map(([month, val]) => {
                    const num = Number(val);
                    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    const label = months[parseInt(month) - 1] ?? month;
                    const max = Math.max(...Object.values(trends.monthly_trends ?? trends.trends ?? {}).map(Number), 1);
                    const pct = Math.round((num / max) * 100);
                    return (
                      <div key={month} className="flex items-center gap-3 text-sm py-1">
                        <span className="w-8 text-gray-500 text-xs">{label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right font-medium text-gray-700 text-xs">{num.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
                {trends.peak_periods?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">Peak Periods</p>
                    <div className="flex flex-wrap gap-1">
                      {trends.peak_periods.map((p, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          {p.period} ({p.avg_sales?.toFixed(1)}/day)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {trends?.error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-700">
                  <i className="bi bi-info-circle mr-1" />
                  Seasonal analysis needs at least 1 year of sales data for this medicine.
                </p>
              </div>
            )}

            {!prediction && !trends && (
              <p className="text-sm text-gray-400 text-center py-6">Loading prediction data…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Anomaly Detection ─────────────────────────────────────────────────────
function AnomaliesTab() {
  const { data, loading, error, refetch } = useApi(() => aiApi.anomalies());
  const anomalies = data?.anomalies ?? getListItems(data);

  const [statusFilter, setStatusFilter] = useState('');
  const [txFilter,     setTxFilter]     = useState('');
  const [reviewing,    setReviewing]    = useState(null); // { id, anomaly }
  const [reviewForm,   setReviewForm]   = useState({ status: 'investigating', notes: '' });
  const [submitting,   setSubmitting]   = useState(false);

  const filtered = anomalies.filter(a =>
    (!statusFilter || a.status === statusFilter) &&
    (!txFilter     || a.transaction_type === txFilter)
  );

  const openReview = (a) => { setReviewing(a); setReviewForm({ status: 'investigating', notes: '' }); };

  const submitReview = async () => {
    if (!reviewForm.notes.trim()) { toast.error('Notes are required.'); return; }
    setSubmitting(true);
    try {
      await aiApi.reviewAnomaly(reviewing.id, reviewForm);
      toast.success('Anomaly reviewed.');
      setReviewing(null);
      refetch();
    } catch { toast.error('Failed to submit review.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {['pending','investigating','resolved','false_positive'].map(s => (
            <option key={s} value={s}>{s.replace('_',' ')}</option>
          ))}
        </select>
        <select value={txFilter} onChange={e => setTxFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Types</option>
          {['sale','purchase','prescription'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {['Detected','Type','Tx Type','Risk Score','Status','Review'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({length:5}).map((_,i) => (
                <tr key={i}>{[1,2,3,4,5,6].map(c => <td key={c} className="px-4 py-3"><div className="skeleton-shimmer h-3 rounded w-full" /></td>)}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No anomalies found.</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs">{a.detected_at ? new Date(a.detected_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-gray-700 capitalize">{a.anomaly_type?.replace(/_/g,' ')}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{a.transaction_type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColor(a.risk_score)}`}>
                    {(Number(a.risk_score)*100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {a.status?.replace('_',' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.status === 'pending' && (
                    <button onClick={() => openReview(a)}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded-lg transition-colors">
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Review Anomaly</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={reviewForm.status} onChange={e => setReviewForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="false_positive">False Positive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes *</label>
                <textarea value={reviewForm.notes} onChange={e => setReviewForm(p => ({ ...p, notes: e.target.value }))}
                  rows={4} placeholder="Add review notes…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setReviewing(null)}
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={submitReview} disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2">
                  {submitting ? <><i className="bi bi-arrow-clockwise animate-spin" />Saving…</> : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Expiry Alerts ─────────────────────────────────────────────────────────
function ExpiryTab() {
  const { data, loading, refetch } = useApi(() => aiApi.expiryAlerts());
  const alerts = data?.alerts ?? getListItems(data);

  const [riskFilter, setRiskFilter] = useState('');
  const [acking,     setAcking]     = useState({});

  const filtered = alerts.filter(a => !riskFilter || (() => {
    const s = Number(a.risk_score);
    if (riskFilter === 'critical') return s >= 0.8;
    if (riskFilter === 'high')     return s >= 0.6 && s < 0.8;
    if (riskFilter === 'medium')   return s >= 0.4 && s < 0.6;
    return s < 0.4;
  })());

  const acknowledge = async (id) => {
    setAcking(prev => ({ ...prev, [id]: true }));
    try { await aiApi.acknowledgeExpiry(id); toast.success('Alert acknowledged.'); refetch(); }
    catch { toast.error('Failed to acknowledge.'); }
    finally { setAcking(prev => ({ ...prev, [id]: false })); }
  };

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400_000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Risk Levels</option>
          {['critical','high','medium','low'].map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {['Medicine','Expiry Date','Days Left','Risk Score','Status','Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({length:5}).map((_,i) => (
                <tr key={i}>{[1,2,3,4,5,6].map(c => <td key={c} className="px-4 py-3"><div className="skeleton-shimmer h-3 rounded w-full" /></td>)}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No expiry alerts found.</td></tr>
            ) : filtered.map(a => {
              const days = daysUntil(a.expiry_date);
              return (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.medicine?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.expiry_date ? new Date(a.expiry_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${days !== null && days <= 7 ? 'text-red-600' : days !== null && days <= 30 ? 'text-yellow-600' : 'text-gray-700'}`}>
                      {days !== null ? `${days}d` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColor(a.risk_score)}`}>
                      {(Number(a.risk_score)*100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'pending' && (
                      <button onClick={() => acknowledge(a.id)} disabled={!!acking[a.id]}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1">
                        {acking[a.id] ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-check" />}
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Admin ─────────────────────────────────────────────────────────────────
function AdminTab() {
  const reorderData = useApi(() => aiApi.reorderRecommendations());
  const recommendations = reorderData.data?.recommendations ?? [];
  const [retraining, setRetraining] = useState(false);
  const [confirm,    setConfirm]    = useState(false);

  const handleRetrain = async () => {
    setConfirm(false);
    setRetraining(true);
    try {
      await aiApi.retrainStockModel();
      toast.success('Model retraining initiated successfully.');
    } catch {
      toast.error('Failed to initiate retraining.');
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reorder Recommendations from AI */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">AI Reorder Recommendations</h3>
        {reorderData.loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton-shimmer h-12 rounded-lg" />)}
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-gray-400">No reorder recommendations at this time.</p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((r, i) => (
              <div key={r.medicine_id ?? i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.medicine_name ?? r.name ?? '—'}</p>
                  <p className="text-xs text-gray-500">{r.reason ?? 'AI recommendation'}</p>
                </div>
                <span className="text-sm font-semibold text-blue-600">Qty: {r.suggested_quantity ?? r.quantity ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retrain Model */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-800 mb-2">Retrain Stock Prediction Model</h3>
        <p className="text-sm text-gray-500 mb-4">
          Trigger a retraining of the stock demand prediction model using recent sales data.
          This process runs in the background and may take several minutes.
        </p>
        {confirm ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-700">Are you sure you want to retrain the model?</p>
            <button onClick={handleRetrain} disabled={retraining}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {retraining ? <><i className="bi bi-arrow-clockwise animate-spin mr-1" />Initiating…</> : 'Yes, Retrain'}
            </button>
            <button onClick={() => setConfirm(false)}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2">
            <i className="bi bi-cpu" /> Retrain Stock Model
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AI() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        <p className="text-sm text-gray-500 mt-0.5">Machine learning powered pharmacy intelligence</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <i className={`bi ${t.icon}`} />{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'    && <OverviewTab />}
      {activeTab === 'predictions' && <PredictionsTab />}
      {activeTab === 'anomalies'   && <AnomaliesTab />}
      {activeTab === 'expiry'      && <ExpiryTab />}
      {activeTab === 'admin'       && <AdminTab />}
    </div>
  );
}
