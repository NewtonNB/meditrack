import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { suppliers as api } from '../api';
import { toast } from 'react-toastify';
import SupplierModal from '../Components/SupplierModal';
import ConfirmDialog from '../Components/ConfirmDialog';
import PermissionGate from '../Components/PermissionGate';

export default function Suppliers() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [showTrashed, setShowTrashed] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const { data, loading, error, refetch } = useApi(
    () => api.list({ status: showTrashed ? 'trashed' : 'active', page, per_page: perPage }),
    [showTrashed, page, perPage]
  );

  const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  const total = data?.total ?? items.length;
  const currentPage = data?.current_page ?? 1;
  const lastPage = data?.last_page ?? 1;
  const filtered = items.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedItems([]);
  }, [showTrashed, page]);

  const handleDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      await api.remove(id);
      toast.success(showTrashed ? 'Supplier deleted.' : 'Supplier moved to trash.');
      refetch();
    } catch {
      toast.error(showTrashed ? 'Failed to delete supplier.' : 'Failed to move supplier to trash.');
    }
  };

  const handleBulkDelete = async () => {
    setBulkConfirmOpen(false);
    try {
      await api.bulkDelete(selectedItems);
      toast.success(showTrashed ? `${selectedItems.length} supplier(s) deleted.` : `${selectedItems.length} supplier(s) moved to trash.`);
      setSelectedItems([]);
      refetch();
    } catch {
      toast.error(showTrashed ? 'Failed to delete selected suppliers.' : 'Failed to move selected suppliers to trash.');
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.restore(id);
      toast.success('Supplier restored.');
      refetch();
    } catch {
      toast.error('Failed to restore supplier.');
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setModalOpen(true);
  };

  const handleBack = () => navigate(-1);
  const handlePreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setPage((prev) => Math.min(lastPage, prev + 1));

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading suppliers…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">{showTrashed ? 'Viewing trashed suppliers' : 'Viewing active suppliers'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
          >
            <i className="bi bi-arrow-left mr-1" /> Back
          </button>
          {!showTrashed && selectedItems.length > 0 && (
            <PermissionGate permission="manage_suppliers">
              <button
                type="button"
                onClick={() => setBulkConfirmOpen(true)}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Delete Selected ({selectedItems.length})
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
            <PermissionGate permission="manage_suppliers">
              <button 
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <i className="bi bi-plus mr-2" />Add Supplier
              </button>
            </PermissionGate>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search suppliers…"
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
                      checked={filtered.length > 0 && selectedItems.length === filtered.length}
                      onChange={() => {
                        if (filtered.length > 0 && selectedItems.length === filtered.length) {
                          setSelectedItems([]);
                        } else {
                          setSelectedItems(filtered.map(s => s.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </th>
                )}
                {['Name','Email','Phone','Address','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={showTrashed ? 5 : 6} className="px-4 py-8 text-center text-gray-400">No suppliers found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  {!showTrashed && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(s.id)}
                        onChange={() => {
                          setSelectedItems(prev => prev.includes(s.id)
                            ? prev.filter(item => item !== s.id)
                            : [...prev, s.id]
                          );
                        }}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.address ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!showTrashed ? (
                        <>
                          <PermissionGate permission="manage_suppliers">
                            <button 
                              onClick={() => openEditModal(s)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="manage_suppliers">
                            <button onClick={() => setConfirmId(s.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Move supplier to trash">
                              <i className="bi bi-trash" />
                            </button>
                          </PermissionGate>
                        </>
                      ) : (
                        <>
                          <PermissionGate permission="manage_suppliers">
                            <button
                              type="button"
                              onClick={() => handleRestore(s.id)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Restore supplier"
                            >
                              <i className="bi bi-arrow-counterclockwise" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="manage_suppliers">
                            <button onClick={() => setConfirmId(s.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete supplier permanently">
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
        </div>
      </div>
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            Page {currentPage} of {lastPage} · {total} total supplier{total !== 1 ? 's' : ''}
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

      <SupplierModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        supplier={editingSupplier}
        onSave={refetch}
      />

      <ConfirmDialog
        isOpen={confirmId !== null}
        title={showTrashed ? 'Delete Supplier' : 'Move Supplier to Trash'}
        message={showTrashed ? 'This will permanently remove the supplier. This action cannot be undone.' : 'This will move the supplier to trash. You can restore them later if needed.'}
        confirmLabel={showTrashed ? 'Delete' : 'Trash'}
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />

      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title="Move Selected Suppliers to Trash"
        message={`This will move ${selectedItems.length} selected supplier(s) to trash. You can restore them later if needed.`}
        confirmLabel="Trash Selected"
        confirmVariant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}
