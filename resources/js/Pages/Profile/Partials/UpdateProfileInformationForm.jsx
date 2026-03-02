import React from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
  const user = usePage().props.auth.user;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
    name: user.name,
    email: user.email,
  });

  const submit = e => {
    e.preventDefault();
    setIsSubmitting(true);

    patch(route('profile.update'), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      },
      onError: () => {
        toast.error('Failed to update profile. Please try again.');
      },
      onFinish: () => {
        setIsSubmitting(false);
      },
    });
  };

  // Clear success message when form is edited
  useEffect(() => {
    if (showSuccess && (data.name !== user.name || data.email !== user.email)) {
      setShowSuccess(false);
    }
  }, [data.name, data.email, user, showSuccess]);

  return (
    <section className={className}>
      <header>
        <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
        <p className="mt-1 text-sm text-gray-600">
          Update your account's profile information and email address.
        </p>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div>
          <InputLabel htmlFor="name" value="Name" className="font-medium text-gray-700" />
          <div className="mt-1 relative">
            <TextInput
              id="name"
              className={`w-full ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              required
              isFocused
              autoComplete="name"
              disabled={isSubmitting}
            />
          </div>
          <InputError className="mt-2" message={errors.name} />
        </div>

        <div>
          <InputLabel htmlFor="email" value="Email" className="font-medium text-gray-700" />
          <div className="mt-1 relative">
            <TextInput
              id="email"
              type="email"
              className={`w-full ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
              value={data.email}
              onChange={e => setData('email', e.target.value)}
              required
              autoComplete="username"
              disabled={isSubmitting}
            />
          </div>
          <InputError className="mt-2" message={errors.email} />
        </div>

        {mustVerifyEmail && user.email_verified_at === null && (
          <div>
            <p className="mt-2 text-sm text-gray-800">
              Your email address is unverified.
              <Link
                href={route('verification.send')}
                method="post"
                as="button"
                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Click here to re-send the verification email.
              </Link>
            </p>

            {status === 'verification-link-sent' && (
              <div className="mt-2 text-sm font-medium text-green-600">
                A new verification link has been sent to your email address.
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2">
          <PrimaryButton
            type="submit"
            color="green"
            loading={processing || isSubmitting}
            className="min-w-[100px] justify-center"
          >
            Save
          </PrimaryButton>

          <Transition
            show={recentlySuccessful || showSuccess}
            enter="transition ease-in-out duration-300"
            enterFrom="opacity-0 -translate-x-2"
            enterTo="opacity-100 translate-x-0"
            leave="transition ease-in-out duration-300"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 -translate-x-2"
          >
            <div className="flex items-center text-sm text-green-600">
              <svg className="h-5 w-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Saved successfully!
            </div>
          </Transition>
        </div>
      </form>
    </section>
  );
}
