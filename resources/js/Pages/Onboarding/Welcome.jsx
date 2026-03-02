import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useState } from 'react';

export default function OnboardingWelcome({ pharmacy }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to MediTrack!',
      description: "Let's get your pharmacy set up in just a few minutes.",
      icon: 'bi-house-door',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Add Your Medicines',
      description: 'Start by adding your inventory. You can import from Excel or add manually.',
      icon: 'bi-capsule',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Set Up Customers',
      description: 'Add your regular customers to track their purchase history.',
      icon: 'bi-people',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Configure Settings',
      description: 'Customize your pharmacy settings, currency, and preferences.',
      icon: 'bi-gear',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: "You're All Set!",
      description: 'Your pharmacy is ready to go. Start managing your business efficiently.',
      icon: 'bi-check-circle',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  const quickActions = [
    {
      title: 'Add Medicine',
      description: 'Add your first medicine to the inventory',
      href: '/medicines/create',
      icon: 'bi-plus-circle',
      color: 'bg-green-600',
    },
    {
      title: 'Add Customer',
      description: 'Register your first customer',
      href: '/customers/create',
      icon: 'bi-person-plus',
      color: 'bg-blue-600',
    },
    {
      title: 'Add Supplier',
      description: 'Set up your medicine supplier',
      href: '/suppliers/create',
      icon: 'bi-truck',
      color: 'bg-purple-600',
    },
    {
      title: 'View Dashboard',
      description: 'See your pharmacy overview',
      href: '/dashboard',
      icon: 'bi-graph-up',
      color: 'bg-indigo-600',
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    // Mark onboarding as completed
    // You can implement this with an API call
    window.location.href = '/dashboard';
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">Welcome to MediTrack</h2>
      }
    >
      <Head title="Welcome to MediTrack" />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to {pharmacy?.name}! 🎉
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let's get your pharmacy management system set up and running in just a few minutes.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((_, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= index
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        currentStep > index ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center">
              <div
                className={`w-20 h-20 ${steps[currentStep].bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                <i
                  className={`${steps[currentStep].icon} text-4xl ${steps[currentStep].color}`}
                ></i>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{steps[currentStep].title}</h2>
              <p className="text-xl text-gray-600 mb-8">{steps[currentStep].description}</p>

              {/* Step-specific content */}
              {currentStep === 0 && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-center space-x-3">
                      <i className="bi bi-check-circle text-green-600"></i>
                      <span>Complete inventory management</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <i className="bi bi-check-circle text-green-600"></i>
                      <span>Customer relationship management</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <i className="bi bi-check-circle text-green-600"></i>
                      <span>Sales tracking and reporting</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <i className="bi bi-check-circle text-green-600"></i>
                      <span>Stock movement monitoring</span>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="bg-green-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sample data included:
                  </h3>
                  <div className="text-left space-y-2">
                    <div className="flex items-center space-x-3">
                      <i className="bi bi-capsule text-green-600"></i>
                      <span>3 sample medicines (Paracetamol, Ibuprofen, Amoxicillin)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <i className="bi bi-truck text-green-600"></i>
                      <span>3 sample suppliers</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <i className="bi bi-people text-green-600"></i>
                      <span>3 sample customers</span>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="bg-green-50 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <Link
                        key={index}
                        href={action.href}
                        className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition flex items-center space-x-3`}
                      >
                        <i className={`${action.icon} text-xl`}></i>
                        <div className="text-left">
                          <div className="font-semibold">{action.title}</div>
                          <div className="text-sm opacity-90">{action.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <div>
                {currentStep > 0 && <SecondaryButton onClick={prevStep}>Previous</SecondaryButton>}
              </div>
              <div className="flex space-x-4">
                <SecondaryButton onClick={skipOnboarding}>Skip Setup</SecondaryButton>
                {currentStep < steps.length - 1 ? (
                  <PrimaryButton onClick={nextStep}>Next</PrimaryButton>
                ) : (
                  <Link href="/dashboard">
                    <PrimaryButton>Go to Dashboard</PrimaryButton>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Need help getting started?</p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                <i className="bi bi-book mr-1"></i>
                Documentation
              </a>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                <i className="bi bi-chat-dots mr-1"></i>
                Support
              </a>
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                <i className="bi bi-play-circle mr-1"></i>
                Video Tutorial
              </a>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
