import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { profile as api } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApi(() => api.get());
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({});

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.update(form);
      toast.success('Profile updated.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading profile…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  const u = data?.user ?? data ?? {};

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {(u.name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{u.name ?? user?.name}</p>
            <p className="text-sm text-gray-500 capitalize">{u.role ?? user?.role}</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { name: 'name',  label: 'Full Name', type: 'text',  default: u.name  },
            { name: 'email', label: 'Email',     type: 'email', default: u.email },
            { name: 'phone', label: 'Phone',     type: 'tel',   default: u.phone },
            { name: 'bio',   label: 'Bio',       type: 'text',  default: u.bio   },
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
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
