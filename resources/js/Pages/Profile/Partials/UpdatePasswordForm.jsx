import React from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UpdatePasswordForm({ className = '' }) {
  const passwordInput = useRef();
  const currentPasswordInput = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Calculate password strength
  useEffect(() => {
    if (!data.password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    // Length check
    if (data.password.length >= 8) strength += 1;
    // Contains number
    if (/\d/.test(data.password)) strength += 1;
    // Contains special character
    if (/[!@#$%^&*(),.?":{}|<>]/.test(data.password)) strength += 1;
    // Contains both uppercase and lowercase
    if (/(?=.*[a-z])(?=.*[A-Z])/.test(data.password)) strength += 1;

    setPasswordStrength(strength);
  }, [data.password]);

  const updatePassword = e => {
    e.preventDefault();
    setIsSubmitting(true);

    put(route('password.update'), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        toast.success('Password updated successfully!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      },
      onError: errors => {
        if (errors.password) {
          reset('password', 'password_confirmation');
          passwordInput.current.focus();
          toast.error('Please fix the password errors.');
        }

        if (errors.current_password) {
          reset('current_password');
          currentPasswordInput.current.focus();
          toast.error('Current password is incorrect.');
        }
      },
      onFinish: () => {
        setIsSubmitting(false);
      },
    });
  };

  return (
    <section className={className}>
      <header>
        <h2 className="text-lg font-medium text-gray-900">Update Password</h2>

        <p className="mt-1 text-sm text-gray-600">
          Ensure your account is using a long, random password to stay secure.
        </p>
      </header>

      <form onSubmit={updatePassword} className="mt-6 space-y-6">
        <div>
          <InputLabel htmlFor="current_password" value="Current Password" />

          <TextInput
            id="current_password"
            ref={currentPasswordInput}
            value={data.current_password}
            onChange={e => setData('current_password', e.target.value)}
            type="password"
            className="mt-1 block w-full"
            autoComplete="current-password"
          />

          <InputError message={errors.current_password} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="password" value="New Password" />

          <TextInput
            id="password"
            ref={passwordInput}
            value={data.password}
            onChange={e => setData('password', e.target.value)}
            type="password"
            className="mt-1 block w-full"
            autoComplete="new-password"
          />

          <InputError message={errors.password} className="mt-2" />
        </div>

        <div>
          <InputLabel htmlFor="password_confirmation" value="Confirm Password" />

          <TextInput
            id="password_confirmation"
            value={data.password_confirmation}
            onChange={e => setData('password_confirmation', e.target.value)}
            type="password"
            className="mt-1 block w-full"
            autoComplete="new-password"
          />

          <InputError message={errors.password_confirmation} className="mt-2" />
        </div>

        <div className="flex items-center gap-4">
          <PrimaryButton color="green" loading={processing}>
            Save
          </PrimaryButton>

          <Transition
            show={recentlySuccessful}
            enter="transition ease-in-out"
            enterFrom="opacity-0"
            leave="transition ease-in-out"
            leaveTo="opacity-0"
          >
            <p className="text-sm text-gray-600">Saved.</p>
          </Transition>
        </div>
      </form>
    </section>
  );
}
