import React from 'react';
import { usePage } from '@inertiajs/react';

/**
 * Permission Gate Component
 *
 * Conditionally renders children based on user permissions or roles.
 *
 * @param {string|array} permission - Required permission(s)
 * @param {string|array} role - Required role(s)
 * @param {string} operator - 'and' or 'or' for multiple permissions/roles
 * @param {React.ReactNode} children - Content to render if authorized
 * @param {React.ReactNode} fallback - Content to render if not authorized
 * @param {boolean} requireAll - If true, user must have ALL permissions (default: false)
 */
const PermissionGate = ({
  permission = null,
  role = null,
  operator = 'or',
  children,
  fallback = null,
  requireAll = false,
}) => {
  const { props } = usePage();
  const user = props.auth?.user;
  const userPermissions = props.auth?.permissions || [];
  const userRoles = props.auth?.roles || [];

  // If no user, deny access
  if (!user) {
    return fallback;
  }

  // Helper function to check if user has a specific permission
  const hasPermission = permissionName => {
    return userPermissions.some(p => p.name === permissionName);
  };

  // Helper function to check if user has a specific role
  const hasRole = roleName => {
    return userRoles.some(r => r.name === roleName) || user.role === roleName;
  };

  // Check permissions
  let hasRequiredPermissions = true;
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];

    if (requireAll || operator === 'and') {
      // User must have ALL permissions
      hasRequiredPermissions = permissions.every(hasPermission);
    } else {
      // User must have at least ONE permission
      hasRequiredPermissions = permissions.some(hasPermission);
    }
  }

  // Check roles
  let hasRequiredRoles = true;
  if (role) {
    const roles = Array.isArray(role) ? role : [role];

    if (requireAll || operator === 'and') {
      // User must have ALL roles
      hasRequiredRoles = roles.every(hasRole);
    } else {
      // User must have at least ONE role
      hasRequiredRoles = roles.some(hasRole);
    }
  }

  // Determine final authorization
  let isAuthorized = true;

  if (permission && role) {
    // Both permission and role specified
    if (operator === 'and') {
      isAuthorized = hasRequiredPermissions && hasRequiredRoles;
    } else {
      isAuthorized = hasRequiredPermissions || hasRequiredRoles;
    }
  } else if (permission) {
    // Only permission specified
    isAuthorized = hasRequiredPermissions;
  } else if (role) {
    // Only role specified
    isAuthorized = hasRequiredRoles;
  }

  return isAuthorized ? children : fallback;
};

/**
 * Hook to check permissions in components
 */
export const usePermissions = () => {
  const { props } = usePage();
  const user = props.auth?.user;
  const userPermissions = props.auth?.permissions || [];
  const userRoles = props.auth?.roles || [];

  const hasPermission = permission => {
    if (!user) return false;
    const permissions = Array.isArray(permission) ? permission : [permission];
    return permissions.some(p => userPermissions.some(up => up.name === p));
  };

  const hasRole = role => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => userRoles.some(ur => ur.name === r) || user.role === r);
  };

  const hasAnyPermission = permissions => {
    return permissions.some(hasPermission);
  };

  const hasAllPermissions = permissions => {
    return permissions.every(hasPermission);
  };

  const hasAnyRole = roles => {
    return roles.some(hasRole);
  };

  const hasAllRoles = roles => {
    return roles.every(hasRole);
  };

  const isSuperAdmin = () => {
    return hasRole('super_admin');
  };

  const isPharmacyAdmin = () => {
    return hasRole('pharmacy_admin');
  };

  const isPharmacist = () => {
    return hasRole('pharmacist');
  };

  const isCashier = () => {
    return hasRole('cashier');
  };

  const canManageUsers = () => {
    return hasPermission('manage_users');
  };

  const canViewAuditLogs = () => {
    return hasPermission('view_audit_logs');
  };

  const canManageMedicines = () => {
    return hasPermission('manage_medicines');
  };

  const canProcessSales = () => {
    return hasPermission('process_sales');
  };

  const canViewReports = () => {
    return hasPermission('view_reports');
  };

  return {
    user,
    userPermissions,
    userRoles,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    hasAllRoles,
    isSuperAdmin,
    isPharmacyAdmin,
    isPharmacist,
    isCashier,
    canManageUsers,
    canViewAuditLogs,
    canManageMedicines,
    canProcessSales,
    canViewReports,
  };
};

/**
 * Higher-order component for permission-based rendering
 */
export const withPermissions = (WrappedComponent, requiredPermissions = []) => {
  return function PermissionWrappedComponent(props) {
    const { hasAnyPermission } = usePermissions();

    if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <i className="bi bi-shield-x text-red-600 text-xl"></i>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have permission to access this feature.
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

export default PermissionGate;
