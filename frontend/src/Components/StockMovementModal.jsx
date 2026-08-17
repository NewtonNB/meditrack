import { useState, useEffect } from 'react';
import Modal from './Modal';
import { medicines as medsApi, stockMovements as api } from '../api';
import { toast } from 'react-toastify';

// ── Validation ────────────────────────────────────────────────────────────────

function validateForm(data) {
  const errors = {};
  if (!data.medicine_id) {
    errors.medicine_id = 'Please select a medicine.';
  }
  const qty = Number(data.quantity);
  if (!data.quantity || isNaN(qty) || qty < 1) {
    errors.quantity = 'Quantity must be at least 1.';
  } else if (!Number.isInteger(qty)) {
    errors.quantity = 'Quantity must be a whole number.';
  } else if (qty > 100000) {
    errors.quantity = 'Quantity seems too large. Please verify.';
  }
  if (!data.type) {
    errors.type = 'Movement type is required.';
  }
  if (data.reason && data.reason.length > 200) {
    errors.reason = 'Reason cannot exceed 200 characters.';
  }
  if (data.reference && data.reference.length > 100) {
    errors.reference = 'Reference cannot exceed 100 characters.';
  }
  return errors;
}

// ── Field class helper ────────────────────────────────────────────────────────

function fc(field, errors, touched) {
  const base = 'w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors';
  if (errors[field] && touched[field])  return `${base} border-red-400 bg-red-50 focus:ring-red-300`;
  if (!errors[field] && touched[field]) return `${base} border-green-400 bg-green-50 focus:ring-green-300`;
  return `${base} border-gray-300 focus:ring-blue-500`;
}

// ── Movement types config ─────────────────────────────────────────────────────

const MOVEMENT_TYPES = [
  { value: 'in',         label: 'Stock In',   icon: 'bi-arrow-down-circle',  color: 'text-green-600'  },
  { value: 'out',        label: 'Stock Out',  icon: 'bi-arrow-up-circle',    color: 'text-red-500'    },
  { value: 'adjustment', label: 'Adjustment', icon: 'bi-pencil-square',      color: 'text-blue-500'   },
  { value: 'transfer',   label: 'Transfer',   icon: 'bi-arrow-left-right',   color: 'text-purple-500' },
];

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = { medicine_id: '', type: 'in', quantity: '', reason: '', reference: '' };

export default function StockMovementModal({ open, onClose, onSuccess }) {
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [meds,     setMeds]     = useState([]);
  const [search,   setSearch]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [touched,  setTouched]  = useState({});
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setSearch('');
    setErrors({});
    setTouched({});
    medsApi.list({ per_page: 200 }).then(res => {
      const list = res.data?.data ?? res.data ?? [];
      setMeds(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, [open]);

  const filtered    = meds.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()));
  const selectedMed = meds.find(m => String(m.id) === String(form.medicine_id));

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setErrors(validateForm(next));
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validateForm(form));
  };

  const selectMedicine = (med) => {
    const next = { ...form, medicine_id: med.id };
    setForm(next);
    setSearch(med.name);
    setShowList(false);
    setTouched(t => ({ ...t, medicine_id: true }));
    setErrors(validateForm(next));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { medicine_id: true, type: true, quantity: true, reason: true, reference: true };
    setTouched(allTouched);
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    setSaving(true);
    try {
      await api.create({
        medicine_id:   form.medicine_id,
        movement_type: form.type,  // Backend expects movement_type, not type
        quantity:      Number(form.quantity),
        notes:         form.reason || undefined,  // Backend expects notes, not reason
        reference:     form.reference || undefined,
      });
      toast.success('Stock movement recorded.');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Stock movement error:', err.response?.data);
      const errorMsg = err.response?.data?.message 
        || (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : null)
        || 'Failed to record movement.';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const FErr = ({ k }) => errors[k] && touched[k]
    ? <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><i className="bi bi-exclamation-circle-fill" />{errors[k]}</p>
    : null;

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Stock Movement">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Medicine search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medicine <span className="text-red-500">*</span>
          </label>
          {selectedMed ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedMed.name}</p>
                <p className="text-xs text-gray-400">Current stock: {selectedMed.stock ?? 0} units</p>
              </div>
              <button type="button"
                onClick={() => { handleChange('medicine_id', ''); setSearch(''); }}
                className="text-gray-400 hover:text-red-500 ml-3 transition-colors">
                <i className="bi bi-x-lg text-sm" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <i className="bi bi-capsule absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowList(true); handleChange('medicine_id', ''); }}
                onFocus={() => setShowList(true)}
                onBlur={() => { handleBlur('medicine_id'); setTimeout(() => setShowList(false), 150); }}
                placeholder="Search medicine…"
                className={`${fc('medicine_id', errors, touched)} pl-9`}
              />
              {showList && filtered.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-44 overflow-y-auto">
                  {filtered.slice(0, 12).map(m => (
                    <li key={m.id}>
                      <button type="button" onMouseDown={() => selectMedicine(m)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 text-gray-700 transition-colors border-b border-gray-50 last:border-0">
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-gray-400">Stock: {m.stock ?? 0}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <FErr k="medicine_id" />
        </div>

        {/* Movement type buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Movement Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MOVEMENT_TYPES.map(t => (
              <button key={t.value} type="button"
                onClick={() => handleChange('type', t.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  form.type === t.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>
                <i className={`bi ${t.icon} ${form.type === t.value ? '' : t.color}`} />
                {t.label}
              </button>
            ))}
          </div>
          <FErr k="type" />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.quantity}
            min="1"
            onChange={e => handleChange('quantity', e.target.value)}
            onBlur={() => handleBlur('quantity')}
            placeholder="Enter quantity"
            className={fc('quantity', errors, touched)}
          />
          <FErr k="quantity" />
          {selectedMed && form.type === 'out' && form.quantity &&
            Number(form.quantity) > (selectedMed.stock ?? 0) && (
            <p className="flex items-center gap-1 text-amber-600 text-xs mt-1">
              <i className="bi bi-exclamation-triangle-fill" />
              Exceeds current stock of {selectedMed.stock ?? 0} units.
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={form.reason}
            onChange={e => handleChange('reason', e.target.value)}
            onBlur={() => handleBlur('reason')}
            placeholder="e.g. Restock from supplier, expiry removal…"
            className={fc('reason', errors, touched)}
            maxLength={200}
          />
          <FErr k="reason" />
        </div>

        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={form.reference}
            onChange={e => handleChange('reference', e.target.value)}
            onBlur={() => handleBlur('reference')}
            placeholder="e.g. INV-0042, PO-2026-001…"
            className={fc('reference', errors, touched)}
            maxLength={100}
          />
          <FErr k="reference" />
        </div>

        {/* Error summary */}
        {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
            {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} — please review the fields above.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
              saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            {saving
              ? <><i className="bi bi-arrow-clockwise animate-spin" /> Saving…</>
              : 'Record Movement'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
