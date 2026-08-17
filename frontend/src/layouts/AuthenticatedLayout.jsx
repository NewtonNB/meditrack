import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { notifications as notifApi, search as searchApi } from '../api';

/**
 * Each nav item may declare:
 *   permission  – user needs this permission
 *   permissions – user needs ANY of these
 *   roles       – user must be one of these roles
 * If none are declared, the item is visible to all authenticated users.
 */
const NAV_ITEMS = [
  {
    group: null,
    items: [
      { to: '/dashboard',   icon: 'bi-speedometer2', label: 'Dashboard' },
    ],
  },
  {
    group: 'Pharmacy',
    items: [
      { to: '/pos',              icon: 'bi-cart3',            label: 'POS',             permission: 'process_sales' },
      { to: '/sales',            icon: 'bi-receipt',          label: 'Sales',           permission: 'process_sales' },
      { to: '/medicines',        icon: 'bi-capsule',          label: 'Medicines' },
      { to: '/purchases',        icon: 'bi-bag-check',        label: 'Purchases',       permission: 'manage_purchases' },
      { to: '/customers',        icon: 'bi-people',           label: 'Customers',       permissions: ['manage_customers', 'process_sales'] },
      { to: '/suppliers',        icon: 'bi-building',         label: 'Suppliers',       permission: 'manage_suppliers' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { to: '/inventory',        icon: 'bi-boxes',            label: 'Inventory',       permission: 'manage_medicines' },
      { to: '/stock-movements',  icon: 'bi-arrow-left-right', label: 'Stock Movements', permission: 'manage_medicines' },
      { to: '/automation',       icon: 'bi-robot',            label: 'Automation',      permissions: ['manage_medicines', 'view_reports'] },
    ],
  },
  {
    group: 'Reports',
    items: [
      { to: '/reports',          icon: 'bi-bar-chart',        label: 'Reports',         permission: 'view_reports' },
      { to: '/analytics',        icon: 'bi-graph-up',         label: 'Analytics',       permission: 'view_reports' },
      { to: '/ai',               icon: 'bi-robot',            label: 'AI Insights',     permissions: ['view_reports', 'manage_medicines'] },
    ],
  },
  {
    group: 'Admin',
    items: [
      { to: '/users',            icon: 'bi-person-gear',      label: 'Users',           permission: 'manage_users' },
      { to: '/audit-logs',       icon: 'bi-shield-check',     label: 'Audit Logs',      permission: 'view_audit_logs' },
      { to: '/system-overview',  icon: 'bi-diagram-3',        label: 'System Overview', roles: ['super_admin', 'pharmacy_admin'] },
      { to: '/settings',         icon: 'bi-gear',             label: 'Settings',        roles: ['super_admin', 'pharmacy_admin'] },
    ],
  },
  {
    group: 'Account',
    items: [
      { to: '/notifications',    icon: 'bi-bell',             label: 'Notifications' },
      { to: '/profile',          icon: 'bi-person',           label: 'Profile' },
    ],
  },
];

// Role display labels + colours
const ROLE_BADGES = {
  super_admin:    { label: 'Super Admin',    cls: 'bg-purple-500' },
  pharmacy_admin: { label: 'Admin',          cls: 'bg-blue-500' },
  pharmacist:     { label: 'Pharmacist',     cls: 'bg-teal-500' },
  cashier:        { label: 'Cashier',        cls: 'bg-gray-500' },
};

export default function AuthenticatedLayout() {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Notification bell
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notifApi.unreadCount();
        setUnreadCount(res.data?.count ?? res.data?.unread_count ?? 0);
      } catch { /* ignore */ }
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Global search
  const searchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 3) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchApi.global({ query: searchQuery });
        setSearchResults(res.data);
      } catch { setSearchResults(null); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults(null);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = async () => {
    setLogoutConfirmOpen(false);
    try {
      await logout();
    } catch (_err) {
      // Continue with client-side cleanup even if API logout fails.
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_permissions');
    localStorage.removeItem('auth_roles');

    toast.success('Logged out successfully.');
    window.location.href = '/login';
  };

  const cancelLogout = () => {
    setLogoutConfirmOpen(false);
  };

  // Check if a nav item is visible for the current user
  const canSee = (item) => {
    if (item.permission  && !hasPermission(item.permission))         return false;
    if (item.permissions && !hasAnyPermission(...item.permissions))  return false;
    if (item.roles       && !item.roles.includes(user?.role))        return false;
    return true;
  };

  const roleBadge = ROLE_BADGES[user?.role] ?? { label: user?.role, cls: 'bg-gray-500' };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div
        className={`fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 transform bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out md:static ${
        sidebarOpen
          ? 'translate-x-0 w-64 md:w-64'
          : '-translate-x-full w-64 md:translate-x-0 md:w-16'
      }`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700/60">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="bi bi-heart-pulse text-white text-sm" />
          </div>
          {sidebarOpen && <span className="font-bold text-lg tracking-tight">MediTrack</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ group, items }) => {
            const visible = items.filter(canSee);
            if (visible.length === 0) return null;

            return (
              <div key={group ?? '__top'} className="mb-1">
                {/* Group label */}
                {group && sidebarOpen && (
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-3 pt-3 pb-1">
                    {group}
                  </p>
                )}
                {visible.map(({ to, icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                    title={!sidebarOpen ? label : undefined}
                  >
                    <i className={`bi ${icon} text-base flex-shrink-0`} />
                    {sidebarOpen && <span>{label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-700/60 px-3 py-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <span className={`text-xs text-white px-1.5 py-0.5 rounded font-medium ${roleBadge.cls}`}>
                  {roleBadge.label}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                <i className="bi bi-box-arrow-right" />
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="w-full flex justify-center rounded-lg bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
            >
              <i className="bi bi-box-arrow-right" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 md:px-6">
          <button onClick={() => setSidebarOpen(v => !v)}
            className="text-gray-500 hover:text-gray-700 transition-colors">
            <i className="bi bi-list text-xl" />
          </button>

          {/* Global search */}
          <div ref={searchRef} className="relative hidden sm:flex flex-1 max-w-sm">
            <div className="relative w-full">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search medicines, customers, sales…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {searchLoading && <i className="bi bi-arrow-clockwise animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />}
            </div>
            {searchResults && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
                {(() => {
                  const medicines = searchResults.medicines ?? [];
                  const customers = searchResults.customers ?? [];
                  const sales     = searchResults.sales ?? [];
                  const total = medicines.length + customers.length + sales.length;
                  if (total === 0) return <p className="px-4 py-3 text-sm text-gray-400">No results found.</p>;
                  return (
                    <>
                      {medicines.length > 0 && (
                        <>
                          <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Medicines</p>
                          {medicines.slice(0, 4).map(m => (
                            <button key={m.id} onClick={() => { navigate('/medicines'); setSearchResults(null); setSearchQuery(''); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <i className="bi bi-capsule text-blue-500" />{m.name}
                            </button>
                          ))}
                        </>
                      )}
                      {customers.length > 0 && (
                        <>
                          <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Customers</p>
                          {customers.slice(0, 3).map(c => (
                            <button key={c.id} onClick={() => { navigate('/customers'); setSearchResults(null); setSearchQuery(''); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <i className="bi bi-person text-purple-500" />{c.name}
                            </button>
                          ))}
                        </>
                      )}
                      {sales.length > 0 && (
                        <>
                          <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Sales</p>
                          {sales.slice(0, 3).map(s => (
                            <button key={s.id} onClick={() => { navigate('/sales'); setSearchResults(null); setSearchQuery(''); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <i className="bi bi-receipt text-green-500" />Sale #{s.id}
                            </button>
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex-1 sm:flex-none" />

          {/* Role chip */}
          <span className={`hidden sm:inline-flex text-xs font-semibold text-white px-2.5 py-1 rounded-full ${roleBadge.cls}`}>
            {roleBadge.label}
          </span>

          {/* Notification bell */}
          <NavLink to="/notifications" className="relative text-gray-500 hover:text-gray-700 transition-colors p-1">
            <i className="bi bi-bell text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-100"
          >
            <i className="bi bi-box-arrow-right" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          <NavLink to="/profile" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
          </NavLink>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900">Confirm logout</h2>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to sign out? Your current session will end, but you can log in again anytime.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelLogout}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
