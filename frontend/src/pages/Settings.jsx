import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { settings as api } from '../api';
import { toast } from 'react-toastify';

// ── helpers ───────────────────────────────────────────────────────────────────

const downloadBlob = (data, filename) => {
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  );
}

function Input({ type = 'text', value, onChange, ...rest }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...rest}
    />
  );
}

function Textarea({ value, onChange, ...rest }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={onChange}
      rows={3}
      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...rest}
    />
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function SaveBtn({ saving, label = 'Save', color = 'blue', onClick }) {
  const colors = {
    blue:  'bg-blue-600  hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    gray:  'bg-gray-600  hover:bg-gray-700',
  };
  return (
    <button
      type="button"
      disabled={saving}
      onClick={onClick}
      className={`${colors[color]} text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors`}
    >
      {saving ? <><i className="bi bi-arrow-clockwise animate-spin mr-2" />Saving…</> : label}
    </button>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function Settings() {
  const { data, loading, error, refetch } = useApi(() => api.get());

  // ── profile ──────────────────────────────────────────────────────────────
  const [profile, setProfile]       = useState({ name: '', email: '', phone: '', timezone: 'UTC', language: 'en' });
  const [profileSaving, setPS]      = useState(false);
  const [profileErrors, setPE]      = useState({});

  // ── pharmacy ─────────────────────────────────────────────────────────────
  const [pharmacy, setPharmacy]     = useState({ pharmacy_name: '', pharmacy_address: '', pharmacy_phone: '', pharmacy_email: '', license_number: '', tax_rate: '0', currency: 'UGX', receipt_footer: '', bank_accounts: '', payment_gateways: '' });
  const [pharmacySaving, setPhS]    = useState(false);
  const [pharmacyErrors, setPhE]    = useState({});

  // ── notifications ─────────────────────────────────────────────────────────
  const [notif, setNotif]           = useState({ email_notifications: true, sms_notifications: false, push_notifications: true, low_stock_alerts: true, expiry_alerts: true, sales_reports: true, system_updates: true, marketing_emails: false });
  const [notifSaving, setNS]        = useState(false);

  // ── security ──────────────────────────────────────────────────────────────
  const [security, setSecurity]     = useState({ two_factor_enabled: false, session_timeout: 30, password_expiry: 90, login_attempts: 5, require_password_change: false });
  const [secSaving, setSecS]        = useState(false);

  // ── system ────────────────────────────────────────────────────────────────
  const [system, setSystem]         = useState({ auto_backup: true, backup_frequency: 'daily', data_retention: 365, maintenance_mode: false, debug_mode: false, cache_enabled: true });
  const [sysSaving, setSysS]        = useState(false);

  // ── password ──────────────────────────────────────────────────────────────
  const [pw, setPw]                 = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwSaving, setPwS]          = useState(false);
  const [pwErrors, setPwE]          = useState({});

  // ── export ────────────────────────────────────────────────────────────────
  const [exporting, setExporting]   = useState(false);

  // ── system actions ────────────────────────────────────────────────────────
  const [cacheSaving, setCacheS]    = useState(false);
  const [optSaving, setOptS]        = useState(false);

  // Populate form states once data loads
  useEffect(() => {
    if (!data?.user) return;
    const u = data.user;
    setProfile({ name: u.name ?? '', email: u.email ?? '', phone: u.phone ?? '', timezone: u.timezone ?? 'UTC', language: u.language ?? 'en' });
    setPharmacy({ pharmacy_name: u.pharmacy_name ?? '', pharmacy_address: u.pharmacy_address ?? '', pharmacy_phone: u.pharmacy_phone ?? '', pharmacy_email: u.pharmacy_email ?? '', license_number: u.license_number ?? '', tax_rate: u.tax_rate ?? '0', currency: u.currency ?? 'UGX', receipt_footer: u.receipt_footer ?? '', bank_accounts: u.bank_accounts ?? '', payment_gateways: u.payment_gateways ?? '' });
    setNotif({ email_notifications: !!u.email_notifications, sms_notifications: !!u.sms_notifications, push_notifications: !!u.push_notifications, low_stock_alerts: !!u.low_stock_alerts, expiry_alerts: !!u.expiry_alerts, sales_reports: !!u.sales_reports, system_updates: !!u.system_updates, marketing_emails: !!u.marketing_emails });
    setSecurity({ two_factor_enabled: !!u.two_factor_enabled, session_timeout: u.session_timeout ?? 30, password_expiry: u.password_expiry ?? 90, login_attempts: u.login_attempts ?? 5, require_password_change: !!u.require_password_change });
    setSystem({ auto_backup: !!u.auto_backup, backup_frequency: u.backup_frequency ?? 'daily', data_retention: u.data_retention ?? 365, maintenance_mode: !!u.maintenance_mode, debug_mode: !!u.debug_mode, cache_enabled: !!u.cache_enabled });
  }, [data]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400"><i className="bi bi-arrow-clockwise animate-spin text-xl mr-2" />Loading settings…</div>;
  if (error)   return <div className="text-red-500 p-4">Failed to load settings: {error}</div>;

  const p  = (key) => (e) => setProfile(f  => ({ ...f, [key]: e.target.value }));
  const ph = (key) => (e) => setPharmacy(f => ({ ...f, [key]: e.target.value }));
  const sc = (key) => (e) => setSecurity(f => ({ ...f, [key]: e.target.value }));
  const sy = (key) => (e) => setSystem(f   => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button onClick={refetch} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      {/* ── Profile ──────────────────────────────────────────────────────── */}
      <Section title="Profile Settings">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" error={profileErrors.name}>
              <Input value={profile.name} onChange={p('name')} placeholder="Your name" />
            </Field>
            <Field label="Email" error={profileErrors.email}>
              <Input type="email" value={profile.email} onChange={p('email')} placeholder="you@example.com" />
            </Field>
            <Field label="Phone" error={profileErrors.phone}>
              <Input type="tel" value={profile.phone} onChange={p('phone')} placeholder="+256 700 000000" />
            </Field>
            <Field label="Timezone" error={profileErrors.timezone}>
              <Input value={profile.timezone} onChange={p('timezone')} placeholder="UTC" />
            </Field>
            <Field label="Language" error={profileErrors.language}>
              <select
                value={profile.language}
                onChange={p('language')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="sw">Swahili</option>
              </select>
            </Field>
          </div>
          <SaveBtn
            saving={profileSaving}
            label="Save Profile"
            onClick={async () => {
              setPS(true); setPE({});
              try {
                await api.updateProfile(profile);
                toast.success('Profile saved.');
                refetch();
              } catch (err) {
                if (err.response?.status === 422) setPE(err.response.data.errors ?? {});
                else toast.error(err.response?.data?.message || 'Failed to save profile.');
              } finally { setPS(false); }
            }}
          />
        </div>
      </Section>

      {/* ── Pharmacy & Financial ─────────────────────────────────────────── */}
      <Section title="Pharmacy & Financial Settings">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Pharmacy Name" error={pharmacyErrors.pharmacy_name}>
              <Input value={pharmacy.pharmacy_name} onChange={ph('pharmacy_name')} placeholder="My Pharmacy" />
            </Field>
            <Field label="License Number" error={pharmacyErrors.license_number}>
              <Input value={pharmacy.license_number} onChange={ph('license_number')} placeholder="LIC-0001" />
            </Field>
            <Field label="Pharmacy Phone" error={pharmacyErrors.pharmacy_phone}>
              <Input type="tel" value={pharmacy.pharmacy_phone} onChange={ph('pharmacy_phone')} />
            </Field>
            <Field label="Pharmacy Email" error={pharmacyErrors.pharmacy_email}>
              <Input type="email" value={pharmacy.pharmacy_email} onChange={ph('pharmacy_email')} />
            </Field>
            <Field label="Tax Rate (%)" error={pharmacyErrors.tax_rate}>
              <Input type="number" value={pharmacy.tax_rate} onChange={ph('tax_rate')} step="0.01" min="0" max="100" />
            </Field>
            <Field label="Currency" error={pharmacyErrors.currency}>
              <select
                value={pharmacy.currency}
                onChange={ph('currency')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UGX">UGX — Uganda Shilling</option>
                <option value="USD">USD — US Dollar</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="TZS">TZS — Tanzanian Shilling</option>
                <option value="RWF">RWF — Rwandan Franc</option>
              </select>
            </Field>
          </div>
          <Field label="Pharmacy Address" error={pharmacyErrors.pharmacy_address}>
            <Textarea value={pharmacy.pharmacy_address} onChange={ph('pharmacy_address')} placeholder="Physical address…" />
          </Field>
          <Field label="Receipt Footer" error={pharmacyErrors.receipt_footer}>
            <Input value={pharmacy.receipt_footer} onChange={ph('receipt_footer')} placeholder="Thank you for your purchase!" />
          </Field>
          <Field label="Bank Accounts" error={pharmacyErrors.bank_accounts}>
            <Textarea value={pharmacy.bank_accounts} onChange={ph('bank_accounts')} placeholder="Account details…" />
          </Field>
          <Field label="Payment Gateways" error={pharmacyErrors.payment_gateways}>
            <Textarea value={pharmacy.payment_gateways} onChange={ph('payment_gateways')} placeholder="Gateway details…" />
          </Field>
          <SaveBtn
            saving={pharmacySaving}
            label="Save Pharmacy Settings"
            color="green"
            onClick={async () => {
              setPhS(true); setPhE({});
              try {
                await api.updatePharmacy(pharmacy);
                toast.success('Pharmacy settings saved.');
                refetch();
              } catch (err) {
                if (err.response?.status === 422) setPhE(err.response.data.errors ?? {});
                else toast.error(err.response?.data?.message || 'Failed to save pharmacy settings.');
              } finally { setPhS(false); }
            }}
          />
        </div>
      </Section>

      {/* ── Notification Preferences ─────────────────────────────────────── */}
      <Section title="Notification Preferences">
        <div className="divide-y divide-gray-100">
          {[
            { key: 'email_notifications', label: 'Email Notifications' },
            { key: 'sms_notifications',   label: 'SMS Notifications' },
            { key: 'push_notifications',  label: 'Push Notifications' },
            { key: 'low_stock_alerts',    label: 'Low Stock Alerts' },
            { key: 'expiry_alerts',       label: 'Expiry Alerts' },
            { key: 'sales_reports',       label: 'Sales Reports' },
            { key: 'system_updates',      label: 'System Updates' },
            { key: 'marketing_emails',    label: 'Marketing Emails' },
          ].map(({ key, label }) => (
            <Toggle
              key={key}
              label={label}
              checked={notif[key]}
              onChange={(val) => setNotif(n => ({ ...n, [key]: val }))}
            />
          ))}
        </div>
        <div className="mt-4">
          <SaveBtn
            saving={notifSaving}
            label="Save Notification Preferences"
            color="green"
            onClick={async () => {
              setNS(true);
              try {
                await api.updateNotifications(notif);
                toast.success('Notification preferences saved.');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to save preferences.');
              } finally { setNS(false); }
            }}
          />
        </div>
      </Section>

      {/* ── Security ─────────────────────────────────────────────────────── */}
      <Section title="Security Settings">
        <div className="space-y-4">
          <Toggle
            label="Two-Factor Authentication"
            checked={security.two_factor_enabled}
            onChange={(val) => setSecurity(s => ({ ...s, two_factor_enabled: val }))}
          />
          <Toggle
            label="Require Password Change on Next Login"
            checked={security.require_password_change}
            onChange={(val) => setSecurity(s => ({ ...s, require_password_change: val }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Session Timeout (min)">
              <Input type="number" value={security.session_timeout} onChange={sc('session_timeout')} min="5" max="480" />
            </Field>
            <Field label="Password Expiry (days)">
              <Input type="number" value={security.password_expiry} onChange={sc('password_expiry')} min="30" max="365" />
            </Field>
            <Field label="Max Login Attempts">
              <Input type="number" value={security.login_attempts} onChange={sc('login_attempts')} min="3" max="10" />
            </Field>
          </div>
          <SaveBtn
            saving={secSaving}
            label="Save Security Settings"
            onClick={async () => {
              setSecS(true);
              try {
                await api.updateSecurity(security);
                toast.success('Security settings saved.');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to save security settings.');
              } finally { setSecS(false); }
            }}
          />
        </div>
      </Section>

      {/* ── System Settings ──────────────────────────────────────────────── */}
      <Section title="System Settings">
        <div className="space-y-4">
          <Toggle
            label="Auto Backup"
            checked={system.auto_backup}
            onChange={(val) => setSystem(s => ({ ...s, auto_backup: val }))}
          />
          <Toggle
            label="Maintenance Mode"
            checked={system.maintenance_mode}
            onChange={(val) => setSystem(s => ({ ...s, maintenance_mode: val }))}
          />
          <Toggle
            label="Debug Mode"
            checked={system.debug_mode}
            onChange={(val) => setSystem(s => ({ ...s, debug_mode: val }))}
          />
          <Toggle
            label="Cache Enabled"
            checked={system.cache_enabled}
            onChange={(val) => setSystem(s => ({ ...s, cache_enabled: val }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Backup Frequency">
              <select
                value={system.backup_frequency}
                onChange={sy('backup_frequency')}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </Field>
            <Field label="Data Retention (days)">
              <Input type="number" value={system.data_retention} onChange={sy('data_retention')} min="30" max="730" />
            </Field>
          </div>
          <SaveBtn
            saving={sysSaving}
            label="Save System Settings"
            onClick={async () => {
              setSysS(true);
              try {
                await api.updateSystem(system);
                toast.success('System settings saved.');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to save system settings.');
              } finally { setSysS(false); }
            }}
          />
        </div>
      </Section>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <Section title="Change Password">
        <div className="space-y-4">
          {[
            { name: 'current_password', label: 'Current Password' },
            { name: 'password',         label: 'New Password' },
            { name: 'password_confirmation', label: 'Confirm New Password' },
          ].map(({ name, label }) => (
            <Field key={name} label={label} error={pwErrors[name]}>
              <input
                type="password"
                value={pw[name]}
                onChange={e => setPw(f => ({ ...f, [name]: e.target.value }))}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${pwErrors[name] ? 'border-red-400' : 'border-gray-300'}`}
              />
            </Field>
          ))}
          <SaveBtn
            saving={pwSaving}
            label="Change Password"
            onClick={async () => {
              setPwS(true); setPwE({});
              try {
                await api.changePassword(pw);
                toast.success('Password changed successfully.');
                setPw({ current_password: '', password: '', password_confirmation: '' });
              } catch (err) {
                if (err.response?.status === 422) setPwE(err.response.data.errors ?? {});
                else toast.error(err.response?.data?.message || 'Failed to change password.');
              } finally { setPwS(false); }
            }}
          />
        </div>
      </Section>

      {/* ── System Actions ────────────────────────────────────────────────── */}
      <Section title="System Actions">
        <div className="flex flex-wrap gap-3">
          <button
            disabled={cacheSaving}
            onClick={async () => {
              setCacheS(true);
              try { await api.clearCache(); toast.success('Cache cleared.'); }
              catch (err) { toast.error(err.response?.data?.message || 'Failed to clear cache.'); }
              finally { setCacheS(false); }
            }}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {cacheSaving ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-arrow-clockwise" />}
            Clear Cache
          </button>
          <button
            disabled={optSaving}
            onClick={async () => {
              setOptS(true);
              try { await api.optimizeDatabase(); toast.success('Database optimized.'); }
              catch (err) { toast.error(err.response?.data?.message || 'Failed to optimize.'); }
              finally { setOptS(false); }
            }}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {optSaving ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-database-gear" />}
            Optimize DB
          </button>
          <button
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const { data: blob } = await api.exportSettings();
                downloadBlob(blob, `meditrack-settings-${new Date().toISOString().slice(0,10)}.json`);
                toast.success('Settings exported.');
              } catch {
                toast.error('Failed to export settings.');
              } finally { setExporting(false); }
            }}
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {exporting ? <i className="bi bi-arrow-clockwise animate-spin" /> : <i className="bi bi-download" />}
            Export Settings
          </button>
        </div>
      </Section>
    </div>
  );
}
