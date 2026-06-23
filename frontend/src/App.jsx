import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages
import Login    from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Layout
import AuthenticatedLayout from './layouts/AuthenticatedLayout';

// Pages
import Dashboard      from './pages/Dashboard';
import Medicines      from './pages/Medicines';
import Sales          from './pages/Sales';
import Purchases      from './pages/Purchases';
import Customers      from './pages/Customers';
import Suppliers      from './pages/Suppliers';
import Inventory      from './pages/Inventory';
import StockMovements from './pages/StockMovements';
import POS            from './pages/POS';
import Reports        from './pages/Reports';
import Analytics      from './pages/Analytics';
import AuditLogs      from './pages/AuditLogs';
import Notifications  from './pages/Notifications';
import Settings       from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Profile        from './pages/Profile';
import Automation     from './pages/Automation';
import SystemOverview from './pages/SystemOverview';
import NotFound       from './pages/NotFound';
import Forbidden      from './pages/Forbidden';

// ── Guards ────────────────────────────────────────────────────────────────────

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen gap-2 text-gray-400">
      <i className="bi bi-arrow-clockwise animate-spin text-xl" /> Loading…
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

/**
 * Renders children when user has the required permission/role, otherwise shows <Forbidden />.
 * permission  – single string
 * permissions – array (any match)
 * roles       – array (any match)
 */
function RequirePermission({ permission, permissions, roles, children }) {
  const { hasPermission, hasAnyPermission, user } = useAuth();

  const ok = (() => {
    if (permission  && !hasPermission(permission))        return false;
    if (permissions && !hasAnyPermission(...permissions)) return false;
    if (roles       && !roles.includes(user?.role))       return false;
    return true;
  })();

  return ok ? children : <Forbidden />;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* ── Guest ──────────────────────────────────────────────────────── */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── Protected ──────────────────────────────────────────────────── */}
      <Route element={<PrivateRoute><AuthenticatedLayout /></PrivateRoute>}>

        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* All logged-in users */}
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/profile"       element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* POS — cashiers, pharmacists, admins */}
        <Route path="/pos" element={
          <RequirePermission permission="process_sales">
            <POS />
          </RequirePermission>
        } />

        {/* Sales — process_sales */}
        <Route path="/sales" element={
          <RequirePermission permission="process_sales">
            <Sales />
          </RequirePermission>
        } />

        {/* Medicines — all staff can view */}
        <Route path="/medicines" element={<Medicines />} />

        {/* Purchases — manage_purchases */}
        <Route path="/purchases" element={
          <RequirePermission permission="manage_purchases">
            <Purchases />
          </RequirePermission>
        } />

        {/* Customers — manage_customers or process_sales */}
        <Route path="/customers" element={
          <RequirePermission permissions={['manage_customers', 'process_sales']}>
            <Customers />
          </RequirePermission>
        } />

        {/* Suppliers — manage_suppliers */}
        <Route path="/suppliers" element={
          <RequirePermission permission="manage_suppliers">
            <Suppliers />
          </RequirePermission>
        } />

        {/* Inventory — manage_medicines */}
        <Route path="/inventory" element={
          <RequirePermission permission="manage_medicines">
            <Inventory />
          </RequirePermission>
        } />

        {/* Stock Movements — manage_medicines */}
        <Route path="/stock-movements" element={
          <RequirePermission permission="manage_medicines">
            <StockMovements />
          </RequirePermission>
        } />

        {/* Reports — view_reports */}
        <Route path="/reports" element={
          <RequirePermission permission="view_reports">
            <Reports />
          </RequirePermission>
        } />

        {/* Analytics — view_reports */}
        <Route path="/analytics" element={
          <RequirePermission permission="view_reports">
            <Analytics />
          </RequirePermission>
        } />

        {/* Automation — manage_medicines or view_reports */}
        <Route path="/automation" element={
          <RequirePermission permissions={['manage_medicines', 'view_reports']}>
            <Automation />
          </RequirePermission>
        } />

        {/* Audit Logs — view_audit_logs */}
        <Route path="/audit-logs" element={
          <RequirePermission permission="view_audit_logs">
            <AuditLogs />
          </RequirePermission>
        } />

        {/* System Overview — super_admin or pharmacy_admin */}
        <Route path="/system-overview" element={
          <RequirePermission roles={['super_admin', 'pharmacy_admin']}>
            <SystemOverview />
          </RequirePermission>
        } />

        {/* Settings — pharmacy_admin or super_admin */}
        <Route path="/settings" element={
          <RequirePermission roles={['super_admin', 'pharmacy_admin']}>
            <Settings />
          </RequirePermission>
        } />

        {/* User Management — manage_users */}
        <Route path="/users" element={
          <RequirePermission permission="manage_users">
            <UserManagement />
          </RequirePermission>
        } />

      </Route>

      {/* ── Fallback ───────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
