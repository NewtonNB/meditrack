import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { users as api } from '../api';
import { toast } from 'react-toastify';

const roleColors = {
  super_admin:    'bg-purple-100 text-purple-700',
  pharmacy_admin: 'bg-blue-100 text-blue-700',
  pharmacist:     'bg-green-100 text-green-700',
  cashier:        'bg-gray-100 text-gray-700',
};

export default function UserManagement() {
  const { data, loading, error, refetch } = useApi(() => api.list());
  const [search, setSearch] = useState('');

  const items    = data?.data ?? data ?? [];
  const filtered = items.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.remove(id);
      toast.success('User deleted.');
      refetch();
    } catch {
      toast.error('Failed to delete user.');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading users…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <i className="bi bi-plus mr-2" />Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {['Name','Email','Role','Pharmacy','Last Login','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.pharmacy?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800"><i className="bi bi-pencil" /></button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700"><i className="bi bi-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
