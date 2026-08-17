import { useState, useEffect } from 'react';
import Modal from './Modal';
import { customers as api } from '../api';
import { toast } from 'react-toastify';

// ── Validation ────────────────────────────────────────────────────────────────

function validateForm(data) {
  const errors = {};

  const name = data.name.trim();
  if (!name) {
    errors.name = 'Customer name is required.';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.length > 100) {
    errors.name = 'Name cannot exceed 100 characters.';
  } else if (!/^[a-zA-Z0-9 &.,'\-()]+$/.test(name)) {
    errors.name = 'Name contains invalid characters.';
  }

  const email = data.email.trim();
  const phone = data.phone.trim();

  if (!email && !phone) {
    errors.contact = 'Provide at least an email or phone number.';
  }

  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errors.email = 'Enter a valid email address.';
    } else if (email.length > 150) {
      errors.email = 'Email cannot exceed 150 characters.';
    }
  }

  if (phone) {
    if (!/^\+?[\d\s\-().]{7,20}$/.test(phone)) {
      errors.phone = 'Enter a valid phone number (7–20 digits).';
    }
  }

  if (data.address.trim().length > 250) {
    errors.address = 'Address cannot exceed 250 characters.';
  }

  const notes = (data.notes ?? '').trim();
  if (notes.length > 300) {
    errors.notes = `Notes cannot exceed 300 characters (${notes.length}/300).`;
  }

  return errors;
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function fieldClass(error, touched) {
  const base = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors';
  if (error && touched)   return `${base} border-red-400 bg-red-50 focus:ring-red-300`;
  if (!error && touched)  return `${base} border-green-400 bg-green-50 focus:ring-green-300`;
  return `${base} border-gray-300 focus:ring-blue-500`;
}

function FieldWrap({ label, required, error, touched, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && touched
        ? <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><i className="bi bi-exclamation-circle-fill" />{error}</p>
        : hint ? <p className="text-gray-400 text-xs mt-1">{hint}</p> : null}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY = { name: '', email: '', phone: '', address: '', notes: '' };

export default function CustomerModal({ isOpen, onClose, customer, onSave }) {
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(customer ? {
        name:    customer.name    ?? '',
        email:   customer.email   ?? '',
        phone:   customer.phone   ?? '',
        address: customer.address ?? '',
        notes:   customer.notes   ?? '',
      } : EMPTY);
      setErrors({});
      setTouched({});
    }
  }, [customer, isOpen]);

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field] || touched.contact) setErrors(validateForm(next));
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validateForm(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(EMPTY).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    setLoading(true);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
      if (customer) {
        await api.update(customer.id, payload);
        toast.success('Customer updated successfully.');
      } else {
        await api.create(payload);
        toast.success('Customer added successfully.');
      }
      onSave();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        const flat = Object.fromEntries(
          Object.entries(err.response.data.errors ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
        );
        setErrors(flat);
        setTouched(Object.fromEntries(Object.keys(EMPTY).map(k => [k, true])));
        toast.error('Please fix the validation errors.');
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const errorCount = Object.keys(errors).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customer ? 'Edit Customer' : 'Add New Customer'}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Name */}
        <FieldWrap label="Full Name" required error={errors.name} touched={touched.name}
          hint="First and last name">
          <div className="relative">
            <input type="text" value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              className={fieldClass(errors.name, touched.name)}
              placeholder="e.g. John Doe" maxLength={100} />
            {touched.name && !errors.name && form.name.trim() &&
              <i className="bi bi-check-circle-fill text-green-500 absolute right-3 top-1/2 -translate-y-1/2 text-sm" />}
          </div>
        </FieldWrap>

        {/* Contact requirement banner */}
        {errors.contact && (touched.email || touched.phone) && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            <i className="bi bi-info-circle-fill flex-shrink-0" />
            {errors.contact}
          </div>
        )}

        {/* Email + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldWrap label="Email" error={errors.email} touched={touched.email}
            hint="Optional if phone provided">
            <div className="relative">
              <input type="email" value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={fieldClass(errors.email || (!form.email.trim() && !form.phone.trim() && touched.email) ? errors.contact : null, touched.email)}
                placeholder="john@example.com" maxLength={150} />
              {touched.email && form.email.trim() && !errors.email &&
                <i className="bi bi-check-circle-fill text-green-500 absolute right-3 top-1/2 -translate-y-1/2 text-sm" />}
            </div>
          </FieldWrap>

          <FieldWrap label="Phone" error={errors.phone} touched={touched.phone}
            hint="Optional if email provided">
            <div className="relative">
              <input type="tel" value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={fieldClass(errors.phone, touched.phone)}
                placeholder="+256 700 000000" maxLength={20} />
              {touched.phone && form.phone.trim() && !errors.phone &&
                <i className="bi bi-check-circle-fill text-green-500 absolute right-3 top-1/2 -translate-y-1/2 text-sm" />}
            </div>
          </FieldWrap>
        </div>

        {/* Address */}
        <FieldWrap label="Address" error={errors.address} touched={touched.address}
          hint="Optional — home or delivery address">
          <textarea value={form.address}
            onChange={e => handleChange('address', e.target.value)}
            onBlur={() => handleBlur('address')}
            className={`${fieldClass(errors.address, touched.address)} h-20 resize-none`}
            placeholder="Street, City, Country…" maxLength={250} />
          {form.address.trim() &&
            <p className="text-gray-400 text-xs mt-0.5 text-right">{form.address.trim().length}/250</p>}
        </FieldWrap>

        {/* Notes */}
        <FieldWrap label="Notes" error={errors.notes} touched={touched.notes}
          hint="Optional — allergies, preferences, etc.">
          <textarea value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
            onBlur={() => handleBlur('notes')}
            className={`${fieldClass(errors.notes, touched.notes)} h-16 resize-none`}
            placeholder="Any special notes…" maxLength={300} />
          {form.notes.trim() &&
            <p className={`text-xs mt-0.5 text-right ${form.notes.trim().length > 250 ? 'text-orange-500' : 'text-gray-400'}`}>
              {form.notes.trim().length}/300
            </p>}
        </FieldWrap>

        {/* Error summary */}
        {errorCount > 0 && Object.keys(touched).length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
            {errorCount} error{errorCount !== 1 ? 's' : ''} — please review the fields above.
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading
              ? <><i className="bi bi-arrow-clockwise animate-spin" /> Saving…</>
              : customer ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
