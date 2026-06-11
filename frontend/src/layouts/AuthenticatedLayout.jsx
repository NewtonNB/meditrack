import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const navItems = [
  { to: '/dashboard',       icon: 'bi-speedometer2',    label: 'Dashboard' },
  { to: '/medicines',       icon: 'bi-capsule',          label: 'Medicines' },
  { to: '/sales',           icon: 'bi-receipt',          label: 'Sales' },
  { to: '/pos',             icon: 'bi-cart3',            label: 'POS' },
  { to: '/purchases',       icon: 'bi-bag-check',        label: 'Purchases' },
  { to: '/customers',       icon: 'bi-people',           label: 'Customers' },
  { to: '/suppliers',       icon: 'bi-building',         label: 'Suppliers' },
  { to: '/inventory',       icon: 'bi-boxes',            label: 'Inventory' },
  { to: '/stock-movements', icon: 'bi-arrow-left-right', label: 'Stock Movements' },
  { to: '/reports',         icon: 'bi-bar-chart',        label: 'Reports' },
  { to: '/analytics',       icon: 'bi-graph-up',         label: 'Analytics' },
  { to: '/automation',      icon: 'bi-robot',            label: 'Automation' },
  { to: '/system-overview', icon: 'bi-diagram-3',       label: 'System Overview' },
  { to: '/notifications',   icon: 'bi-bell',             label: 'Notifications' },
  { to: '/audit-logs',      icon: 'bi-shield-check',     label: 'Audit Logs' },
  { to: '/profile',         icon: 'bi-person',           label: 'Profile' },
  { to: '/users',           icon: 'bi-person-gear',      label: 'Users' },
  { to: '/settings',        icon: 'bi-gear',             label: 'Settings' },
];

export default function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="bi bi-heart-pulse text-white text-sm" />
          </div>
          {sidebarOpen && <span className="font-bold text-lg tracking-tight">MediTrack</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <i className={`bi ${icon} text-base flex-shrink-0`} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-700 px-4 py-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role}</p>
              </div>
              <button onClick={handleLogout} title="Logout" className="text-gray-400 hover:text-white">
                <i className="bi bi-box-arrow-right" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-gray-400 hover:text-white">
              <i className="bi bi-box-arrow-right" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="bi bi-list text-xl" />
          </button>
          <div className="flex-1" />
          <NavLink to="/profile" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-sm font-medium">{user?.name}</span>
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
