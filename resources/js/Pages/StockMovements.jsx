import React from 'react';
import { Head, usePage, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { useRealTimeUpdates } from '@/Hooks/useRealTimeUpdates';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function StockMovements() {
  const { props } = usePage();

  // Permission checks
  const canManage = props.canManage || false;
  const canViewCosts = props.canViewCosts || false;
  const userRole = props.auth?.user?.role || 'cashier';
  const canManageStock = canManage || ['pharmacist', 'pharmacy_admin', 'super_admin'].includes(userRole);

  // Get REAL data from server (no dummy data)
  const stockMovementsData = props.stockMovements?.data || props.stockMovements || [];
  const medicines = props.medicines || [];
  const serverStats = props.stats || {};
  const filters = props.filters || {};
  const pagination = props.stockMovements?.links || null;

  // Use ONLY real server data
  const serverMovements = stockMovementsData;

  const [query, setQuery] = React.useState(filters.search || '');
  const [typeFilter, setTypeFilter] = React.useState(filters.type || '');
  const [dateFrom, setDateFrom] = React.useState(filters.date_from || '');
  const [dateTo, setDateTo] = React.useState(filters.date_to || '');
  const [perPage, setPerPage] = React.useState(filters.per_page || 10);
  const [page, setPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState('date');
  const [sortOrder, setSortOrder] = React.useState('desc');
  const [isLoading, setIsLoading] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  // Use real-time updates hook
  useRealTimeUpdates({
    pageName: 'stock-movements',
    dataKeys: ['stockMovements'],
    onUpdate: (eventType, data) => {
      console.log(`StockMovements page updated due to: ${eventType}`, JSON.stringify(data));
    }
  });
  const [viewMode, setViewMode] = React.useState('table'); // 'table' or 'cards'
  const [lastUpdateTime, setLastUpdateTime] = React.useState(new Date());
  const [newMovementsCount, setNewMovementsCount] = React.useState(0);

  // Track previous movements count for new movement detection
  const [previousMovementsCount, setPreviousMovementsCount] = React.useState(serverMovements.length);

  React.useEffect(() => {
    // Check for new movements
    if (serverMovements.length > previousMovementsCount) {
      setNewMovementsCount(serverMovements.length - previousMovementsCount);
      // Clear the notification after 5 seconds
      setTimeout(() => setNewMovementsCount(0), 5000);
    }
    setPreviousMovementsCount(serverMovements.length);
  }, [serverMovements.length]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsLoading(true);
      setLastUpdateTime(new Date());
      // Actually refresh the data from server
      router.reload({ 
        only: ['stockMovements', 'stats'],
        preserveState: true,
        preserveScroll: true,
        onFinish: () => setIsLoading(false)
      });
    }, 10000); // Refresh every 10 seconds for real-time updates
    return () => clearInterval(interval);
  }, []);

  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [selectedMove, setSelectedMove] = React.useState(null);
  const [selectedMedicine, setSelectedMedicine] = React.useState(null);

  const createForm = useForm({
    medicine_id: '',
    movement_type: 'in',
    quantity: 0,
    unit_cost: '',
    reference: '',
    notes: '',
    expiry_date: '',
    batch_number: '',
    warehouse_id: 1,
  });

  const adjustForm = useForm({
    medicine_id: '',
    adjustment_type: 'add',
    quantity: 0,
    reason: '',
    notes: '',
    warehouse_id: 1,
  });

  const editForm = useForm({
    medicine_id: '',
    movement_type: 'in',
    quantity: 0,
    unit_cost: '',
    reference: '',
    notes: '',
    expiry_date: '',
    batch_number: '',
    warehouse_id: 1,
  });

  // Handle filter changes with server-side filtering
  const handleFilterChange = () => {
    router.get(route('stock-movements.index'), {
      search: query,
      type: typeFilter,
      date_from: dateFrom,
      date_to: dateTo,
      per_page: perPage,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== filters.search) {
        handleFilterChange();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = serverMovements.filter(m => {
      if (q) {
        const medicineName = typeof m.medicine === 'string' ? m.medicine : m.medicine?.name || '';
        const hay = `${medicineName} ${m.reference ?? ''} ${m.notes ?? m.note ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (typeFilter) {
        if (typeFilter === 'sales') {
          // Show only sales-related movements
          if (!m.reference?.includes('SALE-') && !m.reference?.includes('POS-SALE-')) return false;
        } else {
          // Regular type filtering
          if (m.movement_type !== typeFilter && m.type?.toLowerCase() !== typeFilter) return false;
        }
      }
      if (dateFrom && new Date(m.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(m.created_at) > new Date(dateTo)) return false;
      return true;
    });

    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'medicine':
          aVal = typeof a.medicine === 'string' ? a.medicine : a.medicine?.name || '';
          bVal = typeof b.medicine === 'string' ? b.medicine : b.medicine?.name || '';
          break;
        case 'quantity':
          aVal = Number(a.quantity || 0);
          bVal = Number(b.quantity || 0);
          break;
        case 'type':
          aVal = a.movement_type || a.type || '';
          bVal = b.movement_type || b.type || '';
          break;
        default:
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return result;
  }, [serverMovements, query, typeFilter, dateFrom, dateTo, sortBy, sortOrder]);

  // Use ONLY real statistics from server
  const totalIn = serverStats.total_in || 0;
  const totalOut = serverStats.total_out || 0; // Already made positive in backend
  const totalAdjustments = serverStats.total_adjustments || 0; // Already made positive in backend

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const exportCSV = (list = filtered) => {
    const headers = ['Date', 'Medicine', 'Type', 'Quantity', 'Reference', 'Note'];
    const rows = list.map(r => [
      new Date(r.created_at).toLocaleDateString(),
      typeof r.medicine === 'string' ? r.medicine : r.medicine?.name || '',
      r.movement_type || r.type,
      r.quantity,
      r.reference ?? '',
      r.notes ?? r.note ?? '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_movements_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetails = m => {
    setSelectedMove(m);
    setIsDetailOpen(true);
  };

  const openEdit = m => {
    setSelectedMove(m);
    editForm.setData({
      medicine_id: m.medicine_id || '',
      movement_type: m.movement_type || m.type || 'in',
      quantity: Math.abs(m.quantity || 0),
      unit_cost: m.unit_cost || '',
      reference: m.reference || '',
      notes: m.notes || m.note || '',
      expiry_date: m.expiry_date || '',
      batch_number: m.batch_number || '',
      warehouse_id: m.warehouse_id || 1,
    });
    setIsEditOpen(true);
  };

  // Get current stock for selected medicine
  React.useEffect(() => {
    if (adjustForm.data.medicine_id) {
      const medicine = medicines.find(m => m.id == adjustForm.data.medicine_id);
      setSelectedMedicine(medicine);
    } else {
      setSelectedMedicine(null);
    }
  }, [adjustForm.data.medicine_id, medicines]);

  // Calculate preview for stock adjustment
  const getAdjustmentPreview = () => {
    if (!selectedMedicine || !adjustForm.data.quantity) return null;
    
    const currentStock = selectedMedicine.stock || 0;
    const quantity = Number(adjustForm.data.quantity);
    
    let newStock = currentStock;
    switch (adjustForm.data.adjustment_type) {
      case 'add':
        newStock = currentStock + quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, currentStock - quantity);
        break;
      case 'set':
        newStock = quantity;
        break;
    }
    
    return {
      current: currentStock,
      new: newStock,
      change: newStock - currentStock
    };
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">Stock Movements</h2>
      }
    >
      <Head>
        <title>Stock Movements - MediTrack</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div 
        className={`min-h-screen transition-all duration-500 ${
          darkMode 
            ? 'bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900' 
            : 'bg-gradient-to-br from-accent-50 via-primary-50 to-neutral-50'
        }`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${darkMode ? 'bg-purple-500/10' : 'bg-blue-300/20'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute top-3/4 right-1/4 w-96 h-96 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-300/20'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }}></div>
          <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${darkMode ? 'bg-blue-500/10' : 'bg-purple-300/20'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '0.5s' }}></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Flash Messages */}
          {props.flash?.success && (
            <div className="mb-6 animate-fade-in">
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-green-500/20' : 'bg-green-50'} border-2 ${darkMode ? 'border-green-400/30' : 'border-green-200'} rounded-2xl p-4 shadow-lg`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-green-500/30' : 'bg-green-100'} flex items-center justify-center`}>
                    <i className={`bi bi-check-circle-fill text-xl ${darkMode ? 'text-green-300' : 'text-green-600'}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                      {props.flash.success}
                    </p>
                  </div>
                  <button
                    onClick={() => router.reload({ only: [] })}
                    className={`${darkMode ? 'text-green-300 hover:text-green-200' : 'text-green-600 hover:text-green-800'}`}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Movements Notification */}
          {newMovementsCount > 0 && (
            <div className="mb-6 animate-fade-in">
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'} border-2 ${darkMode ? 'border-blue-400/30' : 'border-blue-200'} rounded-2xl p-4 shadow-lg`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-blue-500/30' : 'bg-blue-100'} flex items-center justify-center animate-pulse`}>
                    <i className={`bi bi-arrow-left-right text-xl ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                      {newMovementsCount} new stock movement{newMovementsCount > 1 ? 's' : ''} detected!
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                      Recent sales and inventory changes have been automatically recorded.
                    </p>
                  </div>
                  <button
                    onClick={() => setNewMovementsCount(0)}
                    className={`${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'}`}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {props.flash?.error && (
            <div className="mb-6 animate-fade-in">
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-red-500/20' : 'bg-red-50'} border-2 ${darkMode ? 'border-red-400/30' : 'border-red-200'} rounded-2xl p-4 shadow-lg`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-red-500/30' : 'bg-red-100'} flex items-center justify-center`}>
                    <i className={`bi bi-exclamation-triangle-fill text-xl ${darkMode ? 'text-red-300' : 'text-red-600'}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                      {props.flash.error}
                    </p>
                  </div>
                  <button
                    onClick={() => router.reload({ only: [] })}
                    className={`${darkMode ? 'text-red-300 hover:text-red-200' : 'text-red-600 hover:text-red-800'}`}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stunning Header Section */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-3xl p-8 mb-8 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-2xl`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className={`relative w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-500 via-primary-500 to-primary-600 flex items-center justify-center shadow-2xl group`}>
                  <i className="bi bi-arrow-left-right text-3xl text-white"></i>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                </div>
                <div>
                  <h1 className={`text-5xl font-black mb-2 ${darkMode ? 'bg-gradient-to-r from-accent-400 via-primary-400 to-primary-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-accent-600 via-primary-600 to-primary-600 bg-clip-text text-transparent'}`}>
                    Stock Movements
                  </h1>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                    Real-time inventory tracking and movement analytics
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${canManageStock ? (darkMode ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-green-100 text-green-700 border border-green-200') : (darkMode ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30' : 'bg-orange-100 text-orange-700 border border-orange-200')}`}>
                      <i className={`bi ${canManageStock ? 'bi-shield-check' : 'bi-eye-fill'}`}></i>
                      <span className="text-sm font-semibold">
                        {canManageStock ? 'Full Management Access' : 'View Only Mode'}
                      </span>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${darkMode ? 'bg-white/10 text-gray-300 border border-white/20' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                      <span className="text-sm font-medium">Role: {userRole}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-400/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold">Live Sync</span>
                    </div>
                    {newMovementsCount > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 animate-bounce">
                        <i className="bi bi-bell-fill"></i>
                        <span className="text-sm font-semibold">{newMovementsCount} New Movement{newMovementsCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <div className={`px-4 py-2 rounded-full ${darkMode ? 'bg-white/10 text-gray-300 border border-white/20' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                      <span className="text-sm font-medium">
                        Last updated: {lastUpdateTime.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className={`flex items-center gap-1 p-1 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'table'
                        ? darkMode ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-blue-600 shadow-md'
                        : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <i className="bi bi-table"></i>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'cards'
                        ? darkMode ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-blue-600 shadow-md'
                        : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <i className="bi bi-grid-3x3-gap"></i>
                  </button>
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    darkMode 
                      ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-400/30' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <i className={`bi ${darkMode ? 'bi-sun-fill' : 'bi-moon-fill'} text-xl`}></i>
                </button>
                
                {/* Refresh Button */}
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setLastUpdateTime(new Date());
                    router.reload({ 
                      only: ['stockMovements', 'stats'],
                      onFinish: () => setIsLoading(false)
                    });
                  }}
                  className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                    darkMode 
                      ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-400/30' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-200'
                  } ${isLoading ? 'animate-pulse' : ''}`}
                  title="Refresh stock movements"
                >
                  <i className={`bi bi-arrow-clockwise text-lg ${isLoading ? 'animate-spin' : ''}`}></i>
                  <span className="text-sm font-semibold">Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stock In Card */}
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-400/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50'} rounded-3xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105`}>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${darkMode ? 'bg-green-500/30' : 'bg-green-100'} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`bi bi-arrow-down-circle text-2xl ${darkMode ? 'text-green-300' : 'text-green-600'}`}></i>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'} text-xs font-bold`}>
                    <i className="bi bi-arrow-up mr-1"></i>+12%
                  </div>
                </div>
                <div className={`text-sm font-semibold ${darkMode ? 'text-green-300' : 'text-green-600'} mb-2 uppercase tracking-wide`}>
                  Stock In
                </div>
                <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {totalIn.toLocaleString()}
                </div>
                <div className={`text-sm ${darkMode ? 'text-green-200' : 'text-green-600'} flex items-center gap-2`}>
                  <i className="bi bi-box-seam"></i>
                  <span>Incoming inventory</span>
                </div>
              </div>
            </div>

            {/* Stock Out Card */}
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-red-500/20 to-pink-600/20 border-red-400/30' : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200/50'} rounded-3xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105`}>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${darkMode ? 'bg-red-500/30' : 'bg-red-100'} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`bi bi-arrow-up-circle text-2xl ${darkMode ? 'text-red-300' : 'text-red-600'}`}></i>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'} text-xs font-bold`}>
                    <i className="bi bi-arrow-down mr-1"></i>-8%
                  </div>
                </div>
                <div className={`text-sm font-semibold ${darkMode ? 'text-red-300' : 'text-red-600'} mb-2 uppercase tracking-wide`}>
                  Stock Out
                </div>
                <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {totalOut.toLocaleString()}
                </div>
                <div className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-600'} flex items-center gap-2`}>
                  <i className="bi bi-cart-check"></i>
                  <span>Outgoing sales</span>
                </div>
              </div>
            </div>

            {/* Adjustments Card */}
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-orange-500/20 to-amber-600/20 border-orange-400/30' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/50'} rounded-3xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105`}>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${darkMode ? 'bg-orange-500/30' : 'bg-orange-100'} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`bi bi-exclamation-triangle text-2xl ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}></i>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'} text-xs font-bold`}>
                    <i className="bi bi-dash mr-1"></i>-3%
                  </div>
                </div>
                <div className={`text-sm font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-600'} mb-2 uppercase tracking-wide`}>
                  Adjustments
                </div>
                <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {totalAdjustments.toLocaleString()}
                </div>
                <div className={`text-sm ${darkMode ? 'text-orange-200' : 'text-orange-600'} flex items-center gap-2`}>
                  <i className="bi bi-plus-minus"></i>
                  <span>Manual corrections</span>
                </div>
              </div>
            </div>

            {/* Net Change Card */}
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-accent-500/20 to-primary-600/20 border-accent-400/30' : 'bg-gradient-to-br from-accent-50 to-primary-50 border-accent-200/50'} rounded-3xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105`}>
              <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${darkMode ? 'bg-blue-500/30' : 'bg-blue-100'} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`bi bi-graph-up-arrow text-2xl ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}></i>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${(totalIn - totalOut) >= 0 ? (darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700')} text-xs font-bold`}>
                    <i className={`bi ${(totalIn - totalOut) >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'} mr-1`}></i>
                    {(totalIn - totalOut) >= 0 ? 'Positive' : 'Negative'}
                  </div>
                </div>
                <div className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-600'} mb-2 uppercase tracking-wide`}>
                  Net Change
                </div>
                <div className={`text-4xl font-black mb-2 ${(totalIn - totalOut) >= 0 ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                  {(totalIn - totalOut) >= 0 ? '+' : ''}{(totalIn - totalOut).toLocaleString()}
                </div>
                <div className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-600'} flex items-center gap-2`}>
                  <i className="bi bi-bar-chart"></i>
                  <span>Overall balance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 mb-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {canManageStock ? (
                  <>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Add Movement</span>
                    </button>
                    <button
                      onClick={() => setIsAdjustOpen(true)}
                      className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 ${
                        darkMode 
                          ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <i className="bi bi-sliders"></i>
                      <span>Stock Adjustment</span>
                    </button>
                  </>
                ) : (
                  <div className={`px-6 py-3 rounded-xl border ${darkMode ? 'bg-yellow-500/10 border-yellow-400/30 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-exclamation-triangle"></i>
                      <span className="text-sm font-medium">View-only access. Contact admin for permissions.</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => exportCSV()}
                  className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 ${
                    darkMode 
                      ? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30' 
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  <i className="bi bi-download"></i>
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => {
                    setQuery('');
                    setTypeFilter('');
                    setDateFrom('');
                    setDateTo('');
                    setPage(1);
                  }}
                  className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 ${
                    darkMode 
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-x-circle"></i>
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 mb-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search medicine, reference, notes..."
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    className={`w-full py-3 pl-12 pr-4 rounded-xl border ${
                      darkMode 
                        ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                  />
                  <i className={`bi bi-search absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={e => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                    router.get(route('stock-movements.index'), {
                      search: query,
                      type: e.target.value,
                      date_from: dateFrom,
                      date_to: dateTo,
                      per_page: perPage,
                    }, {
                      preserveState: true,
                      preserveScroll: true,
                    });
                  }}
                  className={`w-full py-3 px-4 rounded-xl border ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                >
                  <option value="">All Types</option>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="sales">Sales Only</option>
                  <option value="adjustment">Adjustments</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className={`w-full py-3 px-4 rounded-xl border ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                >
                  <option value="date">Sort by Date</option>
                  <option value="medicine">Sort by Medicine</option>
                  <option value="quantity">Sort by Quantity</option>
                  <option value="type">Sort by Type</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => {
                    setDateFrom(e.target.value);
                    setPage(1);
                    router.get(route('stock-movements.index'), {
                      search: query,
                      type: typeFilter,
                      date_from: e.target.value,
                      date_to: dateTo,
                      per_page: perPage,
                    }, {
                      preserveState: true,
                      preserveScroll: true,
                    });
                  }}
                  className={`w-full py-3 px-4 rounded-xl border ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                />
              </div>

              {/* Date To */}
              <div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => {
                    setDateTo(e.target.value);
                    setPage(1);
                    router.get(route('stock-movements.index'), {
                      search: query,
                      type: typeFilter,
                      date_from: dateFrom,
                      date_to: e.target.value,
                      per_page: perPage,
                    }, {
                      preserveState: true,
                      preserveScroll: true,
                    });
                  }}
                  className={`w-full py-3 px-4 rounded-xl border ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                />
              </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Showing <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{paged.length}</span> of{' '}
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{filtered.length}</span> movements
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Per page:</span>
                <select
                  value={perPage}
                  onChange={e => {
                    const newPerPage = Number(e.target.value);
                    setPerPage(newPerPage);
                    setPage(1);
                    router.get(route('stock-movements.index'), {
                      search: query,
                      type: typeFilter,
                      date_from: dateFrom,
                      date_to: dateTo,
                      per_page: newPerPage,
                    }, {
                      preserveState: true,
                      preserveScroll: true,
                    });
                  }}
                  className={`py-2 px-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`p-2 rounded-lg ${
                    darkMode 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border ${darkMode ? 'border-white/20' : 'border-gray-200'} transition-all duration-300`}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <i className={`bi bi-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' && (
            <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className={`${darkMode ? 'bg-white/5' : 'bg-gradient-to-r from-accent-50 to-primary-50'}`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-accent-300' : 'text-accent-700'} uppercase tracking-wider`}>
                        Date & Time
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-accent-300' : 'text-accent-700'} uppercase tracking-wider`}>
                        Medicine
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} uppercase tracking-wider`}>
                        Type
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} uppercase tracking-wider`}>
                        Quantity
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} uppercase tracking-wider`}>
                        Reference
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} uppercase tracking-wider`}>
                        Customer
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} uppercase tracking-wider`}>
                        User
                      </th>
                      <th className={`px-6 py-4 text-right text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} uppercase tracking-wider`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-100'}`}>
                    {paged.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <i className={`bi bi-inbox text-6xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                            <div>
                              <p className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                No stock movements found
                              </p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                Try adjusting your filters or add a new movement
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paged.map((move, index) => {
                        const movementType = move.movement_type || move.type?.toLowerCase() || 'unknown';
                        const medicineName = typeof move.medicine === 'string' ? move.medicine : move.medicine?.name || 'Unknown Medicine';
                        const medicineBrand = typeof move.medicine === 'object' ? move.medicine?.brand : '';

                        return (
                        <tr 
                          key={move.id} 
                          className={`group transition-all duration-300 ${
                            darkMode 
                              ? 'hover:bg-white/5' 
                              : 'hover:bg-gradient-to-r hover:from-accent-50/50 hover:to-primary-50/50'
                          } ${
                            // Highlight recent sales (within last 5 minutes)
                            move.reference?.includes('SALE-') && new Date(move.created_at) > new Date(Date.now() - 5 * 60 * 1000)
                              ? darkMode 
                                ? 'bg-green-500/10 border-l-4 border-green-400' 
                                : 'bg-green-50 border-l-4 border-green-500'
                              : ''
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {new Date(move.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                              <i className="bi bi-clock"></i>
                              {new Date(move.created_at).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {medicineName}
                            </div>
                            {medicineBrand && (
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                                <i className="bi bi-building"></i>
                                {medicineBrand}
                              </div>
                            )}
                            {move.batch_number && (
                              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                                Batch: {move.batch_number}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                                movementType === 'in' 
                                  ? darkMode ? 'bg-green-500/20 text-green-300 border-green-400/30' : 'bg-green-100 text-green-700 border-green-200'
                                  : movementType === 'out' 
                                  ? darkMode ? 'bg-red-500/20 text-red-300 border-red-400/30' : 'bg-red-100 text-red-700 border-red-200'
                                  : movementType === 'adjustment' 
                                  ? darkMode ? 'bg-orange-500/20 text-orange-300 border-orange-400/30' : 'bg-orange-100 text-orange-700 border-orange-200'
                                  : movementType === 'expired' 
                                  ? darkMode ? 'bg-gray-500/20 text-gray-300 border-gray-400/30' : 'bg-gray-100 text-gray-700 border-gray-200'
                                  : darkMode ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'bg-blue-100 text-blue-700 border-blue-200'
                              }`}>
                                <i className={`bi ${
                                  movementType === 'in' ? 'bi-arrow-down-circle' :
                                  movementType === 'out' ? 'bi-arrow-up-circle' :
                                  movementType === 'adjustment' ? 'bi-sliders' :
                                  movementType === 'expired' ? 'bi-clock-history' :
                                  'bi-question-circle'
                                } mr-1.5`}></i>
                                {movementType.charAt(0).toUpperCase() + movementType.slice(1)}
                              </span>
                              {/* Recent Sale Badge */}
                              {move.reference?.includes('SALE-') && new Date(move.created_at) > new Date(Date.now() - 5 * 60 * 1000) && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold animate-pulse ${
                                  darkMode ? 'bg-blue-500/30 text-blue-200' : 'bg-blue-200 text-blue-800'
                                }`}>
                                  <i className="bi bi-lightning-fill mr-1"></i>
                                  New Sale
                                </span>
                              )}
                              {/* POS Sale Badge */}
                              {move.reference?.includes('POS-SALE-') && (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                  darkMode ? 'bg-purple-500/30 text-purple-200' : 'bg-purple-200 text-purple-800'
                                }`}>
                                  <i className="bi bi-credit-card mr-1"></i>
                                  POS
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-lg font-black ${
                              (move.quantity || 0) >= 0
                                ? darkMode ? 'text-green-400' : 'text-green-600'
                                : darkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                              {(move.quantity || 0) >= 0 ? '+' : ''}{move.quantity || 0}
                            </div>
                            {move.unit_cost && canViewCosts && (
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                UGX {Number(move.unit_cost).toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {move.reference || '-'}
                            </div>
                            {move.notes && (
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 line-clamp-1`}>
                                {move.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {/* Customer Information for Sale-related movements */}
                            {(move.reference?.includes('SALE-') || move.reference?.includes('POS-SALE-')) ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}>
                                  <i className={`bi bi-person-check text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}></i>
                                </div>
                                <div>
                                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {move.sale?.customer?.name || 
                                     (move.notes?.includes(' to ') ? move.notes.split(' to ')[1] : '') ||
                                     'Walk-in Customer'}
                                  </div>
                                  {move.sale?.customer?.phone && (
                                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {move.sale?.customer?.phone}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} italic`}>
                                -
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                                <i className={`bi bi-person text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}></i>
                              </div>
                              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {move.user?.name || move.creator?.name || 'System'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => openDetails(move)}
                                className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                                  darkMode 
                                    ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-400/30' 
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                                }`}
                                title="View Details"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              {canManageStock && (
                                <button
                                  onClick={() => openEdit(move)}
                                  className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                                    darkMode 
                                      ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-400/30' 
                                      : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
                                  }`}
                                  title="Edit Movement"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((move, index) => {
                const movementType = move.movement_type || move.type?.toLowerCase() || 'unknown';
                const medicineName = typeof move.medicine === 'string' ? move.medicine : move.medicine?.name || 'Unknown Medicine';
                const medicineBrand = typeof move.medicine === 'object' ? move.medicine?.brand : '';

                return (
                  <div
                    key={move.id}
                    className={`group backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl ${
                        movementType === 'in' 
                          ? darkMode ? 'bg-green-500/20' : 'bg-green-100'
                          : movementType === 'out' 
                          ? darkMode ? 'bg-red-500/20' : 'bg-red-100'
                          : movementType === 'adjustment' 
                          ? darkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                          : darkMode ? 'bg-gray-500/20' : 'bg-gray-100'
                      } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <i className={`bi ${
                          movementType === 'in' ? 'bi-arrow-down-circle' :
                          movementType === 'out' ? 'bi-arrow-up-circle' :
                          movementType === 'adjustment' ? 'bi-sliders' :
                          'bi-clock-history'
                        } text-xl ${
                          movementType === 'in' 
                            ? darkMode ? 'text-green-300' : 'text-green-600'
                            : movementType === 'out' 
                            ? darkMode ? 'text-red-300' : 'text-red-600'
                            : movementType === 'adjustment' 
                            ? darkMode ? 'text-orange-300' : 'text-orange-600'
                            : darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}></i>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        movementType === 'in' 
                          ? darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                          : movementType === 'out' 
                          ? darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                          : movementType === 'adjustment' 
                          ? darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
                          : darkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {movementType.charAt(0).toUpperCase() + movementType.slice(1)}
                      </span>
                    </div>

                    {/* Medicine Info */}
                    <div className="mb-4">
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                        {medicineName}
                      </h3>
                      {medicineBrand && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1`}>
                          <i className="bi bi-building"></i>
                          {medicineBrand}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="mb-4">
                      <div className={`text-3xl font-black ${
                        movementType === 'in' 
                          ? darkMode ? 'text-green-400' : 'text-green-600'
                          : darkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {movementType === 'in' ? '+' : '-'}{Math.abs(move.quantity || 0)}
                      </div>
                      {move.unit_cost && canViewCosts && (
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                          UGX {Number(move.unit_cost).toLocaleString()} per unit
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className={`space-y-2 mb-4 pb-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reference:</span>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {move.reference || '-'}
                        </span>
                      </div>
                      {/* Customer Information for Sale-related movements */}
                      {(move.reference?.includes('SALE-') || move.reference?.includes('POS-SALE-')) && (
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customer:</span>
                          <span className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                            {move.sale?.customer?.name || 
                             (move.notes?.includes(' to ') ? move.notes.split(' to ')[1] : '') ||
                             'Walk-in Customer'}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date:</span>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(move.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>User:</span>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {move.user?.name || move.creator?.name || 'System'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDetails(move)}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          darkMode 
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-400/30' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        <i className="bi bi-eye mr-2"></i>
                        View
                      </button>
                      {canManageStock && (
                        <button
                          onClick={() => openEdit(move)}
                          className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 ${
                            darkMode 
                              ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-400/30' 
                              : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          <i className="bi bi-pencil mr-2"></i>
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {props.stockMovements?.links && (
            <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 mt-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Showing <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{props.stockMovements.from || 0}</span> to{' '}
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{props.stockMovements.to || 0}</span> of{' '}
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{props.stockMovements.total || 0}</span> movements
                </div>
                <div className="flex items-center gap-2">
                  {props.stockMovements.links.map((link, index) => {
                    if (link.label.includes('Previous')) {
                      return (
                        <button
                          key={index}
                          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                            !link.url
                              ? darkMode ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : darkMode ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                          }`}
                          onClick={() => link.url && router.get(link.url)}
                          disabled={!link.url}
                        >
                          <i className="bi bi-chevron-left mr-2"></i>
                          Previous
                        </button>
                      );
                    } else if (link.label.includes('Next')) {
                      return (
                        <button
                          key={index}
                          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                            !link.url
                              ? darkMode ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : darkMode ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                          }`}
                          onClick={() => link.url && router.get(link.url)}
                          disabled={!link.url}
                        >
                          Next
                          <i className="bi bi-chevron-right ml-2"></i>
                        </button>
                      );
                    } else {
                      return (
                        <button
                          key={index}
                          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                            link.active
                              ? darkMode ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-blue-50 text-blue-600 border border-blue-200'
                              : darkMode ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                          }`}
                          onClick={() => link.url && router.get(link.url)}
                          disabled={!link.url}
                        >
                          {link.label}
                        </button>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Fallback Pagination for client-side */}
          {!props.stockMovements?.links && (
            <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 mt-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
              <div className="flex items-center justify-between">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Page <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{page}</span> of{' '}
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      page <= 1
                        ? darkMode ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : darkMode ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <i className="bi bi-chevron-left mr-2"></i>
                    Previous
                  </button>
                  <div className={`px-6 py-2 rounded-xl font-bold ${darkMode ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                    {page}
                  </div>
                  <button
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                      page >= totalPages
                        ? darkMode ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : darkMode ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                    <i className="bi bi-chevron-right ml-2"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Details Modal */}
          <Modal show={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedMove(null); }} maxWidth="4xl">
            <div className={`${darkMode ? 'bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900' : 'bg-gradient-to-br from-accent-50 via-primary-50 to-white'} p-8`}>
              {/* Header with Gradient */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-xl"></div>
                <div className="relative flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl ${
                    selectedMove?.movement_type === 'in' || selectedMove?.type === 'In'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : selectedMove?.movement_type === 'adjustment'
                      ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                      : selectedMove?.movement_type === 'expired'
                      ? 'bg-gradient-to-br from-gray-500 to-slate-600'
                      : 'bg-gradient-to-br from-red-500 to-pink-600'
                  } flex items-center justify-center shadow-xl`}>
                    <i className={`bi ${
                      selectedMove?.movement_type === 'in' || selectedMove?.type === 'In'
                        ? 'bi-arrow-down-circle'
                        : selectedMove?.movement_type === 'adjustment'
                        ? 'bi-sliders'
                        : selectedMove?.movement_type === 'expired'
                        ? 'bi-clock-history'
                        : 'bi-arrow-up-circle'
                    } text-3xl text-white`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-accent-400 to-primary-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent'}`}>
                      Movement Details
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      Complete information for this stock transaction
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedMove?.movement_type === 'in'
                          ? darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                          : selectedMove?.movement_type === 'adjustment'
                          ? darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
                          : selectedMove?.movement_type === 'expired'
                          ? darkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700'
                          : darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                      }`}>
                        ID: {selectedMove?.id}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        {selectedMove?.reference || 'No Reference'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManageStock && (
                      <button
                        onClick={() => {
                          setIsDetailOpen(false);
                          openEdit(selectedMove);
                        }}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                          darkMode 
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-400/30' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                        } flex items-center gap-2`}
                      >
                        <i className="bi bi-pencil"></i>
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => { setIsDetailOpen(false); setSelectedMove(null); }}
                      className={`p-3 rounded-xl transition-all duration-200 ${darkMode ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                      aria-label="Close"
                    >
                      <i className="bi bi-x-lg text-xl"></i>
                    </button>
                  </div>
                </div>
              </div>

              {selectedMove ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gradient-to-r from-accent-50 to-primary-50 rounded-2xl p-6 border border-accent-100">
                    <h4 className="text-sm font-bold text-accent-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <i className="bi bi-calendar-event"></i>
                      Transaction Info
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Date</div>
                        <div className="font-bold text-gray-900">
                          {new Date(selectedMove.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Time</div>
                        <div className="font-bold text-gray-900">
                          {new Date(selectedMove.created_at || selectedMove.date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medicine Information */}
                  <div className="bg-gradient-to-r from-primary-50 to-neutral-50 rounded-2xl p-6 border border-primary-100">
                    <h4 className="text-sm font-bold text-primary-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <i className="bi bi-capsule-pill"></i>
                      Medicine Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">Name</div>
                        <div className="font-bold text-gray-900 text-lg">
                          {typeof selectedMove.medicine === 'string' ? selectedMove.medicine : selectedMove.medicine?.name || 'Unknown'}
                        </div>
                      </div>
                      {typeof selectedMove.medicine === 'object' && selectedMove.medicine?.brand && (
                        <div>
                          <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">Brand</div>
                          <div className="font-semibold text-gray-900">{selectedMove.medicine.brand}</div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {selectedMove.batch_number && (
                          <div>
                            <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">Batch Number</div>
                            <div className="font-semibold text-gray-900">{selectedMove.batch_number}</div>
                          </div>
                        )}
                        {selectedMove.expiry_date && (
                          <div>
                            <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">Expiry Date</div>
                            <div className="font-semibold text-gray-900">
                              {new Date(selectedMove.expiry_date).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Movement Information */}
                  <div className={`bg-gradient-to-r ${
                    (selectedMove.movement_type || selectedMove.type?.toLowerCase()) === 'in'
                      ? 'from-green-50 to-emerald-50 border-green-100'
                      : 'from-red-50 to-pink-50 border-red-100'
                  } rounded-2xl p-6 border`}>
                    <h4 className={`text-sm font-bold ${
                      (selectedMove.movement_type || selectedMove.type?.toLowerCase()) === 'in'
                        ? 'text-green-900'
                        : 'text-red-900'
                    } mb-4 uppercase tracking-wide flex items-center gap-2`}>
                      <i className="bi bi-arrow-left-right"></i>
                      Movement Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className={`text-xs uppercase tracking-wide mb-1 ${
                          (selectedMove.movement_type || selectedMove.type?.toLowerCase()) === 'in'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>Type</div>
                        <div className="font-bold text-gray-900">
                          {(selectedMove.movement_type || selectedMove.type || 'Unknown').charAt(0).toUpperCase() +
                            (selectedMove.movement_type || selectedMove.type || 'Unknown').slice(1)}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs uppercase tracking-wide mb-1 ${
                          (selectedMove.movement_type || selectedMove.type?.toLowerCase()) === 'in'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>Quantity</div>
                        <div className={`font-black text-3xl ${
                          (selectedMove.movement_type || selectedMove.type?.toLowerCase()) === 'in'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {(selectedMove.movement_type || selectedMove.type?.toLowerCase()) === 'in' ? '+' : '-'}
                          {Math.abs(selectedMove.quantity || 0)}
                        </div>
                      </div>
                    </div>

                    {selectedMove.unit_cost && canViewCosts && (
                      <div className="mt-4 pt-4 border-t border-white/50">
                        <div className={`text-xs uppercase tracking-wide mb-1 ${
                          (selectedMove.movement_type || selectedMove.type?.toLowerCase()) === 'in'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>Cost Information</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Unit Cost</div>
                            <div className="font-bold text-gray-900 text-lg">
                              UGX {Number(selectedMove.unit_cost).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Total Value</div>
                            <div className="font-bold text-gray-900 text-lg">
                              UGX {(Number(selectedMove.unit_cost) * Math.abs(selectedMove.quantity || 0)).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Information */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                      <i className="bi bi-info-circle"></i>
                      Additional Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Reference</div>
                        <div className="font-semibold text-gray-900">{selectedMove.reference || '-'}</div>
                      </div>
                      {/* Customer Information for Sale-related movements */}
                      {(selectedMove.reference?.includes('SALE-') || selectedMove.reference?.includes('POS-SALE-')) && (
                        <div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Customer</div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <i className="bi bi-person-check text-green-600"></i>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {selectedMove.sale?.customer?.name || 
                                 (selectedMove.notes?.includes(' to ') ? selectedMove.notes.split(' to ')[1] : '') ||
                                 'Walk-in Customer'}
                              </div>
                              {selectedMove.sale?.customer?.phone && (
                                <div className="text-xs text-gray-500">{selectedMove.sale?.customer?.phone}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">User</div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <i className="bi bi-person text-blue-600"></i>
                          </div>
                          <div className="font-semibold text-gray-900">{selectedMove.user?.name || selectedMove.creator?.name || 'System'}</div>
                        </div>
                      </div>
                      {(selectedMove.notes || selectedMove.note) && (
                        <div>
                          <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Notes</div>
                          <div className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-200">
                            {selectedMove.notes || selectedMove.note}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <i className="bi bi-inbox text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">No movement selected.</p>
                </div>
              )}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    setSelectedMove(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                >
                  Close
                </button>
                <button
                  onClick={() => exportCSV([selectedMove])}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  <i className="bi bi-download mr-2"></i>
                  Export
                </button>
              </div>
            </div>
          </Modal>

          {/* Create Movement Modal */}
          <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="4xl">
            <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-white'} p-8`}>
              {/* Header with Gradient */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl blur-xl"></div>
                <div className="relative flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                    <i className="bi bi-plus-lg text-3xl text-white"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'}`}>
                      Add Stock Movement
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      Record a new stock movement transaction
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateOpen(false)}
                    className={`p-3 rounded-xl transition-all duration-200 ${darkMode ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                    aria-label="Close"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createForm.post(route('stock-movements.store'), {
                    onSuccess: () => {
                      setIsCreateOpen(false);
                      createForm.reset();
                    },
                  });
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  {/* Medicine Selection */}
                  <div className="group">
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                      <i className="bi bi-capsule text-blue-500"></i>
                      Medicine
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="medicine_id"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        darkMode 
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                      } focus:ring-4 focus:ring-blue-500/20 focus:outline-none`}
                      value={createForm.data.medicine_id}
                      onChange={e => {
                        createForm.setData('medicine_id', e.target.value);
                        const medicine = medicines.find(m => m.id == e.target.value);
                        if (medicine && createForm.data.movement_type === 'in') {
                          createForm.setData('unit_cost', medicine.cost_price || '');
                        }
                      }}
                      required
                    >
                      <option value="">Select Medicine</option>
                      {medicines.length > 0 ? (
                        medicines.map(medicine => (
                          <option key={medicine.id} value={medicine.id}>
                            {medicine.name} {medicine.brand ? `- ${medicine.brand}` : ''} (Stock: {medicine.stock || 0})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No medicines available - Please add medicines first</option>
                      )}
                    </select>
                    <InputError message={createForm.errors.medicine_id} className="mt-2" />
                    {createForm.data.medicine_id && (
                      <div className={`mt-3 p-4 rounded-xl border-2 ${
                        darkMode 
                          ? 'bg-blue-500/10 border-blue-500/20' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        {(() => {
                          const medicine = medicines.find(m => m.id == createForm.data.medicine_id);
                          return medicine ? (
                            <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              <div className="font-semibold">Current Stock: {medicine.stock || 0} units</div>
                              <div>Reorder Level: {medicine.reorder_level || 0}</div>
                              {medicine.expiry_date && (
                                <div className={`${new Date(medicine.expiry_date) < new Date() ? 'text-red-400' : ''}`}>
                                  Expires: {new Date(medicine.expiry_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Movement Type */}
                  <div className="group">
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                      <i className="bi bi-arrow-left-right text-blue-500"></i>
                      Movement Type
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="movement_type"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        darkMode 
                          ? 'bg-gray-800/50 border-gray-700 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                      } focus:ring-4 focus:ring-blue-500/20 focus:outline-none`}
                      value={createForm.data.movement_type}
                      onChange={e => createForm.setData('movement_type', e.target.value)}
                      required
                    >
                      <option value="in">📦 Stock In (Purchase/Restock)</option>
                      <option value="out">📤 Stock Out (Sale/Transfer)</option>
                      <option value="adjustment">⚖️ Adjustment (Correction)</option>
                      <option value="expired">⏰ Expired (Removal)</option>
                    </select>
                    <InputError message={createForm.errors.movement_type} className="mt-2" />
                    <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {createForm.data.movement_type === 'in' && '✅ Increases stock level'}
                      {createForm.data.movement_type === 'out' && '⚠️ Decreases stock level'}
                      {createForm.data.movement_type === 'adjustment' && '🔧 Manual stock correction'}
                      {createForm.data.movement_type === 'expired' && '❌ Removes expired stock'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Quantity */}
                  <div className="group">
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                      <i className="bi bi-123 text-blue-500"></i>
                      Quantity
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        darkMode 
                          ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      } focus:ring-4 focus:ring-blue-500/20 focus:outline-none`}
                      value={createForm.data.quantity}
                      onChange={e => createForm.setData('quantity', Number(e.target.value))}
                      required
                    />
                    <InputError message={createForm.errors.quantity} className="mt-2" />
                  </div>

                  {/* Unit Cost */}
                  <div className="group">
                    <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                      <i className="bi bi-cash text-blue-500"></i>
                      Unit Cost (UGX)
                    </label>
                    <input
                      id="unit_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Optional"
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                        darkMode 
                          ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                      } focus:ring-4 focus:ring-blue-500/20 focus:outline-none`}
                      value={createForm.data.unit_cost}
                      onChange={e => createForm.setData('unit_cost', e.target.value)}
                    />
                    <InputError message={createForm.errors.unit_cost} className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <InputLabel htmlFor="reference" value="Reference" className="text-sm font-bold text-gray-700 mb-2" />
                    <TextInput
                      id="reference"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-300"
                      value={createForm.data.reference}
                      onChange={e => createForm.setData('reference', e.target.value)}
                      placeholder="e.g., PO-1001, SALE-2001"
                    />
                    <InputError message={createForm.errors.reference} className="mt-2" />
                  </div>
                  <div>
                    <InputLabel htmlFor="batch_number" value="Batch Number" className="text-sm font-bold text-gray-700 mb-2" />
                    <TextInput
                      id="batch_number"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-300"
                      value={createForm.data.batch_number}
                      onChange={e => createForm.setData('batch_number', e.target.value)}
                      placeholder="Optional"
                    />
                    <InputError message={createForm.errors.batch_number} className="mt-2" />
                  </div>
                </div>

                {createForm.data.movement_type === 'in' && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200">
                    <h4 className="text-sm font-bold text-green-800 mb-4 flex items-center gap-2">
                      <i className="bi bi-arrow-down-circle"></i>
                      Stock In Details
                    </h4>
                    <div>
                      <InputLabel htmlFor="expiry_date" value="Expiry Date" className="text-sm font-bold text-gray-700 mb-2" />
                      <TextInput
                        id="expiry_date"
                        type="date"
                        className="w-full px-4 py-3 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-300"
                        value={createForm.data.expiry_date}
                        onChange={e => createForm.setData('expiry_date', e.target.value)}
                      />
                      <InputError message={createForm.errors.expiry_date} className="mt-2" />
                    </div>
                  </div>
                )}

                <div>
                  <InputLabel htmlFor="notes" value="Notes" className="text-sm font-bold text-gray-700 mb-2" />
                  <textarea
                    id="notes"
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all duration-300"
                    value={createForm.data.notes}
                    onChange={e => createForm.setData('notes', e.target.value)}
                    placeholder="Additional notes about this movement..."
                  />
                  <InputError message={createForm.errors.notes} className="mt-2" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                    }`}
                  >
                    <i className="bi bi-x-circle mr-2"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createForm.processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {createForm.processing ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle mr-2"></i>
                        Add Movement
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          {/* Stock Adjustment Modal */}
          <Modal show={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} maxWidth="4xl">
            <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-orange-900 to-amber-900' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-white'} p-8`}>
              {/* Header with Gradient */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl blur-xl"></div>
                <div className="relative flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-xl">
                    <i className="bi bi-sliders text-3xl text-white"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent'}`}>
                      Stock Adjustment
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      Adjust stock levels for inventory corrections
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAdjustOpen(false)}
                    className={`p-3 rounded-xl transition-all duration-200 ${darkMode ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                    aria-label="Close"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  adjustForm.post(route('stock-movements.adjustment'), {
                    onSuccess: () => {
                      setIsAdjustOpen(false);
                      adjustForm.reset();
                    },
                  });
                }}
                className="space-y-6"
              >
                <div>
                  <InputLabel htmlFor="adjust_medicine_id" value="Medicine *" className="text-sm font-bold text-gray-700 mb-2" />
                  <select
                    id="adjust_medicine_id"
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl transition-all duration-300"
                    value={adjustForm.data.medicine_id}
                    onChange={e => adjustForm.setData('medicine_id', e.target.value)}
                    required
                  >
                    <option value="">Select Medicine</option>
                    {medicines.length > 0 ? (
                      medicines.map(medicine => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name} {medicine.brand ? `- ${medicine.brand}` : ''} (Current: {medicine.stock || 0})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No medicines available - Please add medicines first</option>
                    )}
                  </select>
                  <InputError message={adjustForm.errors.medicine_id} className="mt-2" />
                  
                  {/* Current Stock Display */}
                  {selectedMedicine && (
                    <div className="mt-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-orange-800">{selectedMedicine.name}</h4>
                          <p className="text-sm text-orange-600">
                            Current Stock: <span className="font-bold">{selectedMedicine.stock || 0} units</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-orange-600">Reorder Level</div>
                          <div className="font-bold text-orange-800">{selectedMedicine.reorder_level || 0}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <InputLabel htmlFor="adjustment_type" value="Adjustment Type *" className="text-sm font-bold text-gray-700 mb-2" />
                    <select
                      id="adjustment_type"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl transition-all duration-300"
                      value={adjustForm.data.adjustment_type}
                      onChange={e => adjustForm.setData('adjustment_type', e.target.value)}
                    >
                      <option value="add">➕ Add Stock (Increase)</option>
                      <option value="subtract">➖ Remove Stock (Decrease)</option>
                      <option value="set">🎯 Set Exact Amount</option>
                    </select>
                    <div className="mt-2 text-xs text-gray-500">
                      {adjustForm.data.adjustment_type === 'add' && 'Increases current stock by specified amount'}
                      {adjustForm.data.adjustment_type === 'subtract' && 'Decreases current stock by specified amount'}
                      {adjustForm.data.adjustment_type === 'set' && 'Sets stock to exact specified amount'}
                    </div>
                  </div>
                  <div>
                    <InputLabel htmlFor="adjust_quantity" value="Quantity *" className="text-sm font-bold text-gray-700 mb-2" />
                    <TextInput
                      id="adjust_quantity"
                      type="number"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl transition-all duration-300"
                      value={adjustForm.data.quantity}
                      onChange={e => adjustForm.setData('quantity', Number(e.target.value))}
                      required
                      placeholder={adjustForm.data.adjustment_type === 'set' ? 'New stock level' : 'Amount to adjust'}
                    />
                    <InputError message={adjustForm.errors.quantity} className="mt-2" />
                  </div>
                </div>

                {/* Adjustment Preview */}
                {selectedMedicine && adjustForm.data.quantity > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
                    <h4 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <i className="bi bi-calculator"></i>
                      Adjustment Preview
                    </h4>
                    {(() => {
                      const preview = getAdjustmentPreview();
                      return preview ? (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Current Stock</div>
                            <div className="text-2xl font-bold text-blue-800">{preview.current}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">Change</div>
                            <div className={`text-2xl font-bold ${preview.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {preview.change >= 0 ? '+' : ''}{preview.change}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">New Stock</div>
                            <div className="text-2xl font-bold text-blue-800">{preview.new}</div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                <div>
                  <InputLabel htmlFor="reason" value="Reason *" className="text-sm font-bold text-gray-700 mb-2" />
                  <select
                    id="reason"
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl transition-all duration-300"
                    value={adjustForm.data.reason}
                    onChange={e => adjustForm.setData('reason', e.target.value)}
                    required
                  >
                    <option value="">Select Reason</option>
                    <option value="damaged">Damaged Goods</option>
                    <option value="expired">Expired Stock</option>
                    <option value="theft">Theft/Loss</option>
                    <option value="recount">Physical Recount</option>
                    <option value="return">Supplier Return</option>
                    <option value="other">Other</option>
                  </select>
                  <InputError message={adjustForm.errors.reason} className="mt-2" />
                </div>

                <div>
                  <InputLabel htmlFor="adjust_notes" value="Additional Notes" className="text-sm font-bold text-gray-700 mb-2" />
                  <textarea
                    id="adjust_notes"
                    rows="3"
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-xl transition-all duration-300"
                    value={adjustForm.data.notes}
                    onChange={e => adjustForm.setData('notes', e.target.value)}
                    placeholder="Additional details about this adjustment..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdjustOpen(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                    }`}
                  >
                    <i className="bi bi-x-circle mr-2"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjustForm.processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {adjustForm.processing ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                        Adjusting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle mr-2"></i>
                        Apply Adjustment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          {/* Edit Movement Modal */}
          <Modal show={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidth="4xl">
            <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900' : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-white'} p-8`}>
              {/* Header with Gradient */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl blur-xl"></div>
                <div className="relative flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
                    <i className="bi bi-pencil-square text-3xl text-white"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'}`}>
                      Edit Stock Movement
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      Modify existing stock movement record
                    </p>
                    {selectedMove && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                          ID: {selectedMove.id}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                          {new Date(selectedMove.created_at || selectedMove.date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditOpen(false)}
                    className={`p-3 rounded-xl transition-all duration-200 ${darkMode ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                    aria-label="Close"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editForm.put(route('stock-movements.update', selectedMove?.id), {
                    onSuccess: () => {
                      setIsEditOpen(false);
                      editForm.reset();
                      setSelectedMove(null);
                    },
                  });
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <InputLabel htmlFor="edit_medicine_id" value="Medicine *" className="text-sm font-bold text-gray-700 mb-2" />
                    <select
                      id="edit_medicine_id"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl transition-all duration-300"
                      value={editForm.data.medicine_id}
                      onChange={e => editForm.setData('medicine_id', e.target.value)}
                      required
                    >
                      <option value="">Select Medicine</option>
                      {medicines.length > 0 ? (
                        medicines.map(medicine => (
                          <option key={medicine.id} value={medicine.id}>
                            {medicine.name} {medicine.brand ? `- ${medicine.brand}` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No medicines available</option>
                      )}
                    </select>
                    <InputError message={editForm.errors.medicine_id} className="mt-2" />
                  </div>
                  <div>
                    <InputLabel htmlFor="edit_movement_type" value="Movement Type *" className="text-sm font-bold text-gray-700 mb-2" />
                    <select
                      id="edit_movement_type"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl transition-all duration-300"
                      value={editForm.data.movement_type}
                      onChange={e => editForm.setData('movement_type', e.target.value)}
                      required
                    >
                      <option value="in">Stock In</option>
                      <option value="out">Stock Out</option>
                      <option value="adjustment">Adjustment</option>
                      <option value="expired">Expired</option>
                    </select>
                    <InputError message={editForm.errors.movement_type} className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <InputLabel htmlFor="edit_quantity" value="Quantity *" className="text-sm font-bold text-gray-700 mb-2" />
                    <TextInput
                      id="edit_quantity"
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl transition-all duration-300"
                      value={editForm.data.quantity}
                      onChange={e => editForm.setData('quantity', Number(e.target.value))}
                      required
                    />
                    <InputError message={editForm.errors.quantity} className="mt-2" />
                  </div>
                  <div>
                    <InputLabel htmlFor="edit_unit_cost" value="Unit Cost (UGX)" className="text-sm font-bold text-gray-700 mb-2" />
                    <TextInput
                      id="edit_unit_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl transition-all duration-300"
                      value={editForm.data.unit_cost}
                      onChange={e => editForm.setData('unit_cost', e.target.value)}
                      placeholder="Optional"
                    />
                    <InputError message={editForm.errors.unit_cost} className="mt-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <InputLabel htmlFor="edit_reference" value="Reference" className="text-sm font-bold text-gray-700 mb-2" />
                    <TextInput
                      id="edit_reference"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl transition-all duration-300"
                      value={editForm.data.reference}
                      onChange={e => editForm.setData('reference', e.target.value)}
                      placeholder="e.g., PO-1001, SALE-2001"
                    />
                    <InputError message={editForm.errors.reference} className="mt-2" />
                  </div>
                  <div>
                    <InputLabel htmlFor="edit_batch_number" value="Batch Number" className="text-sm font-bold text-gray-700 mb-2" />
                    <TextInput
                      id="edit_batch_number"
                      className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl transition-all duration-300"
                      value={editForm.data.batch_number}
                      onChange={e => editForm.setData('batch_number', e.target.value)}
                      placeholder="Optional"
                    />
                    <InputError message={editForm.errors.batch_number} className="mt-2" />
                  </div>
                </div>

                {editForm.data.movement_type === 'in' && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200">
                    <h4 className="text-sm font-bold text-green-800 mb-4 flex items-center gap-2">
                      <i className="bi bi-arrow-down-circle"></i>
                      Stock In Details
                    </h4>
                    <div>
                      <InputLabel htmlFor="edit_expiry_date" value="Expiry Date" className="text-sm font-bold text-gray-700 mb-2" />
                      <TextInput
                        id="edit_expiry_date"
                        type="date"
                        className="w-full px-4 py-3 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-300"
                        value={editForm.data.expiry_date}
                        onChange={e => editForm.setData('expiry_date', e.target.value)}
                      />
                      <InputError message={editForm.errors.expiry_date} className="mt-2" />
                    </div>
                  </div>
                )}

                <div>
                  <InputLabel htmlFor="edit_notes" value="Notes" className="text-sm font-bold text-gray-700 mb-2" />
                  <textarea
                    id="edit_notes"
                    rows="4"
                    className="w-full px-4 py-3 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl transition-all duration-300"
                    value={editForm.data.notes}
                    onChange={e => editForm.setData('notes', e.target.value)}
                    placeholder="Additional notes about this movement..."
                  />
                  <InputError message={editForm.errors.notes} className="mt-2" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                    }`}
                  >
                    <i className="bi bi-x-circle mr-2"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editForm.processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {editForm.processing ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle mr-2"></i>
                        Update Movement
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
