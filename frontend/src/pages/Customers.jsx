import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { customers as api } from '../api';
import { toast } from 'react-toastify';
import CustomerModal from '../Components/CustomerModal';
import ConfirmDialog from '../Components/ConfirmDialog';
import PermissionGate from '../Components/PermissionGate';

export default function Customers() {
  const navigate = useNavigate();
  const [showTrashed, setShowTrashed] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const { data, loading, error, refetch } = useApi(
    () => api.list({ status: showTrashed ? 'trashed' : 'active', page, per_page: perPage }),
    [showTrashed, page, perPage]
  );

  const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  const filtered = items.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const total = data?.total ?? 0;
  const currentPage = data?.current_page ?? 1;
  const lastPage = data?.last_page ?? 1;
  const selectedCount = selectedItems.length;
  const allSelected = filtered.length > 0 && selectedCount === filtered.length;

  useEffect(() => {
    setSelectedItems([]);
  }, [showTrashed, page]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
      return;
    }
    setSelectedItems(filtered.map(c => c.id));
  };

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      await api.remove(id);
      toast.success(showTrashed ? 'Customer deleted.' : 'Customer moved to trash.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || (showTrashed ? 'Failed to delete customer.' : 'Failed to move customer to trash.'));
    }
  };

  const openBulkDelete = () => {
    setBulkConfirmOpen(true);
  };

  const handleBulkDelete = async () => {
    setBulkConfirmOpen(false);
    try {
      await api.bulkDelete(selectedItems);
      toast.success(showTrashed ? `${selectedItems.length} customer(s) deleted.` : `${selectedItems.length} customer(s) moved to trash.`);
      setSelectedItems([]);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || (showTrashed ? 'Failed to delete selected customers.' : 'Failed to move selected customers to trash.'));
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.restore(id);
      toast.success('Customer restored.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore customer.');
    }
  };

  const changePage = (targetPage) => {
    if (targetPage < 1 || targetPage > lastPage) return;
    setPage(targetPage);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading customers…</div>;
  if (error)   return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{showTrashed ? 'Viewing trashed customers' : 'Viewing active customers'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition"
          >
            <i className="bi bi-arrow-left mr-1" /> Back
          </button>
          {!showTrashed && selectedCount > 0 && (
            <PermissionGate permission="manage_customers">
              <button
                type="button"
                onClick={openBulkDelete}
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
            <PermissionGate permission="manage_customers">
              <button 
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <i className="bi bi-plus mr-2" />Add Customer
              </button>
            </PermissionGate>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search customers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Loyalty Points</th>
                <th className="px-4 py-3 text-left font-medium">Since</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No customers found.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {!showTrashed && (
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3">{c.loyalty_points ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!showTrashed ? (
                        <>
                          <PermissionGate permission="manage_customers">
                            <button 
                              type="button"
                              onClick={() => openEditModal(c)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="manage_customers">
                            <button type="button" onClick={() => setConfirmId(c.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Move customer to trash">
                              <i className="bi bi-trash" />
                            </button>
                          </PermissionGate>
                        </>
                      ) : (
                        <>
                          <PermissionGate permission="manage_customers">
                            <button type="button" onClick={() => handleRestore(c.id)} className="text-green-600 hover:text-green-800 transition-colors" title="Restore customer">
                              <i className="bi bi-arrow-counterclockwise" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="manage_customers">
                            <button type="button" onClick={() => setConfirmId(c.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete customer permanently">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 text-sm text-gray-600">
          <div>
            Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} customers
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm">Page {currentPage} of {lastPage}</span>
            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= lastPage}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <CustomerModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editingCustomer}
        onSave={refetch}
      />

      <ConfirmDialog
        isOpen={confirmId !== null}
        title={showTrashed ? 'Delete Customer' : 'Move Customer to Trash'}
        message={showTrashed ? 'This will permanently remove the customer. This action cannot be undone.' : 'This will move the customer to trash. You can restore them later if needed.'}
        confirmLabel={showTrashed ? 'Delete' : 'Trash'}
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />

      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title="Move Selected Customers to Trash"
        message={`This will move ${selectedCount} selected customer(s) to trash. You can restore them later if needed.`}
        confirmLabel="Trash Selected"
        confirmVariant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}
