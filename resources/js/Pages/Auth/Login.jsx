import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = e => {
    e.preventDefault();

    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <GuestLayout>
      <Head title="Log in" />

      {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

      {/* Quick Login Options */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
          🔑 Quick Login
        </h3>
        
        {/* Compact Grid Layout */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => {
              setData('email', 'admin@mediTrack.com');
              setData('password', 'password');
            }}
            className="p-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-medium transition-colors border border-red-200"
          >
            <div className="font-semibold">Super Admin</div>
            <div className="text-xs opacity-75">admin@mediTrack.com</div>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setData('email', 'tukamuhebwanewton@gmail.com');
              setData('password', 'password');
            }}
            className="p-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-xs font-medium transition-colors border border-green-200"
          >
            <div className="font-semibold">Pharmacy Admin</div>
            <div className="text-xs opacity-75">tukamuhebwa...</div>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setData('email', 'pharmacist@demo.com');
              setData('password', 'password');
            }}
            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-xs font-medium transition-colors border border-blue-200"
          >
            <div className="font-semibold">Pharmacist</div>
            <div className="text-xs opacity-75">pharmacist@demo.com</div>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setData('email', 'cashier@demo.com');
              setData('password', 'password');
            }}
            className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-xs font-medium transition-colors border border-yellow-200"
          >
            <div className="font-semibold">Cashier</div>
            <div className="text-xs opacity-75">cashier@demo.com</div>
          </button>
        </div>
        
        <p className="text-xs text-blue-600 text-center">
          💡 Click any role above to auto-fill • Password: <code className="bg-white px-1 rounded font-mono">password</code>
        </p>
      </div>

      <form onSubmit={submit}>
        <div>
          <InputLabel htmlFor="email" value="Email" />

          <TextInput
            id="email"
            type="email"
            name="email"
            value={data.email}
            className="mt-1 block w-full"
            autoComplete="username"
            isFocused={true}
            onChange={e => setData('email', e.target.value)}
          />

          <InputError message={errors.email} className="mt-2" />
        </div>

        <div className="mt-4">
          <InputLabel htmlFor="password" value="Password" />

          <TextInput
            id="password"
            type="password"
            name="password"
            value={data.password}
            className="mt-1 block w-full"
            autoComplete="current-password"
            onChange={e => setData('password', e.target.value)}
          />

          <InputError message={errors.password} className="mt-2" />
        </div>

        <div className="mt-4 block">
          <label className="flex items-center">
            <Checkbox
              name="remember"
              checked={data.remember}
              onChange={e => setData('remember', e.target.checked)}
            />
            <span className="ms-2 text-sm text-gray-600">Remember me</span>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end">
          {canResetPassword && (
            <Link
              href={route('password.request')}
              className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Forgot your password?
            </Link>
          )}

          <PrimaryButton className="ms-4" disabled={processing}>
            Log in
          </PrimaryButton>
        </div>
      </form>
    </GuestLayout>
  );
}
