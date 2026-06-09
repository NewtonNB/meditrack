import { useState } from 'react';
import { pos as api } from '../api';
import { toast } from 'react-toastify';

export default function POS() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchMedicines = async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.searchMedicines(q);
      setResults(data?.data ?? data ?? []);
    } catch { toast.error('Search failed.'); }
    finally { setSearching(false); }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
    setResults([]);
    setSearch('');
  };

  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));

  const total = cart.reduce((sum, c) => sum + (c.selling_price * c.qty), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Search Medicines</h2>
          <input
            type="text"
            placeholder="Type medicine name…"
            value={search}
            onChange={e => { setSearch(e.target.value); searchMedicines(e.target.value); }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searching && <p className="text-sm text-gray-400 mt-2">Searching…</p>}
          {results.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              {results.map(r => (
                <button
                  key={r.id}
                  onClick={() => addToCart(r)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">UGX {Number(r.selling_price).toLocaleString()} • Stock: {r.stock}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">No items in cart.</p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {cart.map(c => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">UGX {Number(c.selling_price).toLocaleString()} × {c.qty}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">UGX {Number(c.selling_price * c.qty).toLocaleString()}</span>
                      <button onClick={() => removeFromCart(c.id)} className="text-red-400 hover:text-red-600">
                        <i className="bi bi-x-circle" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold text-gray-800">Total</span>
                  <span className="font-bold text-xl text-blue-600">UGX {total.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => toast.info('Payment processing coming soon.')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Process Payment
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
