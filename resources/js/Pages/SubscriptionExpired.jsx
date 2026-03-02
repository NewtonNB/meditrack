import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function SubscriptionExpired() {
  return (
    <GuestLayout>
      <Head title="Subscription Expired" />

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <i className="bi bi-exclamation-triangle text-6xl text-red-600"></i>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Subscription Expired</h1>
            <p className="text-xl text-gray-600">
              Your subscription has expired. Please renew to continue using MediTrack.
            </p>
          </div>

          {/* Subscription Info */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              What happens next?
            </h2>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-x text-red-600 font-bold">1</i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Access Restricted</h3>
                  <p className="text-gray-600">
                    You can no longer access your pharmacy dashboard or data.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-clock text-yellow-600 font-bold">2</i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Data Preserved</h3>
                  <p className="text-gray-600">
                    Your data is safely stored and will be restored once you renew.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="bi bi-check text-green-600 font-bold">3</i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Easy Renewal</h3>
                  <p className="text-gray-600">
                    Renew your subscription in just a few clicks to restore full access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Plan</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter Plan */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">UGX 0</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Perfect for small pharmacies</p>
                </div>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">1 user</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">100 medicines</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">50 customers</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">Basic reports</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href={route('subscription.renew', { plan: 'starter' })}>
                    <PrimaryButton className="w-full">Choose Starter</PrimaryButton>
                  </Link>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="border-2 border-indigo-500 rounded-lg p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">UGX 35,000</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Ideal for growing pharmacies</p>
                </div>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">5 users</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">1,000 medicines</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">500 customers</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">Advanced reports</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">Priority support</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href={route('subscription.renew', { plan: 'pro' })}>
                    <PrimaryButton className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Choose Pro
                    </PrimaryButton>
                  </Link>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">UGX 90,000</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">For large pharmacies</p>
                </div>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">Unlimited users</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">Unlimited data</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">API access</span>
                  </li>
                  <li className="flex items-center">
                    <i className="bi bi-check text-green-600 mr-2"></i>
                    <span className="text-sm text-gray-600">24/7 support</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link href={route('subscription.renew', { plan: 'enterprise' })}>
                    <PrimaryButton className="w-full">Choose Enterprise</PrimaryButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Need help choosing a plan or have questions?</p>
            <div className="flex justify-center space-x-6">
              <a
                href="mailto:support@meditrack.com"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                <i className="bi bi-envelope mr-1"></i>
                Email Support
              </a>
              <a
                href="tel:+1234567890"
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                <i className="bi bi-phone mr-1"></i>
                Call Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
