import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { users as api } from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserModal from '../Components/UserModal';
import ConfirmDialog from '../Components/ConfirmDialog';
import PermissionGate from '../Components/PermissionGate';

const roleColors = {
  super_admin:    'bg-purple-100 text-purple-700',
  pharmacy_admin: 'bg-blue-100 text-blue-700',
  pharmacist:     'bg-green-100 text-green-700',
  cashier:        'bg-gray-100 text-gray-700',
};

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [showTrashed, setShowTrashed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const { data, loading, error, refetch } = useApi(
    () => api.list({ status: showTrashed ? 'trashed' : 'active', page, per_page: perPage }),
    [showTrashed, page, perPage]
  );
  const navigate = useNavigate();

  const items    = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  const filtered = items.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );
  const total = data?.total ?? items.length;
  const currentPage = data?.current_page ?? 1;
  const lastPage = data?.last_page ?? 1;
  const selectedCount = selectedItems.length;
  const allSelected = filtered.length > 0 && selectedCount === filtered.length;

  useEffect(() => {
    setSelectedItems([]);
  }, [showTrashed, page]);

  const handleDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      await api.remove(id);
      toast.success(showTrashed ? 'User deleted.' : 'User moved to trash.');
      refetch();
    } catch {
      toast.error(showTrashed ? 'Failed to delete user.' : 'Failed to move user to trash.');
    }
  };

  const handleBulkDelete = async () => {
    setBulkConfirmOpen(false);
    try {
      await api.bulkDelete(selectedItems);
      toast.success(showTrashed ? `${selectedItems.length} user(s) deleted.` : `${selectedItems.length} user(s) moved to trash.`);
      setSelectedItems([]);
      refetch();
    } catch {
      toast.error(showTrashed ? 'Failed to delete selected users.' : 'Failed to move selected users to trash.');
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.restore(id);
      toast.success('User restored.');
      refetch();
    } catch {
      toast.error('Failed to restore user.');
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };
  const handleBack = () => navigate(-1);
  const handlePreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setPage((prev) => Math.min(lastPage, prev + 1));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
      return;
    }

    setSelectedItems(filtered.map(u => u.id));
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading users…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">{showTrashed ? 'Viewing trashed users' : 'Viewing active users'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
          >
            <i className="bi bi-arrow-left mr-1" /> Back
          </button>
          {!showTrashed && selectedCount > 0 && (
            <PermissionGate permission="manage_users">
              <button
                type="button"
                onClick={() => setBulkConfirmOpen(true)}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Delete Selected ({selectedCount})
              </button>
            </PermissionGate>
          )}
          <button
            type="button"
            onClick={() => setShowTrashed(prev => !prev)}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
          >
            {showTrashed ? 'Show Active' : 'Show Trash'}
          </button>
          {!showTrashed && (
            <PermissionGate permission="manage_users">
              <button 
                type="button"
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <i className="bi bi-plus mr-2" />Add User
              </button>
            </PermissionGate>
          )}
        </div>
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
                {!showTrashed && (
                  <th className="px-4 py-3 text-left font-medium w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </th>
                )}
                {['Name','Email','Role','Pharmacy','Last Login','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={showTrashed ? 6 : 7} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  {!showTrashed && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(u.id)}
                        onChange={() => setSelectedItems(prev => prev.includes(u.id)
                          ? prev.filter(item => item !== u.id)
                          : [...prev, u.id]
                        )}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                  )}
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
                      {!showTrashed ? (
                        <>
                          <PermissionGate permission="manage_users">
                            <button 
                              onClick={() => openEditModal(u)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="manage_users">
                            <button onClick={() => setConfirmId(u.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete user">
                              <i className="bi bi-trash" />
                            </button>
                          </PermissionGate>
                        </>
                      ) : (
                        <>
                          <PermissionGate permission="manage_users">
                            <button
                              type="button"
                              onClick={() => handleRestore(u.id)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Restore user"
                            >
                              <i className="bi bi-arrow-counterclockwise" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="manage_users">
                            <button onClick={() => setConfirmId(u.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete user permanently">
                              <i className="bi bi-trash3-fill" />
                            </button>
                          </PermissionGate>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            Page {currentPage} of {lastPage} · {total} total user{total !== 1 ? 's' : ''}
            {search && ` · matching "${search}"`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={currentPage <= 1}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= lastPage}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
      <UserModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editingUser}
        onSave={refetch}
      />

      <ConfirmDialog
        isOpen={confirmId !== null}
        title={showTrashed ? 'Delete User' : 'Move User to Trash'}
        message={showTrashed ? 'This will permanently remove the user. This action cannot be undone.' : 'This will move the user to trash. You can restore them later if needed.'}
        confirmLabel={showTrashed ? 'Delete' : 'Trash'}
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />

      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={showTrashed ? 'Delete Selected Users' : 'Move Selected Users to Trash'}
        message={showTrashed ? `This will permanently remove ${selectedItems.length} selected user(s). This action cannot be undone.` : `This will move ${selectedItems.length} selected user(s) to trash. You can restore them later if needed.`}
        confirmLabel={showTrashed ? 'Delete Selected' : 'Trash Selected'}
        confirmVariant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}
