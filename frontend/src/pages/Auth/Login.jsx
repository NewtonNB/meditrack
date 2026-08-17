import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

// ── Validation ────────────────────────────────────────────────────────────────

function validateForm(data) {
  const errors = {};
  const email = (data.email || '').trim();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!data.password) {
    errors.password = 'Password is required.';
  }
  return errors;
}

// ── Field ─────────────────────────────────────────────────────────────────────

function inputClass(error, touched) {
  const base = [
    'w-full rounded-xl px-4 py-3 text-sm',
    'bg-white/20 backdrop-blur-sm',
    'border placeholder-white/60 text-white',
    'focus:outline-none focus:ring-2 transition-all',
  ].join(' ');
  if (error && touched)  return `${base} border-red-400/70   focus:ring-red-400/50`;
  if (!error && touched) return `${base} border-green-400/70 focus:ring-green-400/50`;
  return `${base} border-white/30 focus:ring-white/40 focus:border-white/60`;
}

// ── Login Page ────────────────────────────────────────────────────────────────

// The most suitable background for a pharmacy system:
// medical-doctor-girl-working-with-microscope — clinical, professional, healthcare-relevant
const BG_IMAGE = '/images/login-bg-2.jpg';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    if (touched[name]) setErrors(validateForm(next));
  };

  const handleBlur = (e) => {
    setTouched(t => ({ ...t, [e.target.name]: true }));
    setErrors(validateForm(form));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = { email: true, password: true };
    setTouched(allTouched);
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the errors before logging in.');
      return;
    }
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 422) {
        const flat = Object.fromEntries(
          Object.entries(err.response.data.errors ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
        );
        setErrors(flat);
        setTouched(allTouched);
        toast.error('Invalid credentials. Please try again.');
      } else {
        toast.error(err.response?.data?.message || 'Login failed. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Full-screen background image */
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1e3a5f', // fallback if image hasn't loaded
      }}
    >
      {/* Dark overlay so text is readable */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md">
        <div
          className="rounded-3xl p-8 shadow-2xl border border-white/20"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ background: 'rgba(59,130,246,0.85)' }}>
              <i className="bi bi-heart-pulse text-white text-3xl" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">MediTrack</h1>
            <p className="text-white/70 text-sm mt-1">Pharmacy Management System</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <i className="bi bi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass(errors.email, touched.email)} pl-10`}
                  placeholder="you@example.com"
                  maxLength={255}
                  disabled={loading}
                  autoComplete="email"
                />
                {touched.email && !errors.email && form.email && (
                  <i className="bi bi-check-circle-fill text-green-400 absolute right-3.5 top-1/2 -translate-y-1/2 text-sm" />
                )}
              </div>
              {errors.email && touched.email && (
                <p className="flex items-center gap-1 text-red-300 text-xs mt-1.5">
                  <i className="bi bi-exclamation-circle-fill" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <i className="bi bi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm" />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass(errors.password, touched.password)} pl-10 pr-10`}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                  tabIndex={-1}
                >
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'} text-sm`} />
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="flex items-center gap-1 text-red-300 text-xs mt-1.5">
                  <i className="bi bi-exclamation-circle-fill" /> {errors.password}
                </p>
              )}
            </div>

            {/* Forgot password link */}
            <div className="flex justify-end -mt-2">
              <Link to="/forgot-password" className="text-xs text-white/60 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: loading ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.9)' }}
            >
              {loading ? (
                <><i className="bi bi-arrow-clockwise animate-spin" /> Signing in…</>
              ) : (
                <><i className="bi bi-box-arrow-in-right" /> Sign in</>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-white/60 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-white font-medium hover:underline">
              Register
            </Link>
          </p>

          {/* Branding footer */}
          <p className="text-center text-white/30 text-xs mt-4">
            © {new Date().getFullYear()} MediTrack · Pharmacy Management
          </p>
        </div>
      </div>
    </div>
  );
}
