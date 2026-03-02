import React from 'react';
import { Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';

const DebugDashboardLink = () => {
  const handleClick = (e) => {
    e.preventDefault();
    console.log('Dashboard link clicked!');
    console.log('Current URL:', window.location.href);
    console.log('Target route:', route('dashboard'));
    
    // Try different navigation methods
    try {
      // Method 1: Direct router visit
      router.visit(route('dashboard'));
    } catch (error) {
      console.error('Router visit failed:', error);
      
      // Method 2: Window location
      try {
        window.location.href = route('dashboard');
      } catch (error2) {
        console.error('Window location failed:', error2);
        
        // Method 3: Direct URL
        window.location.href = '/dashboard';
      }
    }
  };

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">Debug Dashboard Navigation</h3>
      <div className="space-y-2">
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
        >
          Test Dashboard Link
        </button>
        
        <Link
          href={route('dashboard')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2 inline-block"
        >
          Inertia Link to Dashboard
        </Link>
        
        <a
          href="/dashboard"
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-2 inline-block"
        >
          Regular Link to Dashboard
        </a>
      </div>
      
      <div className="mt-3 text-sm text-yellow-700">
        <p>Current URL: {String(window?.location?.href || 'Unknown')}</p>
        <p>Dashboard Route: {route('dashboard')}</p>
      </div>
    </div>
  );
};

export default DebugDashboardLink;