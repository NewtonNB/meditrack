import { useState, useRef, useEffect, useCallback } from 'react';
import { pos as posApi, medicines as medicinesApi, sales as salesApi } from '../api';
import { toast } from 'react-toastify';

const PAYMENT_METHODS = ['Cash', 'Card', 'Mobile Money', 'Insurance'];

// ─── Receipt Modal ────────────────────────────────────────────────────────────
function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="bi bi-check-lg text-2xl" />
          </div>
          <h3 className="text-lg font-bold">Payment Successful</h3>
          <p className="text-blue-200 text-sm mt-1">Transaction #{receipt.transaction_id ?? receipt.id ?? '—'}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3 text-sm">
          {receipt.items?.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-gray-600">{item.name} × {item.quantity}</span>
              <span className="font-medium">UGX {Number(item.total ?? item.selling_price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-blue-600">UGX {Number(receipt.total ?? 0).toLocaleString()}</span>
            </div>
            {receipt.change > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Change</span>
                <span className="font-medium">UGX {Number(receipt.change).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Payment</span>
              <span>{receipt.payment_method ?? '—'}</span>
            </div>
            {receipt.customer && (
              <div className="flex justify-between text-gray-500">
                <span>Customer</span>
                <span>{receipt.customer}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main POS Component ───────────────────────────────────────────────────────
export default function POS() {
  // Medicine search
  const [search, setSearch]           = useState('');
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const searchTimer                   = useRef(null);

  // Cart
  const [cart, setCart]               = useState([]);

  // Customer search
  const [custSearch, setCustSearch]   = useState('');
  const [custResults, setCustResults] = useState([]);
  const [custSearching, setCustSearching] = useState(false);
  const [customer, setCustomer]       = useState(null);
  const custTimer                     = useRef(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid]   = useState('');
  const [discount, setDiscount]       = useState('');
  const [notes, setNotes]             = useState('');
  const [processing, setProcessing]   = useState(false);

  // Receipt
  const [receipt, setReceipt]         = useState(null);

  // ── Derived totals ──────────────────────────────────────────────────────────
  const subtotal   = cart.reduce((s, c) => s + c.selling_price * c.qty, 0);
  const discountAmt = Math.min(Number(discount) || 0, subtotal);
  const total      = subtotal - discountAmt;
  const change     = Math.max((Number(amountPaid) || 0) - total, 0);

  // ── Medicine search (debounced 300ms) ───────────────────────────────────────
  const searchMedicines = useCallback((q) => {
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await medicinesApi.list({ search: q, per_page: 10 });
        // medicines endpoint returns paginated: { data: [...] }
        const list = data?.data ?? (Array.isArray(data) ? data : []);
        setResults(list);
      } catch {
        toast.error('Medicine search failed.');
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  // ── Customer search (debounced 300ms) ──────────────────────────────────────
  const searchCustomers = useCallback((q) => {
    clearTimeout(custTimer.current);
    if (!q.trim()) { setCustResults([]); return; }
    custTimer.current = setTimeout(async () => {
      setCustSearching(true);
      try {
        const { data } = await posApi.searchCustomers(q);
        setCustResults(data?.data ?? (Array.isArray(data) ? data : []));
      } catch {
        setCustResults([]);
      } finally {
        setCustSearching(false);
      }
    }, 300);
  }, []);

  // ── Cart helpers ────────────────────────────────────────────────────────────
  const addToCart = (item) => {
    if (item.stock < 1) { toast.warning(`${item.name} is out of stock.`); return; }
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        if (existing.qty >= item.stock) {
          toast.warning(`Only ${item.stock} units available.`);
          return prev;
        }
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setResults([]);
    setSearch('');
  };

  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (qty > c.stock) { toast.warning(`Only ${c.stock} units available.`); return c; }
      return { ...c, qty };
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setCustSearch('');
    setDiscount('');
    setAmountPaid('');
    setNotes('');
  };

  // ── Process payment ─────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty.'); return; }
    if (paymentMethod === 'Cash' && amountPaid && Number(amountPaid) < total) {
      toast.error('Amount paid is less than the total.'); return;
    }

    setProcessing(true);
    try {
      // sales.create handles one medicine per call
      const paymentMethodKey = paymentMethod.toLowerCase().replace(/\s+/g, '_');

      for (const item of cart) {
        await salesApi.create({
          medicine_id:    item.id,
          quantity:       item.qty,
          unit_price:     item.selling_price,
          payment_method: paymentMethodKey,
          customer_id:    customer?.id ?? null,
          notes:          notes || null,
        });
      }

      setReceipt({
        transaction_id: `POS-${Date.now()}`,
        items: cart.map(c => ({
          name:         c.name,
          quantity:     c.qty,
          selling_price: c.selling_price,
          total:        c.selling_price * c.qty,
        })),
        total,
        change,
        payment_method: paymentMethod,
        customer: customer?.name,
      });

      clearCart();
      toast.success('Sale completed!');
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors
        || 'Payment failed. Please try again.';
      toast.error(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setProcessing(false);
    }
  };

  // ── Keyboard shortcut: F2 focuses medicine search ──────────────────────────
  useEffect(() => {
    const searchRef = document.getElementById('pos-medicine-search');
    const handler = (e) => { if (e.key === 'F2') { e.preventDefault(); searchRef?.focus(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-sm text-gray-400 mt-0.5">Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">F2</kbd> to focus search</p>
        </div>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors"
          >
            <i className="bi bi-trash3" /> Clear cart
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* ── Left: Search + Cart ──────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">

          {/* Medicine Search */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="bi bi-search text-blue-500" /> Search Medicines
            </h2>
            <div className="relative">
              <input
                id="pos-medicine-search"
                type="text"
                placeholder="Search by name, brand…"
                value={search}
                onChange={e => { setSearch(e.target.value); searchMedicines(e.target.value); }}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
              <i className="bi bi-capsule absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {searching && (
                <i className="bi bi-arrow-clockwise animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-400" />
              )}
            </div>

            {/* Search results dropdown */}
            {results.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-md">
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => addToCart(r)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.brand ?? ''}{r.category ? ` · ${r.category}` : ''}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold text-blue-600">UGX {Number(r.selling_price).toLocaleString()}</p>
                        <p className={`text-xs ${r.stock < 10 ? 'text-red-500' : 'text-gray-400'}`}>
                          {r.stock} in stock
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {search.trim() && !searching && results.length === 0 && (
              <p className="text-sm text-gray-400 mt-2 text-center py-2">No medicines found.</p>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <i className="bi bi-cart3 text-blue-500" /> Cart
                {cart.length > 0 && (
                  <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {cart.reduce((s, c) => s + c.qty, 0)}
                  </span>
                )}
              </h2>
            </div>

            {cart.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <i className="bi bi-cart-x text-4xl text-gray-200" />
                <p className="text-sm text-gray-400 mt-2">Cart is empty. Search for a medicine above.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map(c => (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">UGX {Number(c.selling_price).toLocaleString()} each</p>
                    </div>

                    {/* Qty stepper */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQty(c.id, c.qty - 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <i className="bi bi-dash text-xs" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={c.stock}
                        value={c.qty}
                        onChange={e => updateQty(c.id, parseInt(e.target.value) || 1)}
                        className="w-12 text-center text-sm font-medium border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button
                        onClick={() => updateQty(c.id, c.qty + 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <i className="bi bi-plus text-xs" />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right shrink-0 w-28">
                      <p className="text-sm font-semibold text-gray-900">
                        UGX {Number(c.selling_price * c.qty).toLocaleString()}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(c.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Remove item"
                    >
                      <i className="bi bi-x-lg text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Order Summary & Payment ──────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Customer */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="bi bi-person text-blue-500" /> Customer
              <span className="text-xs font-normal text-gray-400">(optional)</span>
            </h2>

            {customer ? (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.phone ?? customer.email ?? '—'}</p>
                </div>
                <button
                  onClick={() => { setCustomer(null); setCustSearch(''); }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove customer"
                >
                  <i className="bi bi-x-lg text-sm" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customer…"
                  value={custSearch}
                  onChange={e => { setCustSearch(e.target.value); searchCustomers(e.target.value); }}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                />
                <i className="bi bi-person absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                {custSearching && (
                  <i className="bi bi-arrow-clockwise animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm" />
                )}
                {custResults.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {custResults.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setCustomer(c); setCustSearch(''); setCustResults([]); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 text-sm transition-colors"
                      >
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.phone ?? c.email ?? '—'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <i className="bi bi-credit-card text-blue-500" /> Payment
            </h2>

            {/* Payment method */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      paymentMethod === m
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                Discount (UGX)
              </label>
              <input
                type="number"
                min="0"
                max={subtotal}
                placeholder="0"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount paid (Cash only) */}
            {paymentMethod === 'Cash' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Amount Paid (UGX)
                </label>
                <input
                  type="number"
                  min={total}
                  placeholder={total.toLocaleString()}
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {change > 0 && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Change: UGX {change.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Notes</label>
              <textarea
                rows={2}
                placeholder="Prescription notes, remarks…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-2">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="bi bi-receipt text-blue-500" /> Summary
            </h2>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>UGX {subtotal.toLocaleString()}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>− UGX {discountAmt.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
              <span>Total</span>
              <span className="text-blue-600">UGX {total.toLocaleString()}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing || cart.length === 0}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <i className="bi bi-arrow-clockwise animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <i className="bi bi-bag-check" />
                  Complete Sale · UGX {total.toLocaleString()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt / success modal */}
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}
