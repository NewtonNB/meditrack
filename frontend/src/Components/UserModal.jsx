import { useState, useEffect } from 'react';
import Modal from './Modal';
import { users as api } from '../api';
import { toast } from 'react-toastify';

const ROLES = [
  { value: 'pharmacy_admin', label: 'Admin' },
  { value: 'pharmacist',     label: 'Pharmacist' },
  { value: 'cashier',        label: 'Cashier' },
];

// ── Validation ────────────────────────────────────────────────────────────────

function validateForm(data, isEdit) {
  const errors = {};

  const name = data.name.trim();
  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.length > 100) {
    errors.name = 'Name cannot exceed 100 characters.';
  }

  const email = data.email.trim();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  } else if (email.length > 150) {
    errors.email = 'Email cannot exceed 150 characters.';
  }

  if (!data.role) {
    errors.role = 'Please select a role.';
  }

  const pw  = data.password;
  const pwc = data.password_confirmation;

  if (!isEdit && !pw) {
    errors.password = 'Password is required for new users.';
  } else if (pw) {
    if (pw.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Za-z]/.test(pw)) {
      errors.password = 'Password must contain at least one letter.';
    } else if (!/[0-9]/.test(pw)) {
      errors.password = 'Password must contain at least one number.';
    }
  }

  if (pw && pw !== pwc) {
    errors.password_confirmation = 'Passwords do not match.';
  } else if (!isEdit && !pw && pwc) {
    errors.password_confirmation = 'Please enter the password first.';
  }

  return errors;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fieldClass(error, touched) {
  const base = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors';
  if (error && touched)  return `${base} border-red-400 bg-red-50 focus:ring-red-300`;
  if (!error && touched) return `${base} border-green-400 bg-green-50 focus:ring-green-300`;
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

// ── Password strength meter ───────────────────────────────────────────────────

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8)              score++;
  if (/[A-Z]/.test(password))            score++;
  if (/[0-9]/.test(password))            score++;
  if (/[^A-Za-z0-9]/.test(password))     score++;

  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const textColors = ['text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600'];

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score - 1] ?? 'text-gray-400'}`}>
        {score > 0 ? labels[score - 1] : ''}
        {score < 4 && password && <span className="text-gray-400 font-normal"> — add {!(/[A-Z]/.test(password)) ? 'uppercase' : !(/[^A-Za-z0-9]/.test(password)) ? 'symbols' : 'more length'} to strengthen</span>}
      </p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const EMPTY = { name: '', email: '', role: 'pharmacist', password: '', password_confirmation: '' };

export default function UserModal({ isOpen, onClose, user, onSave }) {
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const isEdit = !!user;

  useEffect(() => {
    if (isOpen) {
      setForm(user ? {
        name:                  user.name  ?? '',
        email:                 user.email ?? '',
        role:                  user.role  ?? 'pharmacist',
        password:              '',
        password_confirmation: '',
      } : EMPTY);
      setErrors({});
      setTouched({});
      setShowPw(false);
    }
  }, [user, isOpen]);

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (touched[field]) setErrors(validateForm(next, isEdit));
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validateForm(form, isEdit));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(EMPTY).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validateForm(form, isEdit);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    setLoading(true);
    try {
      let payload = { name: form.name.trim(), email: form.email.trim(), role: form.role };
      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }
      if (isEdit) {
        await api.update(user.id, payload);
        toast.success('User updated successfully.');
      } else {
        await api.create(payload);
        toast.success('User created successfully.');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit User' : 'Add New User'}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Name */}
        <FieldWrap label="Full Name" required error={errors.name} touched={touched.name}>
          <div className="relative">
            <input type="text" value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              className={fieldClass(errors.name, touched.name)}
              placeholder="e.g. John Ssempala" maxLength={100} />
            {touched.name && !errors.name && form.name.trim() &&
              <i className="bi bi-check-circle-fill text-green-500 absolute right-3 top-1/2 -translate-y-1/2 text-sm" />}
          </div>
        </FieldWrap>

        {/* Email */}
        <FieldWrap label="Email" required error={errors.email} touched={touched.email}>
          <div className="relative">
            <input type="email" value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={fieldClass(errors.email, touched.email)}
              placeholder="john@meditrack.com" maxLength={150} />
            {touched.email && !errors.email && form.email.trim() &&
              <i className="bi bi-check-circle-fill text-green-500 absolute right-3 top-1/2 -translate-y-1/2 text-sm" />}
          </div>
        </FieldWrap>

        {/* Role */}
        <FieldWrap label="Role" required error={errors.role} touched={touched.role}>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => (
              <button key={r.value} type="button"
                onClick={() => handleChange('role', r.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  form.role === r.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </FieldWrap>

        {/* Password */}
        <FieldWrap
          label={isEdit ? 'New Password' : 'Password'}
          required={!isEdit ? true : false}
          error={errors.password}
          touched={touched.password}
          hint={isEdit ? 'Leave blank to keep current password.' : 'Min 8 characters with letters and numbers.'}>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              className={`${fieldClass(errors.password, touched.password)} pr-10`}
              placeholder={isEdit ? 'Leave blank to keep current' : 'Min 8 characters'} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'} text-sm`} />
            </button>
          </div>
          {form.password && <PasswordStrength password={form.password} />}
        </FieldWrap>

        {/* Confirm Password */}
        {(form.password || !isEdit) && (
          <FieldWrap label="Confirm Password" required={!isEdit} error={errors.password_confirmation} touched={touched.password_confirmation}>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password_confirmation}
                onChange={e => handleChange('password_confirmation', e.target.value)}
                onBlur={() => handleBlur('password_confirmation')}
                className={fieldClass(errors.password_confirmation, touched.password_confirmation)}
                placeholder="Repeat password" />
              {touched.password_confirmation && !errors.password_confirmation && form.password_confirmation &&
                <i className="bi bi-check-circle-fill text-green-500 absolute right-3 top-1/2 -translate-y-1/2 text-sm" />}
            </div>
          </FieldWrap>
        )}

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
              : isEdit ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
