import { useState, useEffect } from 'react';
import Modal from './Modal';
import { suppliers as api } from '../api';
import { toast } from 'react-toastify';

// ── Validation rules ──────────────────────────────────────────────────────────

function validateForm(data, existingId = null) {
  const errors = {};

  // Name — required, min 2, max 100, letters/spaces/hyphens only
  const name = data.name.trim();
  if (!name) {
    errors.name = 'Supplier name is required.';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.length > 100) {
    errors.name = 'Name cannot exceed 100 characters.';
  } else if (!/^[a-zA-Z0-9 &.,'\-()]+$/.test(name)) {
    errors.name = 'Name contains invalid characters.';
  }

  // Email — optional but must be valid if provided
  const email = data.email.trim();
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errors.email = 'Enter a valid email address (e.g. info@company.com).';
    } else if (email.length > 150) {
      errors.email = 'Email cannot exceed 150 characters.';
    }
  }

  // Phone — optional but must match valid formats if provided
  const phone = data.phone.trim();
  if (phone) {
    // Accept: +256700000000 / 0700000000 / +1-800-555-0100 / (256) 700 000 000
    if (!/^\+?[\d\s\-().]{7,20}$/.test(phone)) {
      errors.phone = 'Enter a valid phone number (7–20 digits, e.g. +256 700 000000).';
    }
  }

  // Address — optional, max 250 chars
  const address = data.address.trim();
  if (address && address.length > 250) {
    errors.address = 'Address cannot exceed 250 characters.';
  }

  // Contact person — optional, max 80 chars
  const contact = (data.contact_person ?? '').trim();
  if (contact && contact.length > 80) {
    errors.contact_person = 'Contact person name cannot exceed 80 characters.';
  }

  // Website — optional, must look like a URL
  const website = (data.website ?? '').trim();
  if (website) {
    if (!/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/.test(website)) {
      errors.website = 'Enter a valid website URL (e.g. https://example.com).';
    } else if (website.length > 200) {
      errors.website = 'Website URL cannot exceed 200 characters.';
    }
  }

  // Notes — optional, max 500 chars
  const notes = (data.notes ?? '').trim();
  if (notes && notes.length > 500) {
    errors.notes = `Notes cannot exceed 500 characters (${notes.length}/500).`;
  }

  return errors;
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({ label, required, error, touched, children, hint }) {
  const showError = error && touched;
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {showError ? (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <i className="bi bi-exclamation-circle-fill" /> {error}
        </p>
      ) : hint ? (
        <p className="text-gray-400 text-xs mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

function inputClass(error, touched) {
  const base = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors';
  if (error && touched) return `${base} border-red-400 bg-red-50 focus:ring-red-300`;
  if (!error && touched) return `${base} border-green-400 bg-green-50 focus:ring-green-300`;
  return `${base} border-gray-300 focus:ring-blue-500`;
}

// ── Main modal ────────────────────────────────────────────────────────────────

const EMPTY = {
  name: '', email: '', phone: '',
  address: '', contact_person: '', website: '', notes: '',
};

export default function SupplierModal({ isOpen, onClose, supplier, onSave }) {
  const [form, setForm]       = useState(EMPTY);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset when modal opens / supplier changes
  useEffect(() => {
    if (isOpen) {
      setForm(supplier ? {
        name:           supplier.name           ?? '',
        email:          supplier.email          ?? '',
        phone:          supplier.phone          ?? '',
        address:        supplier.address        ?? '',
        contact_person: supplier.contact_person ?? '',
        website:        supplier.website        ?? '',
        notes:          supplier.notes          ?? '',
      } : EMPTY);
      setErrors({});
      setTouched({});
    }
  }, [supplier, isOpen]);

  // Re-validate touched fields on every change
  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) {
      setErrors(validateForm(next));
    }
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validateForm(form));
  };

  // Mark all fields touched on submit attempt
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
      // Only send non-empty optional fields
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim()])
      );
      if (supplier) {
        await api.update(supplier.id, payload);
        toast.success('Supplier updated successfully.');
      } else {
        await api.create(payload);
        toast.success('Supplier added successfully.');
      }
      onSave();
      onClose();
    } catch (err) {
      if (err.response?.status === 422) {
        // Merge server validation errors
        const serverErrors = err.response.data.errors ?? {};
        const flat = Object.fromEntries(
          Object.entries(serverErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
        );
        setErrors(flat);
        setTouched(allTouched);
        toast.error('Please fix the validation errors.');
      } else {
        toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isValid  = Object.keys(validateForm(form)).length === 0;
  const isDirty  = JSON.stringify(form) !== JSON.stringify(EMPTY) ||
                   (supplier && Object.keys(form).some(k => form[k] !== (supplier[k] ?? '')));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Edit Supplier' : 'Add New Supplier'}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Name */}
        <Field label="Supplier Name" required error={errors.name} touched={touched.name}
          hint="Business or individual supplier name">
          <div className="relative">
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              className={inputClass(errors.name, touched.name)}
              placeholder="e.g. PharmaCorp Ltd"
              maxLength={100}
            />
            {touched.name && !errors.name && (
              <i className="bi bi-check-circle-fill text-green-500 absolute right-3 top-1/2 -translate-y-1/2 text-sm" />
            )}
          </div>
          {touched.name && form.name.trim() && (
            <p className="text-gray-400 text-xs mt-0.5 text-right">{form.name.trim().length}/100</p>
          )}
        </Field>

        {/* Email + Phone side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" error={errors.email} touched={touched.email}
            hint="Optional — business contact email">
            <div className="relative">
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={inputClass(errors.email, touched.email)}
                placeholder="info@company.com"
                maxLength={150}
              />
              {touched.email && form.email && !errors.email && (
                <i className="bi bi-check-circle-fill text-green-500 absolute right-3 top-1/2 -translate-y-1/2 text-sm" />
              )}
            </div>
          </Field>

          <Field label="Phone" error={errors.phone} touched={touched.phone}
            hint="Optional — include country code">
            <div className="relative">
              <input
                type="tel"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={inputClass(errors.phone, touched.phone)}
                placeholder="+256 700 000000"
                maxLength={20}
              />
              {touched.phone && form.phone && !errors.phone && (
                <i className="bi bi-check-circle-fill text-green-500 absolute right-3 top-1/2 -translate-y-1/2 text-sm" />
              )}
            </div>
          </Field>
        </div>

        {/* Contact person + Website */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact Person" error={errors.contact_person} touched={touched.contact_person}
            hint="Optional — primary contact name">
            <input
              type="text"
              value={form.contact_person}
              onChange={e => handleChange('contact_person', e.target.value)}
              onBlur={() => handleBlur('contact_person')}
              className={inputClass(errors.contact_person, touched.contact_person)}
              placeholder="e.g. John Ssempala"
              maxLength={80}
            />
          </Field>

          <Field label="Website" error={errors.website} touched={touched.website}
            hint="Optional — company website">
            <input
              type="text"
              value={form.website}
              onChange={e => handleChange('website', e.target.value)}
              onBlur={() => handleBlur('website')}
              className={inputClass(errors.website, touched.website)}
              placeholder="https://example.com"
              maxLength={200}
            />
          </Field>
        </div>

        {/* Address */}
        <Field label="Address" error={errors.address} touched={touched.address}
          hint="Optional — physical location">
          <textarea
            value={form.address}
            onChange={e => handleChange('address', e.target.value)}
            onBlur={() => handleBlur('address')}
            className={`${inputClass(errors.address, touched.address)} h-20 resize-none`}
            placeholder="Street, City, Country…"
            maxLength={250}
          />
          {form.address.trim() && (
            <p className="text-gray-400 text-xs mt-0.5 text-right">{form.address.trim().length}/250</p>
          )}
        </Field>

        {/* Notes */}
        <Field label="Notes" error={errors.notes} touched={touched.notes}
          hint="Optional — internal notes about this supplier">
          <textarea
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
            onBlur={() => handleBlur('notes')}
            className={`${inputClass(errors.notes, touched.notes)} h-16 resize-none`}
            placeholder="Payment terms, lead time, special conditions…"
            maxLength={500}
          />
          {form.notes.trim() && (
            <p className={`text-xs mt-0.5 text-right ${form.notes.trim().length > 450 ? 'text-orange-500' : 'text-gray-400'}`}>
              {form.notes.trim().length}/500
            </p>
          )}
        </Field>

        {/* Summary error bar */}
        {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
            <span>
              {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} — please review the fields above.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
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
            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2
              ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading
              ? <><i className="bi bi-arrow-clockwise animate-spin" /> Saving…</>
              : supplier ? 'Update Supplier' : 'Add Supplier'
            }
          </button>
        </div>
      </form>
    </Modal>
  );
}
