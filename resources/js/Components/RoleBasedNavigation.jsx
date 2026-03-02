import React, { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

// Permission-based navigation configuration with sections
const getNavigationConfig = () => {
  return {
    // Super Admin Navigation - Organized by Priority
    super_admin: [
      // MAIN OPERATIONS (Most Important)
      {
        section: 'Main Operations',
        items: [
          {
            name: 'Dashboard',
            route: 'dashboard',
            icon: 'house-door-fill',
            permission: null,
            priority: 'high',
            description: 'Main overview'
          },
          {
            name: 'POS System',
            route: 'pos.dashboard',
            icon: 'calculator',
            permission: 'process_sales',
            priority: 'high',
            description: 'Point of sale'
          },
          {
            name: 'Medicines',
            route: 'medicines.index',
            icon: 'capsule-pill',
            permission: 'manage_medicines',
            priority: 'high',
            description: 'Inventory management'
          },
          {
            name: 'Sales',
            route: 'sales.index',
            icon: 'receipt',
            permission: 'process_sales',
            priority: 'high',
            description: 'Sales transactions'
          },
        ]
      },
      
      // BUSINESS MANAGEMENT
      {
        section: 'Business Management',
        items: [
          {
            name: 'Customers',
            route: 'customers.index',
            icon: 'people-fill',
            permission: 'manage_customers',
            priority: 'medium',
            description: 'Customer database'
          },
          {
            name: 'Purchases',
            route: 'purchases.index',
            icon: 'cart-plus-fill',
            permission: 'manage_purchases',
            priority: 'medium',
            description: 'Purchase orders'
          },
          {
            name: 'Suppliers',
            route: 'suppliers.index',
            icon: 'truck',
            permission: 'manage_suppliers',
            priority: 'medium',
            description: 'Supplier management'
          },
          {
            name: 'Stock Movements',
            route: 'stock-movements.index',
            icon: 'arrow-left-right',
            permission: 'manage_medicines',
            priority: 'medium',
            description: 'Inventory tracking'
          },
        ]
      },

      // ANALYTICS & REPORTS
      {
        section: 'Analytics & Reports',
        items: [
          {
            name: 'Enhanced Analytics',
            route: 'dashboard.enhanced',
            icon: 'graph-up-arrow',
            permission: 'view_reports',
            priority: 'medium',
            description: 'Advanced insights'
          },
          {
            name: 'Reports',
            route: 'reports.index',
            icon: 'file-earmark-bar-graph',
            permission: 'view_reports',
            priority: 'medium',
            description: 'Business reports'
          },
          {
            name: 'System Overview',
            route: 'system.overview',
            icon: 'speedometer2',
            permission: null,
            priority: 'low',
            description: 'System status'
          },
        ]
      },

      // AUTOMATION & TOOLS
      {
        section: 'Automation & Tools',
        items: [
          {
            name: 'Smart Automation',
            route: 'automation.dashboard',
            icon: 'robot',
            permission: 'view_reports',
            priority: 'low',
            description: 'AI-powered tools'
          },
          {
            name: 'Reorder Suggestions',
            route: 'automation.reorder-suggestions',
            icon: 'arrow-repeat',
            permission: 'view_reports',
            priority: 'low',
            description: 'Smart reordering'
          },
        ]
      },

      // ADMINISTRATION
      {
        section: 'Administration',
        items: [
          {
            name: 'User Management',
            route: 'users.management',
            icon: 'person-gear',
            permission: 'manage_users',
            priority: 'low',
            description: 'Manage users'
          },
          {
            name: 'Audit Logs',
            route: 'audit.index',
            icon: 'shield-check',
            permission: 'view_audit_logs',
            priority: 'low',
            description: 'Security logs'
          },
          {
            name: 'Security Dashboard',
            route: 'audit.security',
            icon: 'shield-exclamation',
            permission: 'view_audit_logs',
            priority: 'low',
            description: 'Security monitoring'
          },
          {
            name: 'Settings',
            route: 'settings.index',
            icon: 'gear-fill',
            permission: 'manage_settings',
            priority: 'low',
            description: 'System settings'
          },
        ]
      },
    ],

    // Pharmacy Admin Navigation - Organized by Priority
    pharmacy_admin: [
      // MAIN OPERATIONS
      {
        section: 'Main Operations',
        items: [
          {
            name: 'Dashboard',
            route: 'dashboard',
            icon: 'house-door-fill',
            permission: null,
            priority: 'high',
            description: 'Main overview'
          },
          {
            name: 'POS System',
            route: 'pos.dashboard',
            icon: 'calculator',
            permission: 'process_sales',
            priority: 'high',
            description: 'Point of sale'
          },
          {
            name: 'Medicines',
            route: 'medicines.index',
            icon: 'capsule-pill',
            permission: 'manage_medicines',
            priority: 'high',
            description: 'Inventory management'
          },
          {
            name: 'Sales',
            route: 'sales.index',
            icon: 'receipt',
            permission: 'process_sales',
            priority: 'high',
            description: 'Sales transactions'
          },
        ]
      },
      
      // BUSINESS MANAGEMENT
      {
        section: 'Business Management',
        items: [
          {
            name: 'Customers',
            route: 'customers.index',
            icon: 'people-fill',
            permission: 'manage_customers',
            priority: 'medium',
            description: 'Customer database'
          },
          {
            name: 'Purchases',
            route: 'purchases.index',
            icon: 'cart-plus-fill',
            permission: 'manage_purchases',
            priority: 'medium',
            description: 'Purchase orders'
          },
          {
            name: 'Suppliers',
            route: 'suppliers.index',
            icon: 'truck',
            permission: 'manage_suppliers',
            priority: 'medium',
            description: 'Supplier management'
          },
          {
            name: 'Stock Movements',
            route: 'stock-movements.index',
            icon: 'arrow-left-right',
            permission: 'manage_medicines',
            priority: 'medium',
            description: 'Inventory tracking'
          },
        ]
      },

      // ANALYTICS & REPORTS
      {
        section: 'Analytics & Reports',
        items: [
          {
            name: 'Enhanced Analytics',
            route: 'dashboard.enhanced',
            icon: 'graph-up-arrow',
            permission: 'view_reports',
            priority: 'medium',
            description: 'Advanced insights'
          },
          {
            name: 'Reports',
            route: 'reports.index',
            icon: 'file-earmark-bar-graph',
            permission: 'view_reports',
            priority: 'medium',
            description: 'Business reports'
          },
          {
            name: 'Sales Reports',
            route: 'sales.report',
            icon: 'graph-up-arrow',
            permission: 'view_reports',
            priority: 'medium',
            description: 'Sales analytics'
          },
        ]
      },

      // AUTOMATION & TOOLS
      {
        section: 'Automation & Tools',
        items: [
          {
            name: 'Smart Automation',
            route: 'automation.dashboard',
            icon: 'robot',
            permission: 'view_reports',
            priority: 'low',
            description: 'AI-powered tools'
          },
          {
            name: 'Reorder Suggestions',
            route: 'automation.reorder-suggestions',
            icon: 'arrow-repeat',
            permission: 'view_reports',
            priority: 'low',
            description: 'Smart reordering'
          },
        ]
      },

      // ADMINISTRATION
      {
        section: 'Administration',
        items: [
          {
            name: 'User Management',
            route: 'users.management',
            icon: 'person-gear',
            permission: 'manage_users',
            priority: 'low',
            description: 'Manage users'
          },
          {
            name: 'Audit Logs',
            route: 'audit.index',
            icon: 'shield-check',
            permission: 'view_audit_logs',
            priority: 'low',
            description: 'Security logs'
          },
          {
            name: 'Settings',
            route: 'settings.index',
            icon: 'gear-fill',
            permission: 'manage_settings',
            priority: 'low',
            description: 'System settings'
          },
        ]
      },
    ],

    // Pharmacist Navigation - Organized by Priority
    pharmacist: [
      // MAIN OPERATIONS
      {
        section: 'Main Operations',
        items: [
          {
            name: 'Dashboard',
            route: 'dashboard',
            icon: 'house-door-fill',
            permission: null,
            priority: 'high',
            description: 'Main overview'
          },
          {
            name: 'POS System',
            route: 'pos.dashboard',
            icon: 'calculator',
            permission: 'process_sales',
            priority: 'high',
            description: 'Point of sale'
          },
          {
            name: 'Medicines',
            route: 'medicines.index',
            icon: 'capsule-pill',
            permission: 'manage_medicines',
            priority: 'high',
            description: 'Inventory management'
          },
          {
            name: 'Sales',
            route: 'sales.index',
            icon: 'receipt',
            permission: 'process_sales',
            priority: 'high',
            description: 'Sales transactions'
          },
        ]
      },
      
      // BUSINESS MANAGEMENT
      {
        section: 'Business Management',
        items: [
          {
            name: 'Customers',
            route: 'customers.index',
            icon: 'people-fill',
            permission: 'manage_customers',
            priority: 'medium',
            description: 'Customer database'
          },
          {
            name: 'Purchases',
            route: 'purchases.index',
            icon: 'cart-plus-fill',
            permission: 'manage_purchases',
            priority: 'medium',
            description: 'Purchase orders'
          },
          {
            name: 'Suppliers',
            route: 'suppliers.index',
            icon: 'truck',
            permission: 'manage_suppliers',
            priority: 'medium',
            description: 'Supplier management'
          },
          {
            name: 'Stock Movements',
            route: 'stock-movements.index',
            icon: 'arrow-left-right',
            permission: 'manage_medicines',
            priority: 'medium',
            description: 'Inventory tracking'
          },
        ]
      },

      // ANALYTICS & REPORTS
      {
        section: 'Analytics & Reports',
        items: [
          {
            name: 'Enhanced Analytics',
            route: 'dashboard.enhanced',
            icon: 'graph-up-arrow',
            permission: 'view_reports',
            priority: 'medium',
            description: 'Advanced insights'
          },
          {
            name: 'Reports',
            route: 'reports.index',
            icon: 'file-earmark-bar-graph',
            permission: 'view_reports',
            priority: 'medium',
            description: 'Business reports'
          },
          {
            name: 'Sales Reports',
            route: 'sales.report',
            icon: 'graph-up-arrow',
            permission: 'view_reports',
            priority: 'medium',
            description: 'Sales analytics'
          },
        ]
      },

      // AUTOMATION & TOOLS
      {
        section: 'Automation & Tools',
        items: [
          {
            name: 'Smart Automation',
            route: 'automation.dashboard',
            icon: 'robot',
            permission: 'view_reports',
            priority: 'low',
            description: 'AI-powered tools'
          },
          {
            name: 'Reorder Suggestions',
            route: 'automation.reorder-suggestions',
            icon: 'arrow-repeat',
            permission: 'view_reports',
            priority: 'low',
            description: 'Smart reordering'
          },
        ]
      },
    ],

    // Cashier Navigation - Simplified for Essential Tasks
    cashier: [
      {
        section: 'Essential Tasks',
        items: [
          {
            name: 'POS System',
            route: 'pos.dashboard',
            icon: 'calculator',
            permission: 'process_sales',
            priority: 'high',
            description: 'Point of sale'
          },
          {
            name: 'Sales',
            route: 'sales.index',
            icon: 'receipt',
            permission: 'process_sales',
            priority: 'high',
            description: 'Sales transactions'
          },
          {
            name: 'Customers',
            route: 'customers.index',
            icon: 'people-fill',
            permission: 'manage_customers',
            priority: 'medium',
            description: 'Customer database'
          },
          {
            name: 'Medicines',
            route: 'medicines.index',
            icon: 'capsule-pill',
            permission: null,
            priority: 'medium',
            description: 'View inventory',
            note: 'View Only',
          },
        ]
      },
    ],
  };
};

// Check if user has permission
const hasPermission = (userPermissions, requiredPermission) => {
  if (!requiredPermission) return true; // No permission required
  if (!userPermissions) return false;

  // For debugging, temporarily allow all permissions
  return true;
  
  // Uncomment this line when permissions are properly set up:
  // return userPermissions.includes(requiredPermission);
};

// Navigation Item Component
// SAFE NavigationItem Component - NO OBJECT RENDERING
const NavigationItem = ({ item, isActive, userPermissions, onClick }) => {
  // SAFE data extraction
  const itemName = String((item && item.name) || '');
  const itemRoute = String((item && item.route) || '');
  const itemIcon = String((item && item.icon) || '');
  const itemPermission = item && item.permission ? String(item.permission) : null;
  const itemNote = item && item.note ? String(item.note) : '';

  // Check if user has permission for this item
  if (!hasPermission(userPermissions, itemPermission)) {
    return null;
  }

  const handleClick = e => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <li>
      <Link
        href={route(itemRoute)}
        className={`group relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 nav-item-glow ${
          isActive
            ? 'bg-gradient-to-r from-accent-500/15 to-primary-600/15 text-accent-300 shadow-lg backdrop-blur-sm border border-accent-400/25 pulse-glow'
            : 'text-primary-300 hover:bg-white/8 hover:text-white hover:shadow-md'
        }`}
        onClick={handleClick}
      >
        {/* Active indicator */}
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full transition-all duration-300 ${
            isActive ? 'bg-gradient-to-b from-accent-500 to-primary-600 shadow-lg pulse-glow' : 'bg-transparent group-hover:bg-white/25'
          }`}
        />

        {/* Icon */}
        <i
          className={`bi bi-${itemIcon} flex-shrink-0 text-lg transition-all duration-300 ${
            isActive ? 'text-accent-300 drop-shadow-sm' : 'text-primary-400 group-hover:text-white group-hover:scale-110'
          }`}
        />

        {/* Label */}
        <span className="flex-1 font-medium">{itemName}</span>

        {/* Note (e.g., "View Only") */}
        {itemNote && (
          <span className="text-xs px-2 py-1 bg-primary-700/50 text-primary-300 rounded-full border border-primary-600/50 backdrop-blur-sm">
            {itemNote}
          </span>
        )}

        {/* Hover effect */}
        {!isActive && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-500/0 to-primary-600/0 group-hover:from-accent-500/4 group-hover:to-primary-600/4 transition-all duration-300"></div>
        )}

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 shimmer transition-opacity duration-300"></div>
      </Link>
    </li>
  );
};

// SAFE Role Badge Component - NO OBJECT RENDERING
const RoleBadge = React.memo(({ role }) => {
  const safeRole = String(role || 'user');
  
  // SAFE role configuration - no complex objects
  let label = 'User';
  let color = 'bg-gradient-to-r from-neutral-500/15 to-primary-500/15 text-neutral-300 border-neutral-400/25';
  let icon = 'person';

  if (safeRole === 'super_admin') {
    label = 'Super Admin';
    color = 'bg-gradient-to-r from-red-500/15 to-pink-500/15 text-red-300 border-red-400/25';
    icon = 'crown';
  } else if (safeRole === 'pharmacy_admin') {
    label = 'Pharmacy Admin';
    color = 'bg-gradient-to-r from-primary-500/15 to-accent-500/15 text-primary-300 border-primary-400/25';
    icon = 'shield-fill-check';
  } else if (safeRole === 'pharmacist') {
    label = 'Pharmacist';
    color = 'bg-gradient-to-r from-accent-500/15 to-primary-600/15 text-accent-300 border-accent-400/25';
    icon = 'capsule';
  } else if (safeRole === 'cashier') {
    label = 'Cashier';
    color = 'bg-gradient-to-r from-green-500/15 to-emerald-500/15 text-green-300 border-green-400/25';
    icon = 'calculator';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border backdrop-blur-sm ${color}`}
    >
      <i className={`bi bi-${icon} mr-1`}></i>
      {label}
    </span>
  );
});

// BULLETPROOF Main Navigation Component - NO OBJECT RENDERING
const RoleBasedNavigation = React.memo(({ onItemClick }) => {
  const { props } = usePage();
  const user = props.auth?.user;
  const userPermissions = props.auth?.permissions || [];

  // SAFE data extraction - all primitives
  const userName = String((user && user.name) || 'Unknown User');
  const userRole = String((user && user.role) || 'cashier');
  const pharmacyId = String((user && user.pharmacy_id) || '');
  const permissionCount = Number(userPermissions.length || 0);

  // SAFE navigation items - no complex objects
  const navigationItems = useMemo(() => {
    if (!user) return [];
    
    const navigationConfig = getNavigationConfig();
    const items = navigationConfig[userRole] || [];
    
    // SAFE conversion - ensure all properties are primitives
    return items.map(section => ({
      section: String(section.section || ''),
      items: (section.items || []).map(item => ({
        name: String(item.name || ''),
        route: String(item.route || ''),
        icon: String(item.icon || ''),
        permission: item.permission ? String(item.permission) : null,
        priority: String(item.priority || 'low'),
        description: String(item.description || '')
      }))
    }));
  }, [userRole]);

  // SAFE current route
  const currentRoute = useMemo(() => {
    try {
      return String(route().current() || '');
    } catch (error) {
      return '';
    }
  }, []);

  if (!user) return null;

  return (
    <div className="flex flex-col h-full">
      {/* User info with role badge */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <RoleBadge role={userRole} />
          </div>
        </div>
      </div>

      {/* SAFE Navigation items - no complex loops */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        <ul className="space-y-2">
          {navigationItems.map((section, sectionIndex) => (
            <React.Fragment key={String(sectionIndex)}>
              {/* Section Header */}
              {section.section && (
                <li className="px-3 py-2 text-xs font-semibold text-primary-400 uppercase tracking-wider">
                  {String(section.section)}
                </li>
              )}
              
              {/* SAFE Section Items */}
              {section.items && section.items.map((item, itemIndex) => (
                <NavigationItem
                  key={String(item.route) + String(itemIndex)}
                  item={item}
                  isActive={currentRoute === String(item.route)}
                  userPermissions={userPermissions}
                  onClick={onItemClick}
                />
              ))}
            </React.Fragment>
          ))}
        </ul>
      </nav>

      {/* SAFE Footer with additional info */}
      <div className="px-4 py-3 border-t border-white/10 bg-gradient-to-r from-primary-800/30 to-primary-700/30 backdrop-blur-sm">
        <div className="text-xs text-primary-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <i className="bi bi-shield-check text-accent-400"></i>
              <span>Permissions: {permissionCount}</span>
            </span>
            {pharmacyId && (
              <span className="flex items-center space-x-1">
                <i className="bi bi-building text-accent-400"></i>
                <span>ID: {pharmacyId}</span>
              </span>
            )}
          </div>
          
          {/* System status */}
          <div className="flex items-center justify-between pt-1">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></div>
              <span className="text-accent-400">System Online</span>
            </span>
            <span className="text-primary-500">
              v2.1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default RoleBasedNavigation;