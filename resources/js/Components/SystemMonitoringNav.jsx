import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function SystemMonitoringNav() {
  const { props } = usePage();
  const userRole = props.auth?.user?.role || 'cashier';
  
  const canViewSystemMonitor = ['pharmacy_admin', 'super_admin'].includes(userRole);
  const canViewDatabaseBrowser = userRole === 'super_admin';

  const monitoringLinks = [
    {
      name: 'System Monitor',
      href: '/system-monitor',
      icon: 'bi-speedometer2',
      description: 'Overview of all system tables and statistics',
      color: 'blue',
      access: canViewSystemMonitor,
      role: 'Pharmacy Admin+'
    },
    {
      name: 'Database Browser',
      href: '/database-browser',
      icon: 'bi-database',
      description: 'Direct database access and custom queries',
      color: 'red',
      access: canViewDatabaseBrowser,
      role: 'Super Admin Only'
    },
    {
      name: 'User Management',
      href: '/users',
      icon: 'bi-people',
      description: 'Manage users, roles, and permissions',
      color: 'green',
      access: canViewSystemMonitor,
      role: 'Pharmacy Admin+'
    },
    {
      name: 'Medicine Management',
      href: '/medicines',
      icon: 'bi-capsule',
      description: 'Inventory, stock levels, and medicine details',
      color: 'purple',
      access: ['pharmacist', 'pharmacy_admin', 'super_admin'].includes(userRole),
      role: 'Pharmacist+'
    },
    {
      name: 'Sales Management',
      href: '/sales',
      icon: 'bi-receipt',
      description: 'Transaction records and sales analytics',
      color: 'yellow',
      access: true, // All roles can access sales
      role: 'All Roles'
    },
    {
      name: 'Stock Movements',
      href: '/stock-movements',
      icon: 'bi-arrow-left-right',
      description: 'Inventory movements and adjustments',
      color: 'orange',
      access: ['pharmacist', 'pharmacy_admin', 'super_admin'].includes(userRole),
      role: 'Pharmacist+'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100',
      red: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100',
      green: 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100',
      purple: 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100',
      orange: 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">System Monitoring & Management</h3>
        <div className="text-sm text-gray-500">
          Current Role: <span className="font-medium text-gray-700">{userRole}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {monitoringLinks.map((link) => (
          <div key={link.name} className="relative">
            {link.access ? (
              <Link
                href={route(link.href.replace('/', '').replace('-', '_') + '.index')}
                className={`block p-4 border rounded-lg transition-colors ${getColorClasses(link.color)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <i className={`${link.icon} text-xl`}></i>
                  <span className="text-xs font-medium px-2 py-1 bg-white rounded">
                    {link.role}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{link.name}</h4>
                <p className="text-xs text-gray-600">{link.description}</p>
              </Link>
            ) : (
              <div className={`block p-4 border rounded-lg opacity-50 cursor-not-allowed bg-gray-50 border-gray-200`}>
                <div className="flex items-center justify-between mb-2">
                  <i className={`${link.icon} text-xl text-gray-400`}></i>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-200 text-gray-500 rounded">
                    {link.role}
                  </span>
                </div>
                <h4 className="font-medium text-gray-500 mb-1">{link.name}</h4>
                <p className="text-xs text-gray-400">{link.description}</p>
                <div className="mt-2 text-xs text-red-600">
                  <i className="bi bi-lock mr-1"></i>
                  Access Restricted
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">8</div>
            <div className="text-xs text-gray-500">Database Tables</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{canViewSystemMonitor ? '✓' : '✗'}</div>
            <div className="text-xs text-gray-500">System Monitor</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{canViewDatabaseBrowser ? '✓' : '✗'}</div>
            <div className="text-xs text-gray-500">Database Browser</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {monitoringLinks.filter(link => link.access).length}
            </div>
            <div className="text-xs text-gray-500">Available Tools</div>
          </div>
        </div>
      </div>
    </div>
  );
}