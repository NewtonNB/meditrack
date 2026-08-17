import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { notifications as api, settings as settingsApi } from '../api';
import { toast } from 'react-toastify';

const PRIORITY_COLORS = {
  high:   'border-red-400 bg-red-50',
  medium: 'border-yellow-400 bg-yellow-50',
  low:    'border-blue-400 bg-blue-50',
};

const PRIORITY_TABS = ['all', 'high', 'medium', 'low'];

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useApi(() => api.list());
  const statsData = useApi(() => api.statistics());

  const [priorityFilter,  setPriorityFilter]  = useState('all');
  const [prefsOpen,       setPrefsOpen]        = useState(false);
  const [prefs,           setPrefs]            = useState(null);
  const [prefsSaving,     setPrefsSaving]      = useState(false);
  const [actionLoading,   setActionLoading]    = useState({});

  const rawItems = data?.notifications ?? data?.data ?? data ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [];
  const stats = statsData.data ?? {};

  // Load preferences when panel opens
  useEffect(() => {
    if (!prefsOpen || prefs !== null) return;
    api.getPreferences().then(res => {
      const p = res.data?.preferences ?? res.data ?? {};
      setPrefs({
        email_notifications: p.email_notifications ?? true,
        sms_notifications:   p.sms_notifications   ?? false,
        push_notifications:  p.push_notifications  ?? true,
        low_stock_alerts:    p.low_stock_alerts     ?? true,
        expiry_alerts:       p.expiry_alerts        ?? true,
      });
    }).catch(() => setPrefs({
      email_notifications: true, sms_notifications: false,
      push_notifications: true, low_stock_alerts: true, expiry_alerts: true,
    }));
  }, [prefsOpen, prefs]);

  const setLoading = (key, val) => setActionLoading(prev => ({ ...prev, [key]: val }));

  const markRead = async (id) => {
    setLoading(`read_${id}`, true);
    try { await api.markRead(id); refetch(); }
    catch { toast.error('Failed to mark as read.'); }
    finally { setLoading(`read_${id}`, false); }
  };

  const dismiss = async (id) => {
    setLoading(`dismiss_${id}`, true);
    try { await api.dismiss(id); refetch(); }
    catch { toast.error('Failed to dismiss.'); }
    finally { setLoading(`dismiss_${id}`, false); }
  };

  const markAllRead = async () => {
    try { await api.markAllRead(); toast.success('All marked as read.'); refetch(); }
    catch { toast.error('Failed.'); }
  };

  const cleanup = async () => {
    try { await api.cleanup(); toast.success('Old notifications cleaned up.'); refetch(); }
    catch { toast.error('Failed to clean up.'); }
  };

  const savePrefs = async () => {
    setPrefsSaving(true);
    try {
      // Settings API accepts flat boolean fields: { email_notifications, sms_notifications, ... }
      await settingsApi.updateNotifications(prefs);
      toast.success('Preferences saved.');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setPrefsSaving(false);
    }
  };

  const filtered = priorityFilter === 'all'
    ? items
    : items.filter(n => n.priority === priorityFilter);

  const unread = items.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <i className="bi bi-arrow-left" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unread > 0 && <p className="text-xs text-gray-500">{unread} unread</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cleanup} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
            <i className="bi bi-trash mr-1" />Cleanup
          </button>
          <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">Mark all as read</button>
        </div>
      </div>

      {/* Stats strip */}
      {!statsData.loading && (stats.total || stats.unread || stats.high_priority) && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total',        value: stats.total ?? items.length,  color: 'bg-gray-100 text-gray-700' },
            { label: 'Unread',       value: stats.unread ?? unread,       color: 'bg-blue-100 text-blue-700' },
            { label: 'High Priority',value: stats.high_priority ?? items.filter(n=>n.priority==='high').length, color: 'bg-red-100 text-red-700' },
          ].map(s => (
            <span key={s.label} className={`text-xs font-medium px-3 py-1.5 rounded-full ${s.color}`}>
              {s.label}: {s.value}
            </span>
          ))}
        </div>
      )}

      {/* Priority filter */}
      <div className="flex bg-gray-100 rounded-lg p-1 gap-1 w-fit">
        {PRIORITY_TABS.map(p => (
          <button key={p} onClick={() => setPriorityFilter(p)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
              priorityFilter === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {p}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 skeleton-shimmer h-20" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <i className="bi bi-bell-slash text-4xl text-gray-300" />
          <p className="text-gray-400 mt-3">No {priorityFilter !== 'all' ? priorityFilter + ' priority ' : ''}notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition-opacity ${PRIORITY_COLORS[n.priority] ?? 'border-gray-300 bg-white'} ${!n.read ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0">{n.customIcon ?? '🔔'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} disabled={!!actionLoading[`read_${n.id}`]}
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap disabled:opacity-50">
                      Mark read
                    </button>
                  )}
                  <button onClick={() => dismiss(n.id)} disabled={!!actionLoading[`dismiss_${n.id}`]}
                    title="Dismiss"
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:opacity-40">
                    <i className="bi bi-x text-lg" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preferences Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setPrefsOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-gray-800 flex items-center gap-2">
            <i className="bi bi-sliders text-blue-500" /> Notification Preferences
          </span>
          <i className={`bi ${prefsOpen ? 'bi-chevron-up' : 'bi-chevron-down'} text-gray-400`} />
        </button>

        {prefsOpen && (
          <div className="px-5 pb-5 border-t border-gray-100">
            {prefs === null ? (
              <div className="py-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton-shimmer h-8 rounded" />)}
              </div>
            ) : (
              <>
                <div className="space-y-3 mt-4">
                  {[
                    { key: 'email_notifications', label: 'Email Notifications',  icon: 'bi-envelope' },
                    { key: 'sms_notifications',   label: 'SMS Notifications',    icon: 'bi-phone' },
                    { key: 'push_notifications',  label: 'Push Notifications',   icon: 'bi-bell' },
                    { key: 'low_stock_alerts',    label: 'Low Stock Alerts',     icon: 'bi-exclamation-triangle' },
                    { key: 'expiry_alerts',       label: 'Expiry Alerts',        icon: 'bi-clock' },
                  ].map(({ key, label, icon }) => (
                    <div key={key} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700 flex items-center gap-2">
                        <i className={`bi ${icon} text-gray-400`} />{label}
                      </span>
                      <ToggleSwitch
                        checked={prefs[key] ?? false}
                        onChange={val => setPrefs(prev => ({ ...prev, [key]: val }))}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={savePrefs} disabled={prefsSaving}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  {prefsSaving ? <><i className="bi bi-arrow-clockwise animate-spin" /> Saving…</> : 'Save Preferences'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
