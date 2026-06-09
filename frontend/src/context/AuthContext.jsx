import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token    = localStorage.getItem('auth_token');
    const cached   = localStorage.getItem('auth_user');
    if (token && cached) {
      try {
        setUser(JSON.parse(cached));
      } catch (_) {}
    }
    if (token) {
      // Verify token is still valid
      getMe()
        .then(({ data }) => {
          setUser(data.user);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await apiLogin(credentials);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch (_) {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  const isRole = (...roles) => roles.includes(user?.role);
  const isSuperAdmin    = () => isRole('super_admin');
  const isPharmacyAdmin = () => isRole('pharmacy_admin');
  const isPharmacist    = () => isRole('pharmacist');
  const isCashier       = () => isRole('cashier');

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isRole, isSuperAdmin, isPharmacyAdmin, isPharmacist, isCashier }}
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
