import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { settings as api } from '../api';
import { toast } from 'react-toastify';

export default function Settings() {
  const { data, loading, error, refetch } = useApi(() => api.get());
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (endpoint, payload) => {
    setSaving(true);
    try {
      await endpoint(payload);
      toast.success('Settings saved.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading settings…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  const user = data?.user ?? {};

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Profile Settings</h2>
        <div className="space-y-4">
          {[
            { name: 'name',     label: 'Name',     type: 'text',  default: user.name     },
            { name: 'email',    label: 'Email',    type: 'email', default: user.email    },
            { name: 'phone',    label: 'Phone',    type: 'tel',   default: user.phone    },
            { name: 'timezone', label: 'Timezone', type: 'text',  default: user.timezone },
          ].map(({ name, label, type, default: def }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                name={name}
                defaultValue={form[name] ?? def ?? ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button
            onClick={() => handleSave(api.updateProfile, form)}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">System</h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleSave(api.clearCache, {})}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <i className="bi bi-arrow-clockwise mr-2" />Clear Cache
          </button>
          <button
            onClick={() => handleSave(api.optimizeDatabase, {})}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <i className="bi bi-database-gear mr-2" />Optimize DB
          </button>
        </div>
      </div>
    </div>
  );
}
