import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages
import Login    from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Layout
import AuthenticatedLayout from './layouts/AuthenticatedLayout';

// Main pages
import Dashboard        from './pages/Dashboard';
import Medicines        from './pages/Medicines';
import Sales            from './pages/Sales';
import Purchases        from './pages/Purchases';
import Customers        from './pages/Customers';
import Suppliers        from './pages/Suppliers';
import Inventory        from './pages/Inventory';
import StockMovements   from './pages/StockMovements';
import POS              from './pages/POS';
import Reports          from './pages/Reports';
import Analytics        from './pages/Analytics';
import AuditLogs        from './pages/AuditLogs';
import Notifications    from './pages/Notifications';
import Settings         from './pages/Settings';
import UserManagement   from './pages/UserManagement';
import Profile          from './pages/Profile';
import Automation       from './pages/Automation';
import SystemOverview   from './pages/SystemOverview';
import NotFound         from './pages/NotFound';

// Route guard — redirects unauthenticated users to /login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

// Route guard — redirects logged-in users away from auth pages
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Guest routes ─────────────────────────────────────────────── */}
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* ── Protected routes ─────────────────────────────────────────── */}
      <Route
        element={
          <PrivateRoute>
            <AuthenticatedLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/medicines"       element={<Medicines />} />
        <Route path="/sales"           element={<Sales />} />
        <Route path="/purchases"       element={<Purchases />} />
        <Route path="/customers"       element={<Customers />} />
        <Route path="/suppliers"       element={<Suppliers />} />
        <Route path="/inventory"       element={<Inventory />} />
        <Route path="/stock-movements" element={<StockMovements />} />
        <Route path="/pos"             element={<POS />} />
        <Route path="/reports"         element={<Reports />} />
        <Route path="/analytics"       element={<Analytics />} />
        <Route path="/audit-logs"      element={<AuditLogs />} />
        <Route path="/notifications"   element={<Notifications />} />
        <Route path="/settings"        element={<Settings />} />
        <Route path="/users"           element={<UserManagement />} />
        <Route path="/profile"         element={<Profile />} />
        <Route path="/automation"      element={<Automation />} />
        <Route path="/system-overview" element={<SystemOverview />} />
      </Route>

      {/* ── Fallback ──────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
