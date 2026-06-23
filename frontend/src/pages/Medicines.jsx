import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { medicines as api } from '../api';
import { toast } from 'react-toastify';
import MedicineModal from '../Components/MedicineModal';
import ConfirmDialog from '../Components/ConfirmDialog';
import PermissionGate from '../Components/PermissionGate';

// Returns days until expiry (negative = already expired)
const daysUntilExpiry = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const ExpiryBadge = ({ dateStr }) => {
  if (!dateStr) return <span className="text-gray-400">—</span>;
  const days = daysUntilExpiry(dateStr);
  const label = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (days < 0)
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><i className="bi bi-x-circle" /> Expired</span>;
  if (days <= 30)
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><i className="bi bi-exclamation-triangle" /> {label}</span>;
  return <span className="text-sm text-gray-500">{label}</span>;
};

const StockBadge = ({ stock }) => {
  if (stock === 0)
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><i className="bi bi-x-circle" /> Out of stock</span>;
  if (stock < 10)
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><i className="bi bi-exclamation-triangle" /> Low ({stock})</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><i className="bi bi-check-circle" /> In stock ({stock})</span>;
};

export default function Medicines() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [showTrashed, setShowTrashed] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const { data, loading, error, refetch } = useApi(
    () => api.list({ status: showTrashed ? 'trashed' : 'active', page, per_page: perPage }),
    [showTrashed, page, perPage]
  );
  const [search, setSearch]               = useState('');
  const [deleting, setDeleting]           = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [confirmId, setConfirmId]         = useState(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const items    = data?.data ?? (Array.isArray(data) ? data : []);
  const filtered = items.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.brand?.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
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
    setDeleting(id);
    try {
      await api.remove(id);
      toast.success(showTrashed ? 'Medicine deleted.' : 'Medicine moved to trash.');
      refetch();
    } catch {
      toast.error(showTrashed ? 'Failed to delete medicine.' : 'Failed to move medicine to trash.');
    } finally {
      setDeleting(null);
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.restore(id);
      toast.success('Medicine restored.');
      refetch();
    } catch {
      toast.error('Failed to restore medicine.');
    }
  };

  const openBulkDelete = () => {
    setBulkConfirmOpen(true);
  };

  const handleBulkDelete = async () => {
    setBulkConfirmOpen(false);
    try {
      await api.bulkDelete(selectedItems);
      toast.success(`${selectedItems.length} medicine(s) deleted.`);
      setSelectedItems([]);
      refetch();
    } catch {
      toast.error('Failed to delete selected medicines.');
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
      return;
    }
    setSelectedItems(filtered.map(m => m.id));
  };

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBack = () => navigate(-1);
  const handlePreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setPage((prev) => Math.min(lastPage, prev + 1));

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-2 text-gray-400">
      <i className="bi bi-arrow-clockwise animate-spin text-xl" /> Loading medicines…
    </div>
  );
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <i className="bi bi-arrow-left" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} of {items.length} medicines</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium transition ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <i className="bi bi-layout-text-window-reverse mr-1" /> Columns
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm font-medium transition ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <i className="bi bi-grid-3x3-gap mr-1" /> Cards
            </button>
          </div>
          {!selectedCount && (
            <PermissionGate permission="manage_medicines">
              <button
                type="button"
                onClick={() => { setEditingMedicine(null); setModalOpen(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <i className="bi bi-plus-lg" /> Add Medicine
              </button>
            </PermissionGate>
          )}
          {selectedCount > 0 && !showTrashed && (
            <PermissionGate permission="manage_medicines">
              <button
                type="button"
                onClick={openBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name, brand or category…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className="bi bi-x" />
              </button>
            )}
          </div>
        </div>

        {viewMode === 'cards' ? (
          filtered.length > 0 ? (
            <div className="space-y-4 px-4 pb-4">
              {filtered.map(m => (
                <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-gray-900 truncate">{m.name}</p>
                        {m.brand && <span className="text-xs text-gray-500 truncate">({m.brand})</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 items-center text-sm text-gray-600">
                        {m.category ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {m.category}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-400">
                            No category
                          </span>
                        )}
                        <StockBadge stock={m.stock ?? 0} />
                      </div>
                    </div>
                    {!showTrashed && (
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(m.id)}
                        onChange={() => toggleSelect(m.id)}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded"
                      />
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">Cost</p>
                      <p className="mt-1 tabular-nums">{m.cost_price != null ? `UGX ${Number(m.cost_price).toLocaleString()}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">Selling</p>
                      <p className="mt-1 font-semibold tabular-nums">UGX {Number(m.selling_price ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Expiry</p>
                      <p className="mt-1"><ExpiryBadge dateStr={m.expiry_date} /></p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!showTrashed ? (
                      <>
                        <PermissionGate permission="manage_medicines">
                          <button
                            onClick={() => { setEditingMedicine(m); setModalOpen(true); }}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <i className="bi bi-pencil mr-2" /> Edit
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="manage_medicines">
                          <button
                            onClick={() => setConfirmId(m.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <i className="bi bi-trash mr-2" /> Trash
                          </button>
                        </PermissionGate>
                      </>
                    ) : (
                      <>
                        <PermissionGate permission="manage_medicines">
                          <button
                            type="button"
                            onClick={() => setConfirmId(m.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <i className="bi bi-trash3-fill mr-2" /> Delete
                          </button>
                        </PermissionGate>
                        <PermissionGate permission="manage_medicines">
                          <button
                            type="button"
                            onClick={() => handleRestore(m.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <i className="bi bi-arrow-counterclockwise mr-2" /> Restore
                          </button>
                        </PermissionGate>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-gray-400">
              <i className="bi bi-capsule text-3xl text-gray-200 block mb-2" />
              <p className="text-sm">
                {search ? `No medicines matching "${search}"` : 'No medicines yet. Add your first one.'}
              </p>
            </div>
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {!showTrashed && (
                      <th className="px-5 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </th>
                    )}
                    <th className="px-5 py-3 text-left w-48">Medicine</th>
                    <th className="px-4 py-3 text-left w-28">Category</th>
                    <th className="px-4 py-3 text-left w-36">Stock</th>
                    <th className="px-4 py-3 text-right w-36">Cost</th>
                    <th className="px-4 py-3 text-right w-36">Selling Price</th>
                    <th className="px-4 py-3 text-left w-36">Expiry</th>
                    <th className="px-4 py-3 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={showTrashed ? 7 : 8} className="px-5 py-12 text-center">
                        <i className="bi bi-capsule text-3xl text-gray-200 block mb-2" />
                        <p className="text-gray-400 text-sm">
                          {search ? `No medicines matching "${search}"` : 'No medicines yet. Add your first one.'}
                        </p>
                      </td>
                    </tr>
                  ) : filtered.map(m => (
                    <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                      {!showTrashed && (
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(m.id)}
                            onChange={() => toggleSelect(m.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-3"
                          />
                        </td>
                      )}
                      <td className="px-5 py-3">
                        <div className="inline-block align-middle">
                          <p className="font-semibold text-gray-900 leading-tight">{m.name}</p>
                          {m.brand && <p className="text-xs text-gray-400 mt-0.5">{m.brand}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {m.category
                          ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{m.category}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <StockBadge stock={m.stock ?? 0} />
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                        {m.cost_price != null
                          ? <span>UGX {Number(m.cost_price).toLocaleString()}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                        UGX {Number(m.selling_price ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <ExpiryBadge dateStr={m.expiry_date} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {!showTrashed ? (
                            <>
                              <PermissionGate permission="manage_medicines">
                                <button
                                  onClick={() => { setEditingMedicine(m); setModalOpen(true); }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                                  title="Edit medicine"
                                >
                                  <i className="bi bi-pencil text-sm" />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="manage_medicines">
                                <button
                                  onClick={() => setConfirmId(m.id)}
                                  disabled={deleting === m.id}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                                  title="Move medicine to trash"
                                >
                                  <i className={`bi text-sm ${deleting === m.id ? 'bi-hourglass animate-spin' : 'bi-trash'}`} />
                                </button>
                              </PermissionGate>
                            </>
                          ) : (
                            <>
                              <PermissionGate permission="manage_medicines">
                                <button
                                  type="button"
                                  onClick={() => setConfirmId(m.id)}
                                  disabled={deleting === m.id}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40"
                                  title="Delete permanently"
                                >
                                  <i className={`bi text-sm ${deleting === m.id ? 'bi-hourglass animate-spin' : 'bi-trash3-fill'}`} />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="manage_medicines">
                                <button
                                  type="button"
                                  onClick={() => handleRestore(m.id)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                                  title="Restore medicine"
                                >
                                  <i className="bi bi-arrow-counterclockwise text-sm" />
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
            {items.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  Page {currentPage} of {lastPage} · {total} total medicine{total !== 1 ? 's' : ''}
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
          </>
        )}
      </div>

      <MedicineModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        medicine={editingMedicine}
        onSave={refetch}
      />

      <ConfirmDialog
        isOpen={confirmId !== null}
        title={showTrashed ? 'Delete Medicine' : 'Move Medicine to Trash'}
        message={showTrashed ? 'This will permanently remove the medicine from your inventory. This action cannot be undone.' : 'This will move the medicine to trash. You can restore it later if needed.'}
        confirmLabel={showTrashed ? 'Delete' : 'Trash'}
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />

      <ConfirmDialog
        isOpen={bulkConfirmOpen}
        title={showTrashed ? 'Delete Selected Medicines' : 'Move Selected Medicines to Trash'}
        message={showTrashed ? `This will permanently remove ${selectedCount} selected medicine(s). This action cannot be undone.` : `This will move ${selectedCount} selected medicine(s) to trash. You can restore them later if needed.`}
        confirmLabel={showTrashed ? 'Delete Selected' : 'Trash Selected'}
        confirmVariant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}
