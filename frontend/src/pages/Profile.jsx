import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { profile as api } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
  { value: 'Australia/Perth', label: 'Australia/Perth (AWST)' },
];

const validateEmail = (value) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);

const validateUgandaPhone = (value) => {
  if (!value?.trim()) return true;
  const raw = value.replace(/\D/g, '');
  return /^0\d{9}$/.test(raw) || /^256\d{9}$/.test(raw);
};

const normalizeUgandaPhone = (value) => {
  const raw = value.replace(/\D/g, '');
  if (/^0\d{9}$/.test(raw)) {
    return `+256${raw.slice(1)}`;
  }
  if (/^256\d{9}$/.test(raw)) {
    return `+${raw}`;
  }
  return value.trim();
};

export default function Profile() {
  const { user, updateAuthUser } = useAuth();
  const { data, loading, error, refetch } = useApi(() => api.get());
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    timezone: '',
    language: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = ['Full name is required.'];
    }

    if (!form.email.trim()) {
      nextErrors.email = ['Email address is required.'];
    } else if (!validateEmail(form.email.trim())) {
      nextErrors.email = ['Enter a valid email address.'];
    }

    if (form.phone && !validateUgandaPhone(form.phone)) {
      nextErrors.phone = ['Enter a Uganda phone number in +256XXXXXXXXX or 0XXXXXXXXX format.'];
    }

    if (form.phone && form.phone.length > 50) {
      nextErrors.phone = ['Phone number must be 50 characters or less.'];
    }

    if (form.bio && form.bio.length > 300) {
      nextErrors.bio = ['Bio must be 300 characters or less.'];
    }

    if (form.timezone && form.timezone.length > 50) {
      nextErrors.timezone = ['Timezone must be 50 characters or less.'];
    }

    if (form.language && form.language.length > 10) {
      nextErrors.language = ['Language must be 10 characters or less.'];
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      const payload = { ...form, phone: normalizeUgandaPhone(form.phone) };
      const response = await api.update(payload);
      const updatedUser = response.data?.user;

      toast.success('Profile updated successfully.');
      if (updatedUser) {
        updateAuthUser(updatedUser);
      }
      refetch();
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
      } else {
        toast.error(err.response?.data?.message || 'Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!loading && data) {
      const u = data?.user ?? data ?? {};
      setForm({
        name: u.name || user?.name || '',
        email: u.email || user?.email || '',
        phone: u.phone || '',
        bio: u.bio || '',
        timezone: u.timezone || '',
        language: u.language || '',
      });
    }
  }, [data, loading, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading profile…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const u = data?.user ?? data ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Your account</p>
          <h1 className="text-3xl font-semibold text-slate-900">Profile settings</h1>
          <p className="mt-2 text-sm text-slate-500 max-w-2xl">
            Update your personal details, contact information, and preferences. These changes will sync with your account immediately.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-3xl font-bold text-white">
              {(u.name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{u.name ?? user?.name}</p>
              <p className="text-sm text-slate-500 capitalize">{u.role ?? user?.role}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'name', label: 'Full name', placeholder: 'Jane Doe' },
              { name: 'email', label: 'Email address', placeholder: 'you@example.com', type: 'email' },
              { name: 'phone', label: 'Phone number (Uganda)', placeholder: '0 701 234567 or +256 701 234567' },
              { name: 'language', label: 'Language', placeholder: 'en' },
            ].map(({ name, label, placeholder, type = 'text' }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  value={form[name] ?? ''}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors[name] ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200'}`}
                />
                {name === 'phone' && !errors.phone && (
                  <p className="mt-2 text-xs text-slate-500">Accepts +256XXXXXXXXX or 0XXXXXXXXX (Uganda format).</p>
                )}
                {errors[name] && <p className="mt-2 text-xs text-red-600">{errors[name][0]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
              <select
                name="timezone"
                value={form.timezone ?? ''}
                onChange={handleChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.timezone ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200'}`}
              >
                <option value="">Select timezone</option>
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.timezone && <p className="mt-2 text-xs text-red-600">{errors.timezone[0]}</p>}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
            <textarea
              name="bio"
              value={form.bio ?? ''}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us a little bit about yourself"
              className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.bio ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-200'}`}
            />
            {errors.bio && <p className="mt-2 text-xs text-red-600">{errors.bio[0]}</p>}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Need more help?</p>
              <p className="text-sm text-slate-500">Contact support if you want help updating your profile.</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Profile summary</h2>
          <p className="mt-3 text-sm text-slate-600">Use this panel to keep your account details accurate. Updated profile data is used across the app.</p>

          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-medium text-slate-900">Your role</p>
              <p className="mt-1 text-slate-500 capitalize">{u.role ?? user?.role ?? 'N/A'}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-medium text-slate-900">Email</p>
              <p className="mt-1 text-slate-500">{form.email || 'Not provided'}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-medium text-slate-900">Timezone</p>
              <p className="mt-1 text-slate-500">{form.timezone || 'UTC'}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-medium text-slate-900">Language</p>
              <p className="mt-1 text-slate-500">{form.language || 'en'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
