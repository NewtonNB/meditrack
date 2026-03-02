import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function PharmacyRegistrationSuccess({ pharmacy }) {
  return (
    <GuestLayout>
      <Head title="Registration Successful" />

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <i className="bi bi-check-circle text-6xl text-green-600"></i>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to MediTrack! 🎉</h1>
            <p className="text-xl text-gray-600">
              Your pharmacy has been successfully registered and is ready to use.
            </p>
          </div>

          {/* Pharmacy Info Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Your Pharmacy Details
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Pharmacy Name:</span>
                <span className="text-gray-900">{pharmacy.name}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Email:</span>
                <span className="text-gray-900">{pharmacy.email}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">License Number:</span>
                <span className="text-gray-900">{pharmacy.license_number}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="font-medium text-gray-700">Subscription Plan:</span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    pharmacy.subscription_plan === 'enterprise'
                      ? 'bg-purple-100 text-purple-800'
                      : pharmacy.subscription_plan === 'pro'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {pharmacy.subscription_plan.toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="font-medium text-gray-700">Status:</span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What's Next?</h2>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Login to Your Dashboard</h3>
                  <p className="text-gray-600">
                    Use your admin credentials to access your pharmacy management system.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Explore Your Workspace</h3>
                  <p className="text-gray-600">
                    We've created sample data for you to get started - medicines, customers, and
                    suppliers.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Customize Settings</h3>
                  <p className="text-gray-600">
                    Update your pharmacy information, add your team members, and configure
                    preferences.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Start Managing</h3>
                  <p className="text-gray-600">
                    Begin adding your real medicines, customers, and start processing sales!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trial Information */}
          {pharmacy.subscription_plan === 'free' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <i className="bi bi-gift text-2xl text-yellow-600"></i>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-yellow-800">Free Trial Active</h3>
                  <p className="text-yellow-700 mt-1">
                    You're currently on a free trial. Your trial expires on{' '}
                    <strong>
                      {new Date(pharmacy.subscription_expires_at).toLocaleDateString()}
                    </strong>
                    . Upgrade to a paid plan anytime to continue using all features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <Link href={route('login')}>
              <PrimaryButton size="lg" className="w-full sm:w-auto">
                <i className="bi bi-box-arrow-in-right mr-2"></i>
                Login to Your Dashboard
              </PrimaryButton>
            </Link>

            <div className="text-sm text-gray-600">
              <p>Need help getting started?</p>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Check out our setup guide
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500">
            <p>Welcome to the MediTrack family! We're excited to help you manage your pharmacy.</p>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
}
