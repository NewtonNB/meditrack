import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import { useMedicines } from '@/Hooks/useMedicines';
import { usePurchases } from '@/Hooks/usePurchases';

import 'bootstrap-icons/font/bootstrap-icons.css';
import { useRealTimeUpdates, dispatchUpdateEvent } from '@/Hooks/useRealTimeUpdates';

export default function Purchases() {
  const { props } = usePage();
  const { medicines: availableMedicines, updateStock } = useMedicines();
  const { purchases, addPurchase, updatePurchase, deletePurchase, stats } = usePurchases();
  
  // Get suppliers from server props instead of localStorage
  const suppliers = props.suppliers || [];
  const medicines = props.medicines || availableMedicines;
  const suppliersLoading = false; // No loading needed since data comes from server
  
  const canManage = props.canManage || ['pharmacist', 'pharmacy_admin', 'super_admin'].includes(props.auth?.user?.role);

  // Debug: Log suppliers when they change
  React.useEffect(() => {
    console.log('Purchases page - Suppliers from server:', suppliers.length, suppliers);
  }, [suppliers]);
  
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [supplierFilter, setSupplierFilter] = React.useState('');
  const [darkMode, setDarkMode] = React.useState(false);

  // Handle URL parameters for supplier filtering
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const supplierParam = urlParams.get('supplier');
    if (supplierParam) {
      setSupplierFilter(supplierParam);
    }
  }, []);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = React.useState(false);
  const [isSupplierDetailsOpen, setIsSupplierDetailsOpen] = React.useState(false);
  const [selectedPurchase, setSelectedPurchase] = React.useState(null);
  const [selectedSupplier, setSelectedSupplier] = React.useState(null);

  const createForm = useForm({ 
    supplier_id: '', 
    supplier_name: '', 
    medicine_id: '', 
    quantity: 1, 
    unit_cost: '', 
    payment_method: 'cash', 
    notes: '',
    expected_delivery_date: '',
    priority: 'normal'
  });
  const receiveForm = useForm({ received_quantity: 0 });
  const quickSupplierForm = useForm({ name: '', phone: '', email: '', address: '' });

  // Use real-time updates hook
  useRealTimeUpdates({
    pageName: 'purchases',
    dataKeys: ['purchases', 'medicines', 'suppliers'],
    onUpdate: (eventType, data) => {
      console.log(`Purchases page updated due to: ${eventType}`, JSON.stringify(data));
    }
  });

  // Quick supplier creation handler
  const handleQuickSupplierCreate = (e) => {
    e.preventDefault();
    quickSupplierForm.clearErrors();
    
    const errors = {};
    if (!quickSupplierForm.data.name?.trim()) errors.name = 'Supplier name required';
    if (!quickSupplierForm.data.phone?.trim()) errors.phone = 'Phone number required';
    
    if (Object.keys(errors).length > 0) {
      Object.keys(errors).forEach(key => quickSupplierForm.setError(key, errors[key]));
      return;
    }

    // Submit to backend
    quickSupplierForm.post(route('suppliers.store'), {
      onSuccess: (page) => {
        // Get the new supplier from the response
        const newSuppliers = page.props.suppliers || suppliers;
        const newSupplier = newSuppliers.find(s => s.name === quickSupplierForm.data.name);
        
        if (newSupplier) {
          // Auto-select the new supplier in the purchase form
          createForm.setData('supplier_id', newSupplier.id);
          createForm.setData('supplier_name', newSupplier.name);
        }
        
        setIsQuickSupplierOpen(false);
        quickSupplierForm.reset();
        
        // Show success message
        setTimeout(() => {
          const activityDetail = { 
            id: `supplier-create-${Date.now()}`,
            type: 'supplier', 
            title: 'New Supplier Added', 
            description: `Added supplier: ${quickSupplierForm.data.name}`,
            details: `Phone: ${quickSupplierForm.data.phone} • Ready for purchase orders`,
            time: new Date().toISOString(),
            priority: 'normal',
            route: '/suppliers'
          };
          window.dispatchEvent(new CustomEvent('newActivity', { detail: activityDetail }));
        }, 100);
      },
      onError: (errors) => {
        console.error('Error creating supplier:', errors);
      }
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    createForm.clearErrors();
    const errors = {};
    
    // Check if supplier is selected (either existing or new name)
    if (!createForm.data.supplier_id && !createForm.data.supplier_name?.trim()) {
      errors.supplier_name = 'Supplier required';
    }
    if (!createForm.data.medicine_id) errors.medicine_id = 'Medicine required';
    if (createForm.data.quantity <= 0) errors.quantity = 'Quantity must be positive';
    if (!createForm.data.unit_cost || parseFloat(createForm.data.unit_cost) <= 0) errors.unit_cost = 'Cost required';
    
    if (Object.keys(errors).length > 0) {
      Object.keys(errors).forEach(key => createForm.setError(key, errors[key]));
      return;
    }
    
    const medicine = availableMedicines.find(m => m.id.toString() === createForm.data.medicine_id);
    const total = createForm.data.quantity * parseFloat(createForm.data.unit_cost);
    
    // Get supplier info
    let supplierInfo = { name: createForm.data.supplier_name };
    if (createForm.data.supplier_id) {
      const supplier = suppliers.find(s => s.id.toString() === createForm.data.supplier_id);
      if (supplier) {
        supplierInfo = { id: supplier.id, name: supplier.name, phone: supplier.phone, email: supplier.email };
      }
    }
    
    const newPurchase = addPurchase({
      supplier_id: createForm.data.supplier_id || null,
      supplier_name: supplierInfo.name,
      supplier: supplierInfo,
      medicine: medicine ? { id: medicine.id, name: medicine.name, brand: medicine.brand } : null,
      medicine_id: createForm.data.medicine_id, 
      quantity: createForm.data.quantity, 
      unit_cost: parseFloat(createForm.data.unit_cost),
      total_amount: total, 
      payment_method: createForm.data.payment_method, 
      notes: createForm.data.notes, 
      status: 'pending',
    });
    
    // Dispatch activity event for activity tracker
    setTimeout(() => {
      const activityDetail = { 
        id: `purchase-create-${Date.now()}`,
        type: 'purchase', 
        title: 'Purchase Order Created', 
        description: `New order for ${createForm.data.quantity} units of ${medicine?.name || 'medicine'} from ${createForm.data.supplier_name}`,
        details: `Payment: ${createForm.data.payment_method.replace('_', ' ').toUpperCase()} • Unit Cost: UGX ${parseFloat(createForm.data.unit_cost).toLocaleString()}`,
        amount: parseFloat(total),
        time: new Date().toISOString(),
        metadata: { quantity: createForm.data.quantity, payment_method: createForm.data.payment_method },
        priority: 'normal',
        route: '/purchases'
      };
      window.dispatchEvent(new CustomEvent('newActivity', { detail: activityDetail }));
      
      // Dispatch purchase created event for real-time updates
      dispatchUpdateEvent('purchaseCreated', {
        purchase: newPurchase,
        medicine: medicine,
        supplier: createForm.data.supplier_name,
        quantity: createForm.data.quantity,
        totalAmount: total
      }, ['dashboard', 'medicines', 'stock-movements']);
    }, 100);
    
    setIsCreateOpen(false);
    createForm.reset();
  };

  const handleReceive = (e) => {
    e.preventDefault();
    if (!selectedPurchase) return;
    
    // Update local state
    updatePurchase(selectedPurchase.id, { 
      status: 'received', 
      received_quantity: receiveForm.data.received_quantity, 
      received_date: new Date().toISOString() 
    });
    
    const medicine = availableMedicines.find(m => m.id.toString() === selectedPurchase.medicine_id);
    if (medicine) {
      updateStock(medicine.id, receiveForm.data.received_quantity, 'Purchase received');
      
      // Create stock movement manually via API
      fetch('/api/stock-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({
          medicine_id: medicine.id,
          movement_type: 'in',
          quantity: receiveForm.data.received_quantity,
          reference: `RECEIVE-${selectedPurchase.id}`,
          notes: `Received ${receiveForm.data.received_quantity} units of ${medicine.name}`,
        })
      }).catch(err => {
        // Failed to create stock movement
      });
    }
    
    setIsReceiveOpen(false);
    receiveForm.reset();
    
    // Dispatch activity event for activity tracker
    setTimeout(() => {
      const activityDetail = { 
        id: `purchase-receive-${Date.now()}`,
        type: 'purchase', 
        title: 'Purchase Order Received', 
        description: `Received ${receiveForm.data.received_quantity} units of ${medicine?.name || 'medicine'} from ${selectedPurchase.supplier_name}`,
        details: `PO: ${selectedPurchase.purchase_order} • Status: Completed`,
        amount: parseFloat(selectedPurchase.total_amount),
        time: new Date().toISOString(),
        metadata: { quantity: receiveForm.data.received_quantity },
        priority: 'normal',
        route: '/purchases'
      };
      window.dispatchEvent(new CustomEvent('newActivity', { detail: activityDetail }));
      
      // Dispatch stock updated event for real-time updates
      dispatchUpdateEvent('stockUpdated', {
        purchase: selectedPurchase,
        medicine: medicine,
        receivedQuantity: receiveForm.data.received_quantity,
        type: 'purchase_received'
      }, ['dashboard', 'medicines', 'stock-movements']);
    }, 100);
    
    setIsReceiveOpen(false);
    setSelectedPurchase(null);
  };

  const filtered = React.useMemo(() => {
    return purchases.filter(p => {
      const q = query.toLowerCase();
      if (q && !(p.supplier_name?.toLowerCase().includes(q) || p.medicine?.name?.toLowerCase().includes(q) || p.purchase_order?.toLowerCase().includes(q))) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (supplierFilter && p.supplier_id?.toString() !== supplierFilter) return false;
      return true;
    });
  }, [purchases, query, statusFilter, supplierFilter]);

  // Get supplier statistics
  const supplierStats = React.useMemo(() => {
    const supplierPurchases = {};
    purchases.forEach(p => {
      const supplierId = p.supplier_id || p.supplier_name;
      if (!supplierPurchases[supplierId]) {
        supplierPurchases[supplierId] = {
          name: p.supplier_name,
          count: 0,
          totalAmount: 0,
          lastOrder: null
        };
      }
      supplierPurchases[supplierId].count++;
      supplierPurchases[supplierId].totalAmount += p.total_amount || 0;
      if (!supplierPurchases[supplierId].lastOrder || new Date(p.created_at) > new Date(supplierPurchases[supplierId].lastOrder)) {
        supplierPurchases[supplierId].lastOrder = p.created_at;
      }
    });
    return Object.values(supplierPurchases).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [purchases]);

  return (
    <AuthenticatedLayout>
      <Head title="Purchases"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" /></Head>
      <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900' : 'bg-gradient-to-br from-primary-50 via-neutral-50 to-accent-50'}`} style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${darkMode ? 'bg-primary-500/10' : 'bg-primary-300/30'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${darkMode ? 'bg-pink-500/10' : 'bg-pink-300/30'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
        </div>
        <div className="relative z-10 p-6">
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/40' : 'bg-white/40'} rounded-3xl p-8 mb-8 border ${darkMode ? 'border-gray-700/50' : 'border-white/60'} shadow-2xl`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-primary-500 to-neutral-600' : 'bg-gradient-to-br from-primary-600 to-neutral-600'} flex items-center justify-center shadow-2xl`}>
                    <i className="bi bi-cart3 text-3xl text-white"></i>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <i className="bi bi-lightning-fill text-sm text-white"></i>
                  </div>
                </div>
                <div>
                  <h1 className={`text-5xl font-black ${darkMode ? 'bg-gradient-to-r from-primary-400 via-neutral-400 to-accent-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-primary-600 via-neutral-600 to-accent-600 bg-clip-text text-transparent'}`}>Purchase Orders</h1>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'} mt-2 font-medium`}>Smart procurement & supplier management system</p>
                </div>
              </div>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-4 rounded-2xl transition-all ${darkMode ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'} shadow-lg hover:scale-110`}>
                <i className={`bi ${darkMode ? 'bi-sun-fill' : 'bi-moon-stars-fill'} text-2xl`}></i>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-primary-500/20 to-primary-600/30' : 'bg-gradient-to-br from-primary-400 to-primary-600'} rounded-3xl p-8 shadow-2xl hover:shadow-primary-500/50 transition-all duration-500 hover:scale-105 cursor-pointer border-2 ${darkMode ? 'border-primary-400/30' : 'border-primary-300'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <i className="bi bi-cart3 text-2xl text-white"></i>
                  </div>
                  <p className="text-white/90 font-semibold">Total Orders</p>
                </div>
                <p className="text-5xl font-black text-white mb-2">{stats.total}</p>
                <p className="text-white/80 text-sm">All purchase orders</p>
              </div>
            </div>
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/30' : 'bg-gradient-to-br from-green-400 to-emerald-600'} rounded-3xl p-8 shadow-2xl hover:shadow-green-500/50 transition-all duration-500 hover:scale-105 cursor-pointer border-2 ${darkMode ? 'border-green-400/30' : 'border-green-300'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <i className="bi bi-calendar-check text-2xl text-white"></i>
                  </div>
                  <p className="text-white/90 font-semibold">Today</p>
                </div>
                <p className="text-5xl font-black text-white mb-2">{stats.todayCount}</p>
                <p className="text-white/80 text-sm">UGX {stats.todayTotal.toLocaleString()}</p>
              </div>
            </div>
            <div onClick={() => setStatusFilter('pending')} className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-yellow-500/20 to-orange-600/30' : 'bg-gradient-to-br from-yellow-400 to-orange-600'} rounded-3xl p-8 shadow-2xl hover:shadow-yellow-500/50 transition-all duration-500 hover:scale-105 cursor-pointer border-2 ${darkMode ? 'border-yellow-400/30' : 'border-yellow-300'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm animate-pulse">
                    <i className="bi bi-hourglass-split text-2xl text-white"></i>
                  </div>
                  <p className="text-white/90 font-semibold">Pending</p>
                </div>
                <p className="text-5xl font-black text-white mb-2">{stats.pendingOrders}</p>
                <p className="text-white/80 text-sm">Awaiting receipt</p>
              </div>
            </div>
            <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-accent-500/20 to-accent-600/30' : 'bg-gradient-to-br from-accent-400 to-accent-600'} rounded-3xl p-8 shadow-2xl hover:shadow-accent-500/50 transition-all duration-500 hover:scale-105 cursor-pointer border-2 ${darkMode ? 'border-accent-400/30' : 'border-accent-300'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <i className="bi bi-cash-stack text-2xl text-white"></i>
                  </div>
                  <p className="text-white/90 font-semibold">This Month</p>
                </div>
                <p className="text-4xl font-black text-white mb-2">UGX {stats.monthlyTotal.toLocaleString()}</p>
                <p className="text-white/80 text-sm">Total procurement</p>
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/40' : 'bg-white/40'} rounded-3xl p-6 mb-6 border ${darkMode ? 'border-gray-700/50' : 'border-white/60'} shadow-xl`}>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="relative flex-1 min-w-[300px]">
                <input type="search" placeholder="Search supplier, medicine, PO..." value={query} onChange={e => setQuery(e.target.value)} className={`w-full py-3 pl-12 pr-4 rounded-2xl border-2 ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-200'} focus:ring-4 focus:ring-purple-300 transition-all`} />
                <i className={`bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
              </div>
              <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)} className={`px-6 py-3 rounded-2xl border-2 ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-200'} font-medium`} disabled={suppliersLoading}>
                <option value="">
                  {suppliersLoading ? 'Loading...' : `All Suppliers (${suppliers.length})`}
                </option>
                {!suppliersLoading && suppliers.map(s => (
                  <option key={s.id} value={s.id}>👤 {s.name}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`px-6 py-3 rounded-2xl border-2 ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-200'} font-medium`}>
                <option value="">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="received">✅ Received</option>
              </select>
              <button onClick={() => router.visit('/suppliers')} className={`px-6 py-3 rounded-2xl border-2 ${darkMode ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'} font-bold transition-all hover:scale-105`}>
                <i className="bi bi-building mr-2"></i>Suppliers
              </button>
              {canManage && (
                <button onClick={() => setIsCreateOpen(true)} className="px-8 py-3 bg-gradient-to-r from-primary-600 to-neutral-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  <i className="bi bi-plus-circle mr-2"></i>New Order
                </button>
              )}
            </div>
          </div>

          {/* Supplier Performance Section */}
          {supplierStats.length > 0 && (
            <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/40' : 'bg-white/40'} rounded-3xl p-6 mb-6 border ${darkMode ? 'border-gray-700/50' : 'border-white/60'} shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${darkMode ? 'bg-indigo-500/30' : 'bg-indigo-600'} flex items-center justify-center shadow-lg`}>
                    <i className={`bi bi-building text-2xl ${darkMode ? 'text-indigo-300' : 'text-white'}`}></i>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top Suppliers</h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Performance by purchase volume</p>
                  </div>
                </div>
                <button onClick={() => router.visit('/suppliers')} className={`px-6 py-3 rounded-2xl ${darkMode ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'} font-bold transition-all hover:scale-105`}>
                  <i className="bi bi-arrow-right mr-2"></i>View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {supplierStats.slice(0, 6).map((supplier, index) => (
                  <div key={index} className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700/50' : 'bg-white/60'} border ${darkMode ? 'border-gray-600/50' : 'border-gray-200/50'} hover:scale-105 transition-all cursor-pointer`} onClick={() => { setSelectedSupplier(supplier); setIsSupplierDetailsOpen(true); }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'} flex items-center justify-center`}>
                        <span className={`font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>#{index + 1}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                        {supplier.count} orders
                      </div>
                    </div>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 truncate`}>{supplier.name}</h4>
                    <div className={`text-2xl font-black ${darkMode ? 'text-green-400' : 'text-green-600'} mb-1`}>
                      UGX {supplier.totalAmount.toLocaleString()}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Last order: {supplier.lastOrder ? new Date(supplier.lastOrder).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/40' : 'bg-white/60'} rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'border-gray-700/50' : 'border-white/60'}`}>
            <div className={`px-8 py-6 ${darkMode ? 'bg-gradient-to-r from-primary-900/50 to-neutral-900/50' : 'bg-gradient-to-r from-primary-100 to-neutral-100'} border-b-2 ${darkMode ? 'border-primary-500/30' : 'border-primary-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${darkMode ? 'bg-primary-500/30' : 'bg-primary-600'} flex items-center justify-center shadow-lg`}>
                  <i className={`bi bi-table text-2xl ${darkMode ? 'text-purple-300' : 'text-white'}`}></i>
                </div>
                <div>
                  <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Purchase Orders</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{filtered.length} orders • Click to view details</p>
                </div>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className={`w-24 h-24 rounded-full ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'} flex items-center justify-center mx-auto mb-6`}>
                  <i className={`bi bi-inbox text-5xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                </div>
                <p className="text-2xl font-bold mb-2">No Purchase Orders</p>
                <p className="text-lg">Create your first purchase order to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-800/60' : 'bg-gray-50/80'}`}>
                    <tr>
                      {['PO Number', 'Supplier', 'Medicine', 'Quantity', 'Total Cost', 'Status', 'Actions'].map((header, i) => (
                        <th key={i} className={`px-6 py-4 text-left text-xs font-black ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200'}`}>
                    {filtered.map(p => (
                      <tr key={p.id} className={`group transition-all ${darkMode ? 'hover:bg-purple-900/20' : 'hover:bg-purple-50'}`}>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'} flex items-center justify-center`}>
                              <i className={`bi bi-file-text ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}></i>
                            </div>
                            <span className={`font-mono font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{p.purchase_order}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-5 ${darkMode ? 'text-gray-300' : 'text-gray-800'} font-semibold`}>{p.supplier_name}</td>
                        <td className="px-6 py-5">
                          <div className={`${darkMode ? 'text-gray-300' : 'text-gray-800'} font-medium`}>{p.medicine?.name}</div>
                          {p.medicine?.brand && <div className="text-xs text-gray-500">{p.medicine.brand}</div>}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-4 py-2 rounded-xl font-bold ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>{p.quantity}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className={`text-xl font-black ${darkMode ? 'text-green-400' : 'text-green-600'}`}>UGX {p.total_amount?.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${p.status === 'received' ? (darkMode ? 'bg-green-500/20 text-green-300 border-2 border-green-500/30' : 'bg-green-100 text-green-700 border-2 border-green-300') : (darkMode ? 'bg-yellow-500/20 text-yellow-300 border-2 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300')}`}>
                            <i className={`bi ${p.status === 'received' ? 'bi-check-circle-fill' : 'bi-clock-history'}`}></i>
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            {p.status === 'pending' && canManage && (
                              <button onClick={() => { setSelectedPurchase(p); receiveForm.setData('received_quantity', p.quantity); setIsReceiveOpen(true); }} className={`px-4 py-2 rounded-xl font-semibold text-sm ${darkMode ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-500 text-white hover:bg-green-600'} transition-all hover:scale-110 shadow-lg`}>
                                <i className="bi bi-box-arrow-in-down mr-1"></i>Receive
                              </button>
                            )}
                            {canManage && (
                              <button onClick={() => { setSelectedPurchase(p); setIsDeleteOpen(true); }} className={`px-4 py-2 rounded-xl font-semibold text-sm ${darkMode ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-500 text-white hover:bg-red-600'} transition-all hover:scale-110 shadow-lg`}>
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Purchase Order Creation Modal */}
        <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="4xl">
          <div className="relative bg-white overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-accent-50 to-neutral-50 opacity-50"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            
            {/* Modal Header */}
            <div className="relative px-8 py-6 bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 border-b-4 border-primary-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/30">
                      <i className="bi bi-cart-plus text-4xl text-white"></i>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-3 border-white flex items-center justify-center animate-pulse">
                      <i className="bi bi-plus text-sm text-white font-bold"></i>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-white drop-shadow-lg">Create Purchase Order</h2>
                    <p className="text-sm text-blue-50 mt-2 font-medium flex items-center gap-2">
                      <i className="bi bi-lightning-fill"></i>
                      Smart procurement system with supplier integration
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:rotate-90 border border-white/20"
                  onClick={() => setIsCreateOpen(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg text-2xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} noValidate className="relative p-8 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Supplier Selection Section */}
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 shadow-lg border-2 border-blue-200 hover:border-blue-300 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <i className="bi bi-building text-white text-2xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Supplier Information</h4>
                    <p className="text-sm text-gray-600">Select existing supplier or add new one</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                      <i className="bi bi-asterisk text-red-500 text-xs"></i>
                      Select Supplier
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <select 
                          value={createForm.data.supplier_id} 
                          onChange={e => {
                            const supplierId = e.target.value;
                            createForm.setData('supplier_id', supplierId);
                            if (supplierId) {
                              const supplier = suppliers.find(s => s.id.toString() === supplierId);
                              createForm.setData('supplier_name', supplier?.name || '');
                            } else {
                              createForm.setData('supplier_name', '');
                            }
                          }} 
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl transition-all duration-200 text-gray-900 font-medium bg-white"
                          disabled={suppliersLoading}
                        >
                          <option value="">
                            {suppliersLoading ? 'Loading suppliers...' : suppliers.length === 0 ? 'No suppliers found - click + to add one' : 'Choose from existing suppliers...'}
                          </option>
                          {!suppliersLoading && suppliers.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.phone ? `• ${s.phone}` : ''} {s.email ? `• ${s.email}` : ''}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-building text-gray-400 text-lg"></i>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setIsQuickSupplierOpen(true)} 
                        className="px-6 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold transition-all hover:scale-105 hover:shadow-xl flex items-center gap-2"
                        title="Add new supplier"
                      >
                        <i className="bi bi-plus-circle text-lg"></i>
                        <span className="hidden sm:inline">New</span>
                      </button>
                    </div>
                  </div>
                  
                  {!createForm.data.supplier_id && (
                    <div className="relative">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                        <i className="bi bi-pencil text-blue-500"></i>
                        Or Enter New Supplier Name
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Enter new supplier name..." 
                          value={createForm.data.supplier_name} 
                          onChange={e => createForm.setData('supplier_name', e.target.value)} 
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl transition-all duration-200 text-gray-900 font-medium"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-person-plus text-gray-400"></i>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {createForm.errors.supplier_name && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <i className="bi bi-exclamation-circle-fill text-red-500"></i>
                      <p className="text-red-600 text-sm font-medium">{createForm.errors.supplier_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Medicine & Order Details Section */}
              <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 shadow-lg border-2 border-green-200 hover:border-green-300 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <i className="bi bi-capsule text-white text-2xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Order Details</h4>
                    <p className="text-sm text-gray-600">Medicine selection and quantities</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                      <i className="bi bi-asterisk text-red-500 text-xs"></i>
                      Medicine
                    </label>
                    <div className="relative">
                      <select 
                        value={createForm.data.medicine_id} 
                        onChange={e => createForm.setData('medicine_id', e.target.value)} 
                        className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-2xl transition-all duration-200 text-gray-900 font-medium"
                      >
                        <option value="">Select medicine to order...</option>
                        {availableMedicines.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.brand ? `(${m.brand})` : ''} • Stock: {m.quantity || 0}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <i className="bi bi-capsule text-gray-400"></i>
                      </div>
                    </div>
                    {createForm.errors.medicine_id && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mt-2">
                        <i className="bi bi-exclamation-circle-fill text-red-500"></i>
                        <p className="text-red-600 text-sm font-medium">{createForm.errors.medicine_id}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                        <i className="bi bi-asterisk text-red-500 text-xs"></i>
                        Quantity
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          min="1"
                          value={createForm.data.quantity} 
                          onChange={e => createForm.setData('quantity', parseInt(e.target.value) || 0)} 
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-2xl transition-all duration-200 text-gray-900 font-medium"
                          placeholder="Enter quantity"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-123 text-gray-400"></i>
                        </div>
                      </div>
                      {createForm.errors.quantity && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-xl mt-2">
                          <i className="bi bi-exclamation-circle-fill text-red-500 text-sm"></i>
                          <p className="text-red-600 text-xs font-medium">{createForm.errors.quantity}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                        <i className="bi bi-asterisk text-red-500 text-xs"></i>
                        Unit Cost (UGX)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          value={createForm.data.unit_cost} 
                          onChange={e => createForm.setData('unit_cost', e.target.value)} 
                          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-2xl transition-all duration-200 text-gray-900 font-medium"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <span className="text-gray-400 font-bold">UGX</span>
                        </div>
                      </div>
                      {createForm.errors.unit_cost && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-xl mt-2">
                          <i className="bi bi-exclamation-circle-fill text-red-500 text-sm"></i>
                          <p className="text-red-600 text-xs font-medium">{createForm.errors.unit_cost}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total Calculation Display */}
                  {createForm.data.quantity > 0 && createForm.data.unit_cost > 0 && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <i className="bi bi-calculator text-blue-600"></i>
                          <span className="font-bold text-gray-800">Total Amount:</span>
                        </div>
                        <div className="text-2xl font-black text-blue-600">
                          UGX {(createForm.data.quantity * parseFloat(createForm.data.unit_cost || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Additional Information Section */}
              <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-lg border-2 border-purple-200 hover:border-purple-300 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <i className="bi bi-credit-card text-white text-2xl"></i>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Payment & Notes</h4>
                    <p className="text-sm text-gray-600">Payment method and additional information</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                      <i className="bi bi-credit-card text-purple-500"></i>
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'cash', icon: 'bi-cash-stack', label: 'Cash', color: 'green' },
                        { value: 'mobile_money', icon: 'bi-phone', label: 'Mobile Money', color: 'blue' },
                        { value: 'bank_transfer', icon: 'bi-bank', label: 'Bank Transfer', color: 'indigo' },
                        { value: 'credit', icon: 'bi-credit-card', label: 'Credit', color: 'purple' }
                      ].map(method => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => createForm.setData('payment_method', method.value)}
                          className={`p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                            createForm.data.payment_method === method.value
                              ? `border-${method.color}-500 bg-${method.color}-50 text-${method.color}-700`
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <i className={`${method.icon} text-2xl`}></i>
                            <span className="text-sm font-bold">{method.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
                      <i className="bi bi-chat-text text-purple-500"></i>
                      Additional Notes (Optional)
                    </label>
                    <div className="relative">
                      <textarea 
                        value={createForm.data.notes} 
                        onChange={e => createForm.setData('notes', e.target.value)} 
                        rows="4" 
                        className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-2xl transition-all duration-200 text-gray-900 resize-none"
                        placeholder="Enter any special instructions, delivery requirements, or additional notes..."
                      />
                      <div className="absolute top-4 left-0 flex items-center pl-4 pointer-events-none">
                        <i className="bi bi-chat-text text-gray-400"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-12 py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-2xl hover:shadow-2xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  <i className="bi bi-check-circle-fill"></i>
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </Modal>

        <Modal show={isReceiveOpen} onClose={() => setIsReceiveOpen(false)} maxWidth="lg">
          <div className={`p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                <i className="bi bi-box-arrow-in-down text-3xl text-white"></i>
              </div>
              <div>
                <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Receive Order</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Mark order as received</p>
              </div>
            </div>
            {selectedPurchase && (
              <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} mb-6`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>PO Number</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPurchase.purchase_order}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Supplier</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPurchase.supplier_name}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Medicine</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPurchase.medicine?.name}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ordered Quantity</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPurchase.quantity}</p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleReceive} className="space-y-5">
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Received Quantity</label>
                <input type="number" value={receiveForm.data.received_quantity} onChange={e => receiveForm.setData('received_quantity', parseInt(e.target.value) || 0)} className={`w-full px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'} focus:ring-4 focus:ring-green-300`} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  <i className="bi bi-check-circle mr-2"></i>Confirm Receipt
                </button>
                <button type="button" onClick={() => setIsReceiveOpen(false)} className={`px-6 py-3 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-all`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>

        <Modal show={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} maxWidth="md">
          <div className={`p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl">
                <i className="bi bi-exclamation-triangle text-3xl text-white"></i>
              </div>
              <div>
                <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete Order</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This action cannot be undone</p>
              </div>
            </div>
            {selectedPurchase && (
              <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} mb-6`}>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Are you sure you want to delete this purchase order?</p>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPurchase.purchase_order} - {selectedPurchase.supplier_name}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { 
                // Dispatch activity event before deleting
                setTimeout(() => {
                  const activityDetail = { 
                    id: `purchase-delete-${Date.now()}`,
                    type: 'alert', 
                    title: 'Purchase Order Deleted', 
                    description: `Deleted order ${selectedPurchase.purchase_order} from ${selectedPurchase.supplier_name}`,
                    details: `Medicine: ${selectedPurchase.medicine?.name || 'N/A'} • Quantity: ${selectedPurchase.quantity}`,
                    amount: parseFloat(selectedPurchase.total_amount),
                    time: new Date().toISOString(),
                    priority: 'high',
                    route: '/purchases'
                  };
                  console.log('Dispatching purchase delete activity:', activityDetail);
                  window.dispatchEvent(new CustomEvent('newActivity', { detail: activityDetail }));
                }, 100);
                deletePurchase(selectedPurchase.id); 
                setIsDeleteOpen(false); 
                setSelectedPurchase(null); 
              }} className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                <i className="bi bi-trash mr-2"></i>Delete Order
              </button>
              <button onClick={() => setIsDeleteOpen(false)} className={`px-6 py-3 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-all`}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>

        {/* Quick Supplier Creation Modal */}
        <Modal show={isQuickSupplierOpen} onClose={() => setIsQuickSupplierOpen(false)} maxWidth="2xl">
          <div className={`p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                <i className="bi bi-person-plus text-3xl text-white"></i>
              </div>
              <div>
                <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Add Supplier</h2>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create a new supplier for this purchase order</p>
              </div>
            </div>
            <form onSubmit={handleQuickSupplierCreate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <i className="bi bi-asterisk text-red-500 text-xs mr-1"></i>Supplier Name
                  </label>
                  <input 
                    type="text" 
                    value={quickSupplierForm.data.name} 
                    onChange={e => quickSupplierForm.setData('name', e.target.value)} 
                    className={`w-full px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'} focus:ring-4 focus:ring-green-300`} 
                    placeholder="Enter supplier name"
                    required
                  />
                  {quickSupplierForm.errors.name && <p className="text-red-500 text-sm mt-1">{quickSupplierForm.errors.name}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <i className="bi bi-asterisk text-red-500 text-xs mr-1"></i>Phone Number
                  </label>
                  <input 
                    type="tel" 
                    value={quickSupplierForm.data.phone} 
                    onChange={e => quickSupplierForm.setData('phone', e.target.value)} 
                    className={`w-full px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'} focus:ring-4 focus:ring-green-300`} 
                    placeholder="0700123456"
                    required
                  />
                  {quickSupplierForm.errors.phone && <p className="text-red-500 text-sm mt-1">{quickSupplierForm.errors.phone}</p>}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                <input 
                  type="email" 
                  value={quickSupplierForm.data.email} 
                  onChange={e => quickSupplierForm.setData('email', e.target.value)} 
                  className={`w-full px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'} focus:ring-4 focus:ring-green-300`} 
                  placeholder="supplier@example.com"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</label>
                <textarea 
                  value={quickSupplierForm.data.address} 
                  onChange={e => quickSupplierForm.setData('address', e.target.value)} 
                  rows="3" 
                  className={`w-full px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'} focus:ring-4 focus:ring-green-300`} 
                  placeholder="Enter supplier address..."
                ></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  <i className="bi bi-check-circle mr-2"></i>Create & Select Supplier
                </button>
                <button type="button" onClick={() => setIsQuickSupplierOpen(false)} className={`px-6 py-3 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-all`}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Supplier Details Modal */}
        <Modal show={isSupplierDetailsOpen} onClose={() => setIsSupplierDetailsOpen(false)} maxWidth="2xl">
          <div className={`p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {selectedSupplier && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                    <i className="bi bi-building text-3xl text-white"></i>
                  </div>
                  <div>
                    <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedSupplier.name}</h2>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Supplier Performance Overview</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} text-center`}>
                    <div className={`text-3xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                      {selectedSupplier.count}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</div>
                  </div>
                  <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} text-center`}>
                    <div className={`text-3xl font-black ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>
                      UGX {selectedSupplier.totalAmount.toLocaleString()}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Value</div>
                  </div>
                  <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} text-center`}>
                    <div className={`text-lg font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-2`}>
                      {selectedSupplier.lastOrder ? new Date(selectedSupplier.lastOrder).toLocaleDateString() : 'Never'}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Order</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setIsSupplierDetailsOpen(false);
                      router.visit('/suppliers');
                    }} 
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                  >
                    <i className="bi bi-arrow-right mr-2"></i>View All Suppliers
                  </button>
                  <button 
                    onClick={() => {
                      setIsSupplierDetailsOpen(false);
                      createForm.setData('supplier_name', selectedSupplier.name);
                      setIsCreateOpen(true);
                    }} 
                    className={`px-6 py-3 rounded-xl font-bold ${darkMode ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-all`}
                  >
                    <i className="bi bi-plus-circle mr-2"></i>New Order
                  </button>
                  <button onClick={() => setIsSupplierDetailsOpen(false)} className={`px-6 py-3 rounded-xl font-bold ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-all`}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
