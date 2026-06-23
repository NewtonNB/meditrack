import { useState, useEffect, useRef, useCallback } from 'react';
import Modal from './Modal';
import { medicines as medicinesApi, suppliers as suppliersApi, purchases as purchasesApi } from '../api';
import { toast } from 'react-toastify';

const today = () => new Date().toISOString().split('T')[0];

const emptyItem = () => ({ medicine: null, medSearch: '', medResults: [], medSearching: false, quantity: '1', unit_cost: '' });

export default function PurchaseModal({ isOpen, onClose, onSave }) {
  const [supplierId,        setSupplierId]       = useState('');
  const [purchaseDate,      setPurchaseDate]      = useState(today());
  const [deliveryDate,      setDeliveryDate]      = useState('');
  const [notes,             setNotes]             = useState('');
  const [shippingCost,      setShippingCost]      = useState('');
  const [discountAmount,    setDiscountAmount]    = useState('');
  const [items,             setItems]             = useState([emptyItem()]);
  const [suppliers,         setSuppliers]         = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [errors,            setErrors]            = useState({});

  const medTimers = useRef([]);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setSupplierId(''); setPurchaseDate(today()); setDeliveryDate('');
      setNotes(''); setShippingCost(''); setDiscountAmount('');
      setItems([emptyItem()]); setErrors({});
    }
  }, [isOpen]);

  // ── Load suppliers ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    suppliersApi.list()
      .then(res => setSuppliers(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])))
      .catch(() => toast.error('Failed to load suppliers.'));
  }, [isOpen]);

  // ── Medicine search per item ───────────────────────────────────────────────
  const searchMed = useCallback((idx, q) => {
    clearTimeout(medTimers.current[idx]);
    if (!q.trim()) { updateItem(idx, { medResults: [] }); return; }
    medTimers.current[idx] = setTimeout(async () => {
      updateItem(idx, { medSearching: true });
      try {
        const { data } = await medicinesApi.list({ search: q, per_page: 8 });
        updateItem(idx, { medResults: data?.data ?? (Array.isArray(data) ? data : []), medSearching: false });
      } catch {
        updateItem(idx, { medResults: [], medSearching: false });
      }
    }, 300);
  }, []);

  const updateItem = (idx, patch) =>
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const addItem    = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  // ── Totals ─────────────────────────────────────────────────────────────────
  const subtotal = items.reduce((s, it) => {
    const q = parseInt(it.quantity) || 0;
    const c = parseFloat(it.unit_cost) || 0;
    return s + q * c;
  }, 0);
  const shipping  = parseFloat(shippingCost)   || 0;
  const discount  = parseFloat(discountAmount) || 0;
  const grandTotal = subtotal + shipping - discount;

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!supplierId)      e.supplier_id   = 'Please select a supplier.';
    if (!purchaseDate)    e.purchase_date  = 'Purchase date is required.';
    if (deliveryDate && deliveryDate < purchaseDate)
      e.expected_delivery_date = 'Delivery date must be on or after purchase date.';

    items.forEach((it, i) => {
      if (!it.medicine)                              e[`item_${i}_medicine`]  = 'Select a medicine.';
      if (!it.quantity || parseInt(it.quantity) < 1) e[`item_${i}_quantity`]  = 'Min 1.';
      if (!it.unit_cost || parseFloat(it.unit_cost) <= 0) e[`item_${i}_cost`] = 'Enter cost > 0.';
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await purchasesApi.create({
        supplier_id:            parseInt(supplierId),
        purchase_date:          purchaseDate,
        expected_delivery_date: deliveryDate || null,
        notes:                  notes.trim() || null,
        shipping_cost:          shipping   || null,
        discount_amount:        discount   || null,
        items: items.map(it => ({
          medicine_id: it.medicine.id,
          quantity:    parseInt(it.quantity),
          unit_cost:   parseFloat(it.unit_cost),
        })),
      });
      toast.success('Purchase order created.');
      onSave();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        const raw = err.response.data.errors ?? {};
        setErrors(raw);
        toast.error('Please fix the errors below.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to create purchase.');
      }
    } finally {
      setLoading(false);
    }
  };

  const FErr = ({ k }) => errors[k]
    ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><i className="bi bi-exclamation-circle" />{Array.isArray(errors[k]) ? errors[k][0] : errors[k]}</p>
    : null;

  const Lbl = ({ text, req }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {text}{req && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Purchase Order">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Error banner */}
        {Object.keys(errors).length > 0 && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <i className="bi bi-exclamation-triangle-fill" />
            Fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} before saving.
          </div>
        )}

        {/* Supplier + dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Lbl text="Supplier" req />
            <select
              value={supplierId}
              onChange={e => { setSupplierId(e.target.value); setErrors(p => { const n={...p}; delete n.supplier_id; return n; }); }}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.supplier_id ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            >
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <FErr k="supplier_id" />
          </div>

          <div>
            <Lbl text="Purchase Date" req />
            <input type="date" value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.purchase_date ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            <FErr k="purchase_date" />
          </div>

          <div>
            <Lbl text="Expected Delivery" />
            <input type="date" value={deliveryDate} min={purchaseDate}
              onChange={e => setDeliveryDate(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.expected_delivery_date ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            <FErr k="expected_delivery_date" />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Lbl text="Items" req />
            <button type="button" onClick={addItem}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
              <i className="bi bi-plus-circle" /> Add item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      <i className="bi bi-x-lg text-xs" />
                    </button>
                  )}
                </div>

                {/* Medicine search */}
                {it.medicine ? (
                  <div className="flex items-center justify-between bg-white border border-blue-200 rounded-lg px-3 py-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{it.medicine.name}</p>
                      <p className="text-xs text-gray-400">Cost: UGX {Number(it.medicine.cost_price ?? 0).toLocaleString()}</p>
                    </div>
                    <button type="button"
                      onClick={() => updateItem(idx, { medicine: null, medSearch: '', unit_cost: '' })}
                      className="text-gray-400 hover:text-red-500 ml-3">
                      <i className="bi bi-x-lg text-sm" />
                    </button>
                  </div>
                ) : (
                  <div className="relative mb-2">
                    <i className="bi bi-capsule absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input type="text" placeholder="Search medicine…"
                      value={it.medSearch}
                      onChange={e => { updateItem(idx, { medSearch: e.target.value }); searchMed(idx, e.target.value); }}
                      className={`w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`item_${idx}_medicine`] ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                      autoComplete="off"
                    />
                    {it.medSearching && <i className="bi bi-arrow-clockwise animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm" />}
                    {it.medResults.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                        {it.medResults.map(m => (
                          <button key={m.id} type="button"
                            onClick={() => updateItem(idx, { medicine: m, medSearch: '', medResults: [], unit_cost: m.cost_price ?? '' })}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 text-sm transition-colors">
                            <p className="font-medium text-gray-900">{m.name}{m.brand ? <span className="text-gray-400 font-normal"> · {m.brand}</span> : ''}</p>
                            <p className="text-xs text-gray-400">Cost: UGX {Number(m.cost_price ?? 0).toLocaleString()}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {errors[`item_${idx}_medicine`] && <p className="text-red-500 text-xs mt-1">{errors[`item_${idx}_medicine`]}</p>}
                  </div>
                )}

                {/* Qty + unit cost */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty <span className="text-red-500">*</span></label>
                    <input type="number" min="1" value={it.quantity}
                      onChange={e => updateItem(idx, { quantity: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`item_${idx}_quantity`] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    {errors[`item_${idx}_quantity`] && <p className="text-red-500 text-xs mt-1">{errors[`item_${idx}_quantity`]}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Cost (UGX) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" step="1" placeholder="0" value={it.unit_cost}
                      onChange={e => updateItem(idx, { unit_cost: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[`item_${idx}_cost`] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    />
                    {errors[`item_${idx}_cost`] && <p className="text-red-500 text-xs mt-1">{errors[`item_${idx}_cost`]}</p>}
                  </div>
                </div>

                {/* Line total */}
                {it.quantity && it.unit_cost && (
                  <p className="text-xs text-right text-gray-500 mt-1.5 font-medium">
                    Line total: <span className="text-gray-900">UGX {(parseInt(it.quantity || 0) * parseFloat(it.unit_cost || 0)).toLocaleString()}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shipping / discount / notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Lbl text="Shipping Cost (UGX)" />
            <input type="number" min="0" step="1" placeholder="0" value={shippingCost}
              onChange={e => setShippingCost(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <Lbl text="Discount (UGX)" />
            <input type="number" min="0" step="1" placeholder="0" value={discountAmount}
              onChange={e => setDiscountAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <Lbl text="Notes" />
          <textarea rows={2} placeholder="Delivery instructions, remarks…"
            value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Grand total */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span className="tabular-nums">UGX {subtotal.toLocaleString()}</span>
          </div>
          {shipping > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span className="tabular-nums">+ UGX {shipping.toLocaleString()}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="tabular-nums">− UGX {discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1">
            <span>Total</span>
            <span className="text-blue-600 tabular-nums">UGX {grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading
              ? <><i className="bi bi-arrow-clockwise animate-spin" /> Creating…</>
              : <><i className="bi bi-bag-check" /> Create Order</>
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}
