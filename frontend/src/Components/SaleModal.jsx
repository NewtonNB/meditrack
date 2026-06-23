import { useState, useEffect, useRef, useCallback } from 'react';
import Modal from './Modal';
import { medicines as medicinesApi, customers as customersApi, sales as salesApi } from '../api';
import { toast } from 'react-toastify';

const PAYMENT_METHODS = [
  { value: 'cash',         label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'card',         label: 'Card' },
  { value: 'insurance',    label: 'Insurance' },
  { value: 'credit',       label: 'Credit' },
];

export default function SaleModal({ isOpen, onClose, onSave }) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [medicine,       setMedicine]       = useState(null);
  const [customer,       setCustomer]       = useState(null);
  const [quantity,       setQuantity]       = useState('1');
  const [paymentMethod,  setPaymentMethod]  = useState('cash');
  const [notes,          setNotes]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [errors,         setErrors]         = useState({});

  // ── Medicine search ────────────────────────────────────────────────────────
  const [medSearch,      setMedSearch]      = useState('');
  const [medResults,     setMedResults]     = useState([]);
  const [medSearching,   setMedSearching]   = useState(false);
  const medTimer = useRef(null);

  // ── Customer search ────────────────────────────────────────────────────────
  const [custSearch,     setCustSearch]     = useState('');
  const [custResults,    setCustResults]    = useState([]);
  const [custSearching,  setCustSearching]  = useState(false);
  const custTimer = useRef(null);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setMedicine(null); setCustomer(null);
      setQuantity('1'); setPaymentMethod('cash'); setNotes('');
      setMedSearch(''); setMedResults([]);
      setCustSearch(''); setCustResults([]);
      setErrors({});
    }
  }, [isOpen]);

  // ── Medicine search (debounced) ────────────────────────────────────────────
  const searchMeds = useCallback((q) => {
    clearTimeout(medTimer.current);
    if (!q.trim()) { setMedResults([]); return; }
    medTimer.current = setTimeout(async () => {
      setMedSearching(true);
      try {
        const { data } = await medicinesApi.list({ search: q, per_page: 8 });
        setMedResults(data?.data ?? (Array.isArray(data) ? data : []));
      } catch { setMedResults([]); }
      finally { setMedSearching(false); }
    }, 300);
  }, []);

  // ── Customer search (debounced) ────────────────────────────────────────────
  const searchCusts = useCallback((q) => {
    clearTimeout(custTimer.current);
    if (!q.trim()) { setCustResults([]); return; }
    custTimer.current = setTimeout(async () => {
      setCustSearching(true);
      try {
        const { data } = await customersApi.list({ search: q, per_page: 6 });
        setCustResults(data?.data ?? (Array.isArray(data) ? data : []));
      } catch { setCustResults([]); }
      finally { setCustSearching(false); }
    }, 300);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const unitPrice = medicine ? Number(medicine.selling_price) : 0;
  const total     = unitPrice * (parseInt(quantity) || 0);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!medicine)                               e.medicine  = 'Please select a medicine.';
    const qty = parseInt(quantity);
    if (!quantity || isNaN(qty) || qty < 1)      e.quantity  = 'Quantity must be at least 1.';
    else if (medicine && qty > medicine.stock)   e.quantity  = `Only ${medicine.stock} units in stock.`;
    if (!paymentMethod)                          e.payment   = 'Please select a payment method.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await salesApi.create({
        medicine_id:    medicine.id,
        customer_id:    customer?.id ?? null,
        quantity:       parseInt(quantity),
        unit_price:     unitPrice,
        payment_method: paymentMethod,
        notes:          notes.trim() || null,
      });
      toast.success('Sale recorded successfully.');
      onSave();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        const raw = err.response.data.errors ?? {};
        setErrors(raw);
        toast.error('Please fix the errors below.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to record sale.');
      }
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ k }) => errors[k]
    ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><i className="bi bi-exclamation-circle" />{Array.isArray(errors[k]) ? errors[k][0] : errors[k]}</p>
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record New Sale">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* ── Medicine ──────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medicine <span className="text-red-500">*</span>
          </label>

          {medicine ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-gray-900">{medicine.name}</p>
                <p className="text-xs text-gray-500">
                  UGX {Number(medicine.selling_price).toLocaleString()} &nbsp;·&nbsp;
                  <span className={medicine.stock < 10 ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                    {medicine.stock} in stock
                  </span>
                </p>
              </div>
              <button type="button" onClick={() => { setMedicine(null); setMedSearch(''); }}
                className="text-gray-400 hover:text-red-500 transition-colors ml-3">
                <i className="bi bi-x-lg text-sm" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <i className="bi bi-capsule absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search medicine by name…"
                value={medSearch}
                onChange={e => { setMedSearch(e.target.value); searchMeds(e.target.value); if (errors.medicine) setErrors(p => { const n={...p}; delete n.medicine; return n; }); }}
                className={`w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.medicine ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                autoComplete="off"
              />
              {medSearching && <i className="bi bi-arrow-clockwise animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm" />}
              {medResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                  {medResults.map(m => (
                    <button key={m.id} type="button"
                      onClick={() => { setMedicine(m); setMedSearch(''); setMedResults([]); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors">
                      <p className="text-sm font-medium text-gray-900">{m.name} {m.brand ? <span className="text-gray-400 font-normal">· {m.brand}</span> : ''}</p>
                      <p className="text-xs text-gray-400">
                        UGX {Number(m.selling_price).toLocaleString()}
                        &nbsp;·&nbsp;
                        <span className={m.stock < 10 ? 'text-amber-600 font-medium' : ''}>{m.stock} in stock</span>
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {medSearch.trim() && !medSearching && medResults.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">No medicines found.</p>
              )}
            </div>
          )}
          <FieldError k="medicine" />
        </div>

        {/* ── Quantity ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="1" max={medicine?.stock ?? 9999}
              value={quantity}
              onChange={e => { setQuantity(e.target.value); if (errors.quantity) setErrors(p => { const n={...p}; delete n.quantity; return n; }); }}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.quantity ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            <FieldError k="quantity" />
          </div>

          {/* Unit price (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (UGX)</label>
            <input
              type="text" readOnly
              value={medicine ? `UGX ${Number(medicine.selling_price).toLocaleString()}` : '—'}
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        {/* ── Payment method ─────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(pm => (
              <button key={pm.value} type="button"
                onClick={() => setPaymentMethod(pm.value)}
                className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors text-center ${
                  paymentMethod === pm.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>
                {pm.label}
              </button>
            ))}
          </div>
          <FieldError k="payment" />
        </div>

        {/* ── Customer (optional) ────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          {customer ? (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                <p className="text-xs text-gray-400">{customer.phone ?? customer.email ?? '—'}</p>
              </div>
              <button type="button" onClick={() => { setCustomer(null); setCustSearch(''); }}
                className="text-gray-400 hover:text-red-500 transition-colors ml-3">
                <i className="bi bi-x-lg text-sm" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <i className="bi bi-person absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text" placeholder="Search customer…"
                value={custSearch}
                onChange={e => { setCustSearch(e.target.value); searchCusts(e.target.value); }}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
              {custSearching && <i className="bi bi-arrow-clockwise animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm" />}
              {custResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {custResults.map(c => (
                    <button key={c.id} type="button"
                      onClick={() => { setCustomer(c); setCustSearch(''); setCustResults([]); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 text-sm transition-colors">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone ?? c.email ?? '—'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Notes ─────────────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-xs font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={2} placeholder="Prescription details, remarks…"
            value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* ── Total preview ──────────────────────────────────────────────────── */}
        {medicine && parseInt(quantity) > 0 && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between border border-gray-100">
            <span className="text-sm text-gray-600">Total</span>
            <span className="text-lg font-bold text-blue-600 tabular-nums">UGX {total.toLocaleString()}</span>
          </div>
        )}

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading
              ? <><i className="bi bi-arrow-clockwise animate-spin" /> Recording…</>
              : <><i className="bi bi-check-lg" /> Record Sale</>
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}
