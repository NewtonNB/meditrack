import { useState, useEffect } from 'react';
import Modal from './Modal';
import { medicines as api, suppliers as suppliersApi, medicineCategories as categoriesApi, medicineNames as namesApi, medicineBrands as brandsApi } from '../api';
import { toast } from 'react-toastify';

// Fallback categories if API fails
const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Tablets' },
  { id: 2, name: 'Capsules' },
  { id: 3, name: 'Syrup' },
  { id: 4, name: 'Injection' },
  { id: 5, name: 'Ointment' },
  { id: 6, name: 'Drops' },
  { id: 7, name: 'Inhaler' },
  { id: 8, name: 'Suppository' },
  { id: 9, name: 'Other' },
];

// Fallback medicine names if API fails
const FALLBACK_NAMES = [
  { id: 1, name: 'Paracetamol', generic_name: 'Acetaminophen' },
  { id: 2, name: 'Ibuprofen', generic_name: 'Ibuprofen' },
  { id: 3, name: 'Amoxicillin', generic_name: 'Amoxicillin' },
  { id: 4, name: 'Ciprofloxacin', generic_name: 'Ciprofloxacin' },
  { id: 5, name: 'Metformin', generic_name: 'Metformin' },
  { id: 6, name: 'Omeprazole', generic_name: 'Omeprazole' },
  { id: 7, name: 'Aspirin', generic_name: 'Acetylsalicylic Acid' },
  { id: 8, name: 'Cetirizine', generic_name: 'Cetirizine' },
];

// Fallback brands if API fails
const FALLBACK_BRANDS = [
  { id: 1, name: 'Panadol', manufacturer: 'GSK' },
  { id: 2, name: 'Nurofen', manufacturer: 'Reckitt Benckiser' },
  { id: 3, name: 'Augmentin', manufacturer: 'GSK' },
  { id: 4, name: 'Cipro', manufacturer: 'Bayer' },
  { id: 5, name: 'Glucophage', manufacturer: 'Merck' },
  { id: 6, name: 'Losec', manufacturer: 'AstraZeneca' },
  { id: 7, name: 'Bayer', manufacturer: 'Bayer' },
  { id: 8, name: 'Zyrtec', manufacturer: 'UCB' },
  { id: 9, name: 'Generic', manufacturer: 'Various' },
];

const today = () => new Date().toISOString().split('T')[0];

export default function MedicineModal({ isOpen, onClose, medicine, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    stock: '',
    cost_price: '',
    selling_price: '',
    expiry_date: '',
    supplier_id: '',
  });
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [medicineNames, setMedicineNames] = useState(FALLBACK_NAMES);
  const [medicineBrands, setMedicineBrands] = useState(FALLBACK_BRANDS);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});

  // ── Populate form when editing ────────────────────────────────────────────
  useEffect(() => {
    if (medicine) {
      setFormData({
        name:          medicine.name          || '',
        brand:         medicine.brand         || '',
        category:      medicine.category      || '',
        stock:         medicine.stock         ?? '',
        cost_price:    medicine.cost_price    ?? '',
        selling_price: medicine.selling_price ?? '',
        expiry_date:   medicine.expiry_date   ? medicine.expiry_date.split('T')[0] : '',
        supplier_id:   medicine.supplier_id   || '',
      });
    } else {
      setFormData({ name: '', brand: '', category: '', stock: '', cost_price: '', selling_price: '', expiry_date: '', supplier_id: '' });
    }
    setErrors({});
  }, [medicine, isOpen]);

  // ── Load suppliers & categories & names & brands ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    
    suppliersApi.list()
      .then(res => setSuppliers(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])))
      .catch((err) => {
        console.error('Failed to load suppliers:', err);
        toast.error('Failed to load suppliers.');
      });
    
    categoriesApi.list({ active_only: true })
      .then(res => {
        const cats = Array.isArray(res.data) ? res.data : [];
        if (cats.length > 0) setCategories(cats);
      })
      .catch((err) => console.error('Failed to load categories:', err));

    namesApi.list({ active_only: true })
      .then(res => {
        const names = Array.isArray(res.data) ? res.data : [];
        if (names.length > 0) setMedicineNames(names);
      })
      .catch((err) => console.error('Failed to load medicine names:', err));

    brandsApi.list({ active_only: true })
      .then(res => {
        const brands = Array.isArray(res.data) ? res.data : [];
        if (brands.length > 0) setMedicineBrands(brands);
      })
      .catch((err) => console.error('Failed to load brands:', err));
  }, [isOpen]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e  = {};
    const cp = parseFloat(formData.cost_price);
    const sp = parseFloat(formData.selling_price);
    const st = parseInt(formData.stock);

    if (!formData.name.trim())
      e.name = 'Medicine name is required.';

    if (!formData.brand.trim())
      e.brand = 'Brand is required.';

    if (!formData.category)
      e.category = 'Please select a category.';

    if (formData.stock === '' || isNaN(st))
      e.stock = 'Stock quantity is required.';
    else if (st < 0)
      e.stock = 'Stock cannot be negative.';

    if (!formData.expiry_date)
      e.expiry_date = 'Expiry date is required.';
    else if (formData.expiry_date <= today())
      e.expiry_date = 'Expiry date must be in the future.';

    if (formData.cost_price === '' || isNaN(cp))
      e.cost_price = 'Cost price is required.';
    else if (cp <= 0)
      e.cost_price = 'Cost price must be greater than 0.';

    if (formData.selling_price === '' || isNaN(sp))
      e.selling_price = 'Selling price is required.';
    else if (sp <= 0)
      e.selling_price = 'Selling price must be greater than 0.';
    else if (!isNaN(cp) && sp < cp)
      e.selling_price = 'Selling price must be at least equal to cost price.';

    if (!formData.supplier_id)
      e.supplier_id = 'Please select a supplier.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        stock:         parseInt(formData.stock),
        cost_price:    parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
      };

      if (medicine) {
        await api.update(medicine.id, payload);
        toast.success('Medicine updated successfully.');
      } else {
        await api.create(payload);
        toast.success('Medicine added successfully.');
      }
      onSave();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        toast.error('Please fix the validation errors.');
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Field helper ──────────────────────────────────────────────────────────
  const field = (key) => ({
    value:    formData[key],
    onChange: (e) => {
      setFormData(p => ({ ...p, [key]: e.target.value }));
      if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
    },
    className: `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
      errors[key] ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-300 hover:border-gray-400'
    }`,
  });

  const FieldError = ({ k }) => errors[k]
    ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><i className="bi bi-exclamation-circle" />{errors[k]}</p>
    : null;

  const Label = ({ text, required }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medicine ? 'Edit Medicine' : 'Add New Medicine'}
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Summary error banner */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <i className="bi bi-exclamation-triangle-fill" />
            Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} before saving.
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">

          {/* Name — full width */}
          <div className="col-span-2">
            <Label text="Medicine Name" required />
            <select {...field('name')}>
              <option value="">Select medicine name…</option>
              {medicineNames.map(n => <option key={n.id} value={n.name}>{n.name} {n.generic_name ? `(${n.generic_name})` : ''}</option>)}
            </select>
            <FieldError k="name" />
          </div>

          {/* Brand */}
          <div>
            <Label text="Brand" required />
            <select {...field('brand')}>
              <option value="">Select brand…</option>
              {medicineBrands.map(b => <option key={b.id} value={b.name}>{b.name} {b.manufacturer ? `- ${b.manufacturer}` : ''}</option>)}
            </select>
            <FieldError k="brand" />
          </div>

          {/* Category */}
          <div>
            <Label text="Category" required />
            <select {...field('category')}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <FieldError k="category" />
          </div>

          {/* Stock */}
          <div>
            <Label text="Stock Quantity" required />
            <input type="number" min="0" placeholder="0" {...field('stock')} />
            <FieldError k="stock" />
          </div>

          {/* Expiry Date */}
          <div>
            <Label text="Expiry Date" required />
            <input type="date" min={today()} {...field('expiry_date')} />
            <FieldError k="expiry_date" />
          </div>

          {/* Cost Price */}
          <div>
            <Label text="Cost Price (UGX)" required />
            <input type="number" min="0" step="1" placeholder="0" {...field('cost_price')} />
            <FieldError k="cost_price" />
          </div>

          {/* Selling Price */}
          <div>
            <Label text="Selling Price (UGX)" required />
            <input type="number" min="0" step="1" placeholder="0" {...field('selling_price')} />
            {!errors.selling_price && formData.cost_price && formData.selling_price &&
              parseFloat(formData.selling_price) >= parseFloat(formData.cost_price) && (
              <p className="text-green-600 text-xs mt-1">
                Margin: UGX {(parseFloat(formData.selling_price) - parseFloat(formData.cost_price)).toLocaleString()}
                {' '}({Math.round(((parseFloat(formData.selling_price) - parseFloat(formData.cost_price)) / parseFloat(formData.cost_price)) * 100)}%)
              </p>
            )}
            <FieldError k="selling_price" />
          </div>

          {/* Supplier — full width */}
          <div className="col-span-2">
            <Label text="Supplier" required />
            <select {...field('supplier_id')}>
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <FieldError k="supplier_id" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading
              ? <><i className="bi bi-arrow-clockwise animate-spin" /> Saving…</>
              : <><i className={`bi ${medicine ? 'bi-pencil-square' : 'bi-plus-circle'}`} />{medicine ? 'Update Medicine' : 'Add Medicine'}</>
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}
