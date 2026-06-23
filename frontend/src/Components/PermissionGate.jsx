import { useAuth } from '../context/AuthContext';

/**
 * Renders children only when the user satisfies the permission/role check.
 *
 * Props:
 *   permission   – single permission string
 *   permissions  – array, user must have ANY of these
 *   allOf        – array, user must have ALL of these
 *   role         – single role string
 *   roles        – array, user must have ANY of these roles
 *   fallback     – what to render when access is denied (default: null)
 *
 * Examples:
 *   <PermissionGate permission="manage_medicines">…</PermissionGate>
 *   <PermissionGate roles={['super_admin','pharmacy_admin']}>…</PermissionGate>
 *   <PermissionGate permissions={['manage_medicines','view_reports']} fallback={<p>No access</p>}>…</PermissionGate>
 */
export default function PermissionGate({
  children,
  permission,
  permissions,
  allOf,
  role,
  roles,
  fallback = null,
}) {
  const auth = useAuth();

  let allowed = true;

  if (permission)   allowed = allowed && auth.hasPermission(permission);
  if (permissions)  allowed = allowed && auth.hasAnyPermission(...permissions);
  if (allOf)        allowed = allowed && auth.hasAllPermissions(...allOf);
  if (role)         allowed = allowed && auth.isRole(role);
  if (roles)        allowed = allowed && roles.includes(auth.user?.role);

  return allowed ? children : fallback;
}
