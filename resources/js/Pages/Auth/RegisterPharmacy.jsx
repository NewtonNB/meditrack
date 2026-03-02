import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function RegisterPharmacy({ subscriptionPlans }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    // Pharmacy Information
    pharmacy_name: '',
    pharmacy_email: '',
    pharmacy_phone: '',
    pharmacy_address: '',
    license_number: '',

    // Admin User Information
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirmation: '',

    // Subscription
    subscription_plan: 'free',
    trial_days: 7,

    // Terms
    terms_accepted: false,
    marketing_emails: false,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const submit = e => {
    e.preventDefault();
    post(route('pharmacy.register'), {
      onSuccess: () => {
        // Redirect to success page or login
      },
    });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = step => {
    switch (step) {
      case 1:
        return data.pharmacy_name && data.pharmacy_email && data.license_number;
      case 2:
        return (
          data.admin_name &&
          data.admin_email &&
          data.admin_password &&
          data.admin_password_confirmation
        );
      case 3:
        return data.terms_accepted;
      default:
        return false;
    }
  };

  return (
    <GuestLayout>
      <Head title="Register Your Pharmacy" />

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Start Your Pharmacy Management Journey
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your own pharmacy management system in minutes. Start with a free trial and scale
              as you grow.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Pharmacy Info</span>
              <span>Admin Account</span>
              <span>Review & Submit</span>
            </div>
          </div>

          <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl p-8">
            {/* Step 1: Pharmacy Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Tell us about your pharmacy</h2>
                  <p className="text-gray-600">
                    We'll use this information to set up your workspace
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <InputLabel htmlFor="pharmacy_name" value="Pharmacy Name *" />
                    <TextInput
                      id="pharmacy_name"
                      type="text"
                      value={data.pharmacy_name}
                      className="mt-1 block w-full"
                      onChange={e => setData('pharmacy_name', e.target.value)}
                      placeholder="e.g., City Pharmacy"
                    />
                    <InputError message={errors.pharmacy_name} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="pharmacy_email" value="Pharmacy Email *" />
                    <TextInput
                      id="pharmacy_email"
                      type="email"
                      value={data.pharmacy_email}
                      className="mt-1 block w-full"
                      onChange={e => setData('pharmacy_email', e.target.value)}
                      placeholder="pharmacy@example.com"
                    />
                    <InputError message={errors.pharmacy_email} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="pharmacy_phone" value="Phone Number" />
                    <TextInput
                      id="pharmacy_phone"
                      type="tel"
                      value={data.pharmacy_phone}
                      className="mt-1 block w-full"
                      onChange={e => setData('pharmacy_phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                    <InputError message={errors.pharmacy_phone} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="license_number" value="License Number *" />
                    <TextInput
                      id="license_number"
                      type="text"
                      value={data.license_number}
                      className="mt-1 block w-full"
                      onChange={e => setData('license_number', e.target.value)}
                      placeholder="PH123456"
                    />
                    <InputError message={errors.license_number} className="mt-2" />
                  </div>
                </div>

                <div>
                  <InputLabel htmlFor="pharmacy_address" value="Address" />
                  <textarea
                    id="pharmacy_address"
                    value={data.pharmacy_address}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    onChange={e => setData('pharmacy_address', e.target.value)}
                    rows={3}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                  <InputError message={errors.pharmacy_address} className="mt-2" />
                </div>
              </div>
            )}

            {/* Step 2: Admin Account */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create your admin account</h2>
                  <p className="text-gray-600">
                    This will be your main account to manage the pharmacy
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <InputLabel htmlFor="admin_name" value="Full Name *" />
                    <TextInput
                      id="admin_name"
                      type="text"
                      value={data.admin_name}
                      className="mt-1 block w-full"
                      onChange={e => setData('admin_name', e.target.value)}
                      placeholder="John Doe"
                    />
                    <InputError message={errors.admin_name} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="admin_email" value="Email Address *" />
                    <TextInput
                      id="admin_email"
                      type="email"
                      value={data.admin_email}
                      className="mt-1 block w-full"
                      onChange={e => setData('admin_email', e.target.value)}
                      placeholder="admin@pharmacy.com"
                    />
                    <InputError message={errors.admin_email} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="admin_password" value="Password *" />
                    <TextInput
                      id="admin_password"
                      type="password"
                      value={data.admin_password}
                      className="mt-1 block w-full"
                      onChange={e => setData('admin_password', e.target.value)}
                      placeholder="Choose a strong password"
                    />
                    <InputError message={errors.admin_password} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="admin_password_confirmation" value="Confirm Password *" />
                    <TextInput
                      id="admin_password_confirmation"
                      type="password"
                      value={data.admin_password_confirmation}
                      className="mt-1 block w-full"
                      onChange={e => setData('admin_password_confirmation', e.target.value)}
                      placeholder="Confirm your password"
                    />
                    <InputError message={errors.admin_password_confirmation} className="mt-2" />
                  </div>
                </div>

                {/* Subscription Plan Selection */}
                <div>
                  <InputLabel value="Choose Your Plan" />
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subscriptionPlans.map(plan => (
                      <div
                        key={plan.slug}
                        className={`relative border rounded-lg p-4 cursor-pointer ${
                          data.subscription_plan === plan.slug
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300'
                        }`}
                        onClick={() => setData('subscription_plan', plan.slug)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                            <p className="text-2xl font-bold text-indigo-600">
                              UGX {plan.monthly_price?.toLocaleString()}/month
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                          </div>
                          {data.subscription_plan === plan.slug && (
                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                              <i className="bi bi-check text-white text-sm"></i>
                            </div>
                          )}
                        </div>
                        {plan.slug === 'free' && (
                          <div className="mt-2 text-sm text-green-600 font-medium">
                            🎉 7-day free trial included!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Review your information</h2>
                  <p className="text-gray-600">Please review everything before submitting</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Pharmacy Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {data.pharmacy_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {data.pharmacy_email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>{' '}
                        {data.pharmacy_phone || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-medium">License:</span> {data.license_number}
                      </div>
                      <div>
                        <span className="font-medium">Address:</span>{' '}
                        {data.pharmacy_address || 'Not provided'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Account</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {data.admin_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {data.admin_email}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Plan:</span> {data.subscription_plan}
                      </div>
                      <div>
                        <span className="font-medium">Trial:</span> {data.trial_days} days free
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <Checkbox
                      name="terms_accepted"
                      checked={data.terms_accepted}
                      onChange={e => setData('terms_accepted', e.target.checked)}
                    />
                    <div className="ml-2">
                      <label className="text-sm text-gray-600">
                        I agree to the{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">
                          Privacy Policy
                        </a>
                      </label>
                      <InputError message={errors.terms_accepted} className="mt-2" />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Checkbox
                      name="marketing_emails"
                      checked={data.marketing_emails}
                      onChange={e => setData('marketing_emails', e.target.checked)}
                    />
                    <div className="ml-2">
                      <label className="text-sm text-gray-600">
                        Send me updates and tips about pharmacy management
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
              </div>
              <div>
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <PrimaryButton disabled={processing || !isStepValid(3)}>
                    Create My Pharmacy
                  </PrimaryButton>
                )}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Already have an account?{' '}
              <a
                href={route('login')}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
