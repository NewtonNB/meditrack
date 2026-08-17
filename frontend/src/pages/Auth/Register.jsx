import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { register as apiRegister } from '../../api/auth';

// ── Validation Rules ──────────────────────────────────────────────────────────

function validateForm(data) {
  const errors = {};

  // Name validation
  const name = (data.name || '').trim();
  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.length > 100) {
    errors.name = 'Name cannot exceed 100 characters.';
  } else if (!/^[A-Za-z0-9\s.\-']+$/.test(name)) {
    errors.name = 'Name contains invalid characters.';
  }

  // Email validation
  const email = (data.email || '').trim();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Enter a valid email address (e.g. you@example.com).';
  } else if (email.length > 255) {
    errors.email = 'Email cannot exceed 255 characters.';
  }

  // Password validation
  const password = data.password || '';
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  // Confirm Password validation
  const confirm = data.password_confirmation || '';
  if (!confirm) {
    errors.password_confirmation = 'Confirm password is required.';
  } else if (confirm !== password) {
    errors.password_confirmation = 'Passwords do not match.';
  }

  return errors;
}

// ── Input Styling Helper ──────────────────────────────────────────────────────

function inputClass(error, touched) {
  const base = 'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors';
  if (error && touched) return `${base} border-red-400 bg-red-50 focus:ring-red-300`;
  if (!error && touched) return `${base} border-green-400 bg-green-50 focus:ring-green-300`;
  return `${base} border-gray-300 focus:ring-blue-500`;
}

// ── Field Layout Component ────────────────────────────────────────────────────

function Field({ label, required, error, touched, children }) {
  const showError = error && touched;
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {showError && (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <i className="bi bi-exclamation-circle-fill" /> {error}
        </p>
      )}
    </div>
  );
}

// ── Main Register Page ────────────────────────────────────────────────────────

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    
    if (touched[name]) {
      setErrors(validateForm(next));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const nextTouched = { ...touched, [name]: true };
    setTouched(nextTouched);
    setErrors(validateForm(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Touch all fields
    const allTouched = {
      name: true,
      email: true,
      password: true,
      password_confirmation: true,
    };
    setTouched(allTouched);

    const errs = validateForm(form);
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors before creating your account.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiRegister(form);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      toast.success('Account created successfully!');
      
      // Auto login redirects to dashboard
      // login context update
      window.location.reload(); // Reload or Navigate directly
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 422) {
        const serverErrors = err.response.data.errors || {};
        const flat = Object.fromEntries(
          Object.entries(serverErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
        );
        setErrors(flat);
        setTouched(allTouched);
        toast.error('Registration failed. Please check validation errors.');
      } else {
        toast.error(err.response?.data?.message || 'Registration failed. Please check network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3">
            <i className="bi bi-heart-pulse text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join MediTrack today</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          
          {/* Full Name */}
          <Field label="Full Name" required error={errors.name} touched={touched.name}>
            <div className="relative">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(errors.name, touched.name)}
                placeholder="John Doe"
                maxLength={100}
                disabled={loading}
              />
              {touched.name && !errors.name && (
                <i className="bi bi-check-circle-fill text-green-500 absolute right-4 top-1/2 -translate-y-1/2 text-sm" />
              )}
            </div>
          </Field>

          {/* Email Address */}
          <Field label="Email" required error={errors.email} touched={touched.email}>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(errors.email, touched.email)}
                placeholder="you@example.com"
                maxLength={255}
                disabled={loading}
              />
              {touched.email && !errors.email && (
                <i className="bi bi-check-circle-fill text-green-500 absolute right-4 top-1/2 -translate-y-1/2 text-sm" />
              )}
            </div>
          </Field>

          {/* Password */}
          <Field label="Password" required error={errors.password} touched={touched.password}>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(errors.password, touched.password)}
                placeholder="••••••••"
                disabled={loading}
              />
              {touched.password && !errors.password && (
                <i className="bi bi-check-circle-fill text-green-500 absolute right-4 top-1/2 -translate-y-1/2 text-sm" />
              )}
            </div>
          </Field>

          {/* Password Confirmation */}
          <Field label="Confirm Password" required error={errors.password_confirmation} touched={touched.password_confirmation}>
            <div className="relative">
              <input
                type="password"
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass(errors.password_confirmation, touched.password_confirmation)}
                placeholder="••••••••"
                disabled={loading}
              />
              {touched.password_confirmation && !errors.password_confirmation && (
                <i className="bi bi-check-circle-fill text-green-500 absolute right-4 top-1/2 -translate-y-1/2 text-sm" />
              )}
            </div>
          </Field>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <i className="bi bi-arrow-clockwise animate-spin" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
