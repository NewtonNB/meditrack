import React, { useState, useEffect } from 'react';
import Dropdown from '@/Components/Dropdown';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import RoleBasedNavigation from '@/Components/RoleBasedNavigation'; // Re-enabled with safe implementation

import GlobalSearch from '@/Components/GlobalSearch';
import NotificationBell from '@/Components/Notifications/NotificationBell';
import ThemeToggle from '@/Components/ThemeToggle';
import { Link, usePage } from '@inertiajs/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { route } from 'ziggy-js';
import { Ziggy } from '@/ziggy';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
// import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// Icon mapping for navigation items
const iconMap = {
  profile: 'person',
  logout: 'box-arrow-right',
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorDetails: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorDetails: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in layout:', error, errorInfo);
    
    // Log specific details about React error #31
    if (error.message && error.message.includes('object with keys')) {
      console.error('React Error #31 - Object rendering detected:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.errorDetails?.message?.includes('object with keys') 
                ? 'A component is trying to render an object directly. This is a React error #31.'
                : 'We\'re working on fixing this issue.'
              }
            </p>
            <div className="mb-4 p-3 bg-gray-50 rounded text-xs text-left">
              <strong>Error:</strong> {this.state.errorDetails?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



export default function AuthenticatedLayout({ header, children }) {
  const page = usePage();
  const user = page.props.auth.user;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Handle route changes
  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);

    // Listen to Inertia's navigation events
    window.addEventListener('inertia:start', handleStart);
    window.addEventListener('inertia:finish', handleComplete);

    return () => {
      window.removeEventListener('inertia:start', handleStart);
      window.removeEventListener('inertia:finish', handleComplete);
    };
  }, []);

  // Close mobile menu when navigating
  const handleNavigation = () => {
    setSidebarOpen(false);
  };

  // Helper function to safely get route URL (kept for backward compatibility)
  const getSafeRoute = (name, params = {}, absolute = true) => {
    try {
      return route(name, params, absolute, Ziggy);
    } catch (error) {
      console.error(`Error getting route '${name}':`, String(error.message || error));
      return '#';
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 relative">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/10 to-neutral-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-200/10 to-primary-200/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        {/* Mobile menu */}
        <div className={`fixed inset-0 flex z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0">
            <div
              className="absolute inset-0 mobile-menu-backdrop"
              onClick={() => setSidebarOpen(false)}
            ></div>
          </div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full soft-mobile-menu shadow-2xl">
            {/* Close Button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-14 w-14 soft-close-button hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50 transition-all duration-300 shadow-lg hover:shadow-xl"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Mobile Logo Section */}
            <div className="flex-shrink-0 flex items-center px-6 mb-8 pt-6">
              <Link href={getSafeRoute('dashboard')} className="flex items-center group logo-enhanced">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-14 h-14 ultra-rounded-logo flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300 pulse-glow">
                      <span className="text-white font-bold text-xl">M</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 soft-status"></div>
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-xl tracking-tight">MediTrack</h1>
                    <p className="text-slate-300 text-sm font-medium">Pharmacy Management</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto custom-scrollbar">
              <RoleBasedNavigation onItemClick={handleNavigation} />
            </div>

            {/* Mobile User Section */}
            <div className="flex-shrink-0 soft-user-section p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 relative">
                  <div className="h-14 w-14 soft-avatar flex items-center justify-center shadow-xl">
                    <span className="text-white text-lg font-bold">
                      {user.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 soft-status border-2 border-slate-700"></div>
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-white">{String(user.name || 'User')}</p>
                  <Link
                    href={getSafeRoute('profile.edit')}
                    className="text-sm font-medium text-slate-300 hover:text-slate-200 transition-colors duration-200 flex items-center mt-1 rounded-xl px-2 py-1 hover:bg-white/10"
                    onClick={handleNavigation}
                  >
                    <i className="bi bi-person mr-2"></i>
                    View profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Static sidebar for desktop */}
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 z-30">
          <div className="flex flex-col w-64 ultra-soft-sidebar sidebar-glow relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-xl soft-floating-orb"></div>
              <div className="absolute bottom-20 right-8 w-24 h-24 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full blur-xl soft-floating-orb"></div>
              <div className="absolute top-1/2 left-4 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-xl soft-floating-orb"></div>
              <div className="absolute top-1/4 right-6 w-20 h-20 bg-gradient-to-br from-indigo-400/8 to-blue-500/8 rounded-full blur-xl soft-floating-orb"></div>
              <div className="absolute bottom-1/3 left-8 w-14 h-14 bg-gradient-to-br from-pink-400/8 to-purple-500/8 rounded-full blur-xl soft-floating-orb"></div>
            </div>

            {/* Decorative Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
            </div>

            {/* Logo Section */}
            <div className="flex items-center flex-shrink-0 px-6 pt-8 pb-6 relative z-10">
              <Link href={getSafeRoute('dashboard')} className="flex items-center group w-full logo-enhanced">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 ultra-rounded-logo flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/25 group-hover:scale-105 transition-all duration-500 pulse-glow">
                      <span className="text-white font-bold text-2xl tracking-tight">M</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 soft-status"></div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-white font-bold text-2xl group-hover:text-blue-200 transition-colors duration-300 gradient-text tracking-tight leading-tight">
                      MediTrack
                    </h1>
                    <p className="text-slate-300 text-sm font-medium tracking-wide">
                      Pharmacy Management
                    </p>
                    <div className="flex items-center mt-1 space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-300 font-medium">Online</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar relative z-10">
              <RoleBasedNavigation />
            </div>

            {/* User Section */}
            <div className="flex-shrink-0 soft-user-section p-6 relative z-10">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 soft-avatar flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300">
                    <span className="text-white text-lg font-bold">
                      {user.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 soft-status border-2 border-slate-700"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white truncate tracking-wide">{String(user.name || 'User')}</p>
                  <p className="text-sm text-slate-300 truncate capitalize font-medium">{String(user?.role || 'User')}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-300 font-medium">Active Now</span>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="md:ml-64 flex flex-col flex-1 min-h-screen pt-16 relative z-10">
          {/* Header */}
          <div className="fixed top-0 inset-x-0 md:left-64 z-20 flex h-16 soft-header shadow-xl">
            <button
              type="button"
              className="px-5 py-3 border-r border-white/20 text-slate-600 hover:text-slate-900 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden touch-manipulation transition-all duration-300 group rounded-r-3xl"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
            </button>

            {/* Header Content */}
            <div className="flex-1 px-6 flex justify-between items-center lg:max-w-6xl lg:mx-auto lg:px-8">
              <div className="flex-1 flex items-center">
                <div className="w-full flex md:ml-0 max-w-lg search-enhanced">
                  <GlobalSearch className="w-full soft-search" inputClassName="min-h-[44px] soft-search focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl" />
                </div>
              </div>

              <div className="ml-6 flex items-center space-x-3">
                {/* Theme Toggle */}
                <div className="hidden sm:block">
                  <div className="soft-theme-toggle p-3">
                    <ThemeToggle />
                  </div>
                </div>

                {/* Notification Bell */}
                <div className="relative">
                  <div className="soft-notification p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/90">
                    <NotificationBell />
                  </div>
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <Dropdown>
                    <Dropdown.Trigger>
                      <span className="inline-flex">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-3 soft-button text-sm leading-4 font-semibold text-slate-700 hover:text-slate-900 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:ring-offset-2 transition-all duration-300 shadow-lg touch-manipulation group"
                        >
                          <div className="w-10 h-10 soft-avatar flex items-center justify-center mr-3 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                            <span className="text-white text-sm font-bold">
                              {user.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div className="hidden sm:flex flex-col items-start">
                            <span className="font-bold text-slate-800 tracking-wide">{String(user.name || 'User')}</span>
                            <span className="text-xs text-slate-500 capitalize font-medium">{String(user?.role || 'User')}</span>
                          </div>
                          <svg
                            className="ml-3 -mr-0.5 h-4 w-4 group-hover:rotate-180 transition-transform duration-300 text-slate-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </span>
                    </Dropdown.Trigger>

                    <Dropdown.Content className="soft-dropdown shadow-2xl">
                      <ResponsiveNavLink href={getSafeRoute('profile.edit')} className="hover:bg-blue-50/80 rounded-2xl mx-3 my-2 transition-all duration-200 flex items-center px-4 py-3">
                        <i className="bi bi-person mr-3 text-blue-600 text-lg"></i>
                        <div>
                          <div className="font-semibold text-slate-800">Profile Settings</div>
                          <div className="text-xs text-slate-500">Manage your account</div>
                        </div>
                      </ResponsiveNavLink>
                      <div className="border-t border-slate-200/50 my-2 mx-3"></div>
                      <Dropdown.Link
                        href={getSafeRoute('logout')}
                        method="post"
                        as="button"
                        className="text-red-600 hover:bg-red-50/80 rounded-2xl mx-3 my-2 transition-all duration-200 flex items-center px-4 py-3 w-full"
                      >
                        <i className="bi bi-box-arrow-right mr-3 text-lg"></i>
                        <div>
                          <div className="font-semibold">Sign Out</div>
                          <div className="text-xs text-red-400">End your session</div>
                        </div>
                      </Dropdown.Link>
                    </Dropdown.Content>
                  </Dropdown>
                </div>
              </div>
            </div>
          </div>

          {/* Page header */}
          {header && (
            <header className="soft-page-header shadow-lg">
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-6">
                  <div className="w-2 h-12 bg-gradient-to-b from-blue-500 via-purple-600 to-indigo-700 rounded-full shadow-lg"></div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-700 bg-clip-text text-transparent tracking-tight leading-tight">
                      {header}
                    </h1>
                    <div className="flex items-center mt-2 space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-600 font-medium">Live Data</span>
                      </div>
                      <div className="text-sm text-slate-500">
                        Last updated: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
                      <i className="bi bi-activity text-blue-600"></i>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* Main content */}
          <main className="flex-1 pb-8 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
          </main>
        </div>

        {/* Loading overlay */}
        {isNavigating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center loading-overlay">
            <div className="soft-loading p-10 flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-800 mb-2">Loading...</div>
                <div className="text-sm text-slate-600">Please wait while we load your content</div>
              </div>
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </ErrorBoundary>
  );
}
