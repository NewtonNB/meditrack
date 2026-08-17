import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles]             = useState([]);
  const [loading, setLoading]     = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      setLoading(false);
      return;
    }

    // Verify token is still valid before marking user authenticated.
    getMe()
      .then(({ data }) => {
        setUser(data.user);
        setPermissions(data.user.permissions || []);
        setRoles(data.user.roles || []);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        localStorage.setItem('auth_permissions', JSON.stringify(data.user.permissions || []));
        localStorage.setItem('auth_roles', JSON.stringify(data.user.roles || []));
      })
      .catch((err) => {
        // Only clear the token if the server explicitly rejected it (401).
        // For ALL other errors (network down, 5xx), clear the session —
        // we cannot trust a token we haven't been able to verify.
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_permissions');
        localStorage.removeItem('auth_roles');
        setUser(null);
        setPermissions([]);
        setRoles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await apiLogin(credentials);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    localStorage.setItem('auth_permissions', JSON.stringify(data.user.permissions || []));
    localStorage.setItem('auth_roles', JSON.stringify(data.user.roles || []));
    setUser(data.user);
    setPermissions(data.user.permissions || []);
    setRoles(data.user.roles || []);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch (_) {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_permissions');
    localStorage.removeItem('auth_roles');
    setUser(null);
    setPermissions([]);
    setRoles([]);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await getMe();
    const user = data.user;
    setUser(user);
    setPermissions(user.permissions || []);
    setRoles(user.roles || []);
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_permissions', JSON.stringify(user.permissions || []));
    localStorage.setItem('auth_roles', JSON.stringify(user.roles || []));
    return user;
  }, []);

  const updateAuthUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  }, []);

  const isRole = (...roles) => roles.includes(user?.role);
  const isSuperAdmin    = () => isRole('super_admin');
  const isPharmacyAdmin = () => isRole('pharmacy_admin');
  const isPharmacist    = () => isRole('pharmacist');
  const isCashier       = () => isRole('cashier');
  
  const hasPermission = (permission) => permissions.includes(permission);
  const hasAnyPermission = (...perms) => perms.some(p => permissions.includes(p));
  const hasAllPermissions = (...perms) => perms.every(p => permissions.includes(p));

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        permissions,
        roles,
        loading, 
        login, 
        logout, 
        refreshUser,
        updateAuthUser,
        isRole, 
        isSuperAdmin, 
        isPharmacyAdmin, 
        isPharmacist, 
        isCashier,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
