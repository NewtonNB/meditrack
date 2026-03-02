import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
// Using fresh data from props instead of hooks to avoid stale data issues
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useRealTimeUpdates, dispatchUpdateEvent } from '@/Hooks/useRealTimeUpdates';

export default function Sales() {
  const { props } = usePage();
  
  // Use fresh data from props instead of potentially stale hooks
  const availableMedicines = props.medicines || [];
  const availableCustomers = props.customers || []; // Real customers only
  const sales = props.sales?.data || props.sales || [];
  
  // Permission checks - extract from props or set defaults
  const canManage = props.canManage || props.canEdit || false;
  const canViewCosts = props.canViewCosts || false;
  const userRole = props.auth?.user?.role || 'cashier';
  
  // Allow sales management for cashiers and above
  const canManageSales = canManage || ['cashier', 'pharmacist', 'pharmacy_admin', 'super_admin'].includes(userRole);
  const canDeleteSales = ['pharmacy_admin', 'super_admin'].includes(userRole);

  // Helper function to safely get customer name
  const getCustomerName = (sale) => {
    // If customer is a string (direct name), return it
    if (typeof sale.customer === 'string' && sale.customer.trim()) {
      return sale.customer.trim();
    }
    
    // If customer is an object with name property
    if (sale.customer && typeof sale.customer === 'object' && sale.customer.name) {
      return sale.customer.name.trim();
    }
    
    // If there's a customer_id, try to find the customer in available customers
    if (sale.customer_id && availableCustomers.length > 0) {
      const customer = availableCustomers.find(c => c.id === sale.customer_id);
      if (customer && customer.name) {
        return customer.name.trim();
      }
    }
    
    // Fallback to Walk-in Customer instead of Unknown Customer
    return 'Walk-in Customer';
  };
  const [query, setQuery] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [paymentFilter, setPaymentFilter] = React.useState('');
  const [customerFilter, setCustomerFilter] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState(new Date());
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Check if we have a customer filter from URL params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const customerParam = urlParams.get('customer');
    if (customerParam) {
      setCustomerFilter(customerParam);
    }
  }, []);
  
  // Modal states
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isRefundOpen, setIsRefundOpen] = React.useState(false);
  const [selectedSale, setSelectedSale] = React.useState(null);

  // State for bulk/pack sales - 3 tier system
  const [saleUnit, setSaleUnit] = React.useState('units'); // 'units', 'packets', or 'boxes'
  const [packetSize, setPacketSize] = React.useState(1); // How many units in a packet
  const [boxSize, setBoxSize] = React.useState(1); // How many units in a box

  // Forms
  const createForm = useForm({
    customer: '',
    customer_phone: '',
    medicine_id: '',
    quantity: 1,
    unit_price: '',
    payment_method: 'cash',
    notes: '',
  });

  const editForm = useForm({
    customer: '',
    customer_phone: '',
    medicine_id: '',
    quantity: 1,
    unit_price: '',
    payment_method: 'cash',
    notes: '',
  });

  const refundForm = useForm({
    reason: '',
    refund_amount: '',
    notes: '',
  });

  const deleteForm = useForm({});

  // Use real-time updates hook
  useRealTimeUpdates({
    pageName: 'sales',
    dataKeys: ['sales', 'medicines', 'customers', 'stats'],
    onUpdate: (eventType, data) => {
      console.log(`Sales page updated due to: ${eventType}`, JSON.stringify(data));
      setLastUpdated(new Date());
    }
  });

  React.useEffect(() => {
    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (paymentMethod) => {
    switch (paymentMethod) {
      case 'cash': return 'text-green-600';
      case 'mobile_money': return 'text-blue-600';
      case 'card': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (paymentMethod) => {
    switch (paymentMethod) {
      case 'cash': return 'bi-cash-coin';
      case 'mobile_money': return 'bi-phone';
      case 'card': return 'bi-credit-card';
      default: return 'bi-question-circle';
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setIsRefundOpen(false);
    setSelectedSale(null);
    createForm.reset();
    setIsCreateOpen(true);
  };

  const openEditModal = (sale) => {
    setIsCreateOpen(false);
    setIsDeleteOpen(false);
    setIsRefundOpen(false);
    setSelectedSale(sale);
    editForm.setData({
      customer: sale.customer || '',
      customer_phone: sale.customer_phone || '',
      medicine_id: sale.medicine?.id || '',
      quantity: sale.quantity || 1,
      unit_price: sale.unit_price || '',
      payment_method: sale.payment_method || 'cash',
      notes: sale.notes || '',
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (sale) => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsRefundOpen(false);
    setSelectedSale(sale);
    setIsDeleteOpen(true);
  };

  const openRefundModal = (sale) => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedSale(sale);
    refundForm.setData({
      reason: '',
      refund_amount: sale.total_price || sale.total,
      notes: '',
    });
    setIsRefundOpen(true);
  };

  const handleCreateSale = (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || createForm.processing) {
      console.log('Form already submitting, ignoring...');
      return;
    }
    
    console.log('Create Sale button clicked!');
    console.log('Form data:', JSON.stringify(createForm.data));
    console.log('User permissions:', JSON.stringify({ canManageSales, userRole }));
    
    // Set submitting state
    setIsSubmitting(true);
    
    // Clear previous errors
    createForm.clearErrors();
    
    // Custom validation
    const errors = {};
    
    // Validate customer
    if (!createForm.data.customer || createForm.data.customer.trim() === '') {
      errors.customer = 'Customer name is required';
    }
    
    // Validate customer phone (if provided)
    if (createForm.data.customer_phone && createForm.data.customer_phone.trim() !== '') {
      const phoneRegex = /^(\+256|0)[0-9]{9}$/;
      if (!phoneRegex.test(createForm.data.customer_phone.replace(/\s/g, ''))) {
        errors.customer_phone = 'Invalid phone format. Use 0700123456 or +256700123456';
      }
    }
    
    // Validate medicine selection
    if (!createForm.data.medicine_id || createForm.data.medicine_id === '') {
      errors.medicine_id = 'Please select a medicine from inventory';
    } else {
      // Check if medicine has sufficient stock
      const selectedMedicine = availableMedicines.find(m => m.id.toString() === createForm.data.medicine_id);
      if (selectedMedicine && selectedMedicine.stock < createForm.data.quantity) {
        errors.medicine_id = `Insufficient stock. Only ${selectedMedicine.stock} units available`;
      }
    }
    
    // Validate quantity
    if (!createForm.data.quantity || createForm.data.quantity <= 0) {
      errors.quantity = 'Quantity must be at least 1';
    } else if (createForm.data.quantity > 10000) {
      errors.quantity = 'Quantity seems unreasonably high';
    } else if (!Number.isInteger(Number(createForm.data.quantity))) {
      errors.quantity = 'Quantity must be a whole number';
    }
    
    // Validate unit price - auto-set from medicine if missing
    if (!createForm.data.unit_price || createForm.data.unit_price === '') {
      // Try to get price from selected medicine
      const selectedMedicine = availableMedicines.find(m => m.id.toString() === createForm.data.medicine_id);
      if (selectedMedicine && (selectedMedicine.price || selectedMedicine.selling_price)) {
        const autoPrice = selectedMedicine.price || selectedMedicine.selling_price;
        createForm.setData('unit_price', autoPrice.toString());
        console.log('Auto-set unit price to:', autoPrice);
      } else {
        errors.unit_price = 'Unit price is required';
      }
    } else {
      const price = parseFloat(createForm.data.unit_price);
      if (isNaN(price) || price <= 0) {
        errors.unit_price = 'Unit price must be greater than 0';
      } else if (price > 10000000) {
        errors.unit_price = 'Unit price seems unreasonably high';
      }
    }
    
    // Validate payment method
    if (!createForm.data.payment_method || createForm.data.payment_method === '') {
      errors.payment_method = 'Please select a payment method';
    }
    
    // Validate notes length (if provided)
    if (createForm.data.notes && createForm.data.notes.length > 500) {
      errors.notes = 'Notes must not exceed 500 characters';
    }
    
    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      Object.keys(errors).forEach(key => {
        createForm.setError(key, errors[key]);
      });
      
      // Reset submitting state
      setIsSubmitting(false);
      
      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('.text-red-600');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      return;
    }
    
    // All validation passed - Submit to backend
    const selectedMedicine = availableMedicines.find(m => m.id.toString() === createForm.data.medicine_id);
    
    const totalAmount = createForm.data.quantity * parseFloat(createForm.data.unit_price);
    
    // Submit to backend to create sale and stock movement
    console.log('Submitting to backend...', route('sales.store'));
    
    // Disable form during submission to prevent double-clicks
    createForm.processing = true;
    
    createForm.post(route('sales.store'), {
      preserveState: false, // Allow full refresh for better reliability
      preserveScroll: false,
      onSuccess: (response) => {
        console.log('Sale creation successful:', response);
        
        // Show success message
        const customerName = createForm.data.customer;
        const medicineName = selectedMedicine?.name || 'Medicine';
        const quantity = createForm.data.quantity;
        const total = (createForm.data.quantity * parseFloat(createForm.data.unit_price)).toLocaleString();
        
        // Close modal and reset form immediately
        setIsCreateOpen(false);
        createForm.reset();
        setLastUpdated(new Date());
        
        // Show success notification
        alert(`✅ Sale Created Successfully!\n\nCustomer: ${customerName}\nMedicine: ${medicineName}\nQuantity: ${quantity} units\nTotal: UGX ${total}\n\nThe sale has been recorded and stock updated.`);
        
        // Dispatch update events to notify other pages (but don't wait for reload)
        setTimeout(() => {
          dispatchUpdateEvent('saleCreated', {
            sale: response,
            medicine: selectedMedicine,
            customer: createForm.data.customer,
            quantity: createForm.data.quantity,
            totalAmount: createForm.data.quantity * parseFloat(createForm.data.unit_price)
          }, ['dashboard', 'medicines', 'stock-movements', 'customers']);
        }, 100);
      },
      onError: (errors) => {
        console.error('Sale creation failed:', errors);
        
        // Handle specific error types
        if (errors.message && errors.message.includes('419')) {
          alert('Session expired. Please refresh the page and try again.');
          window.location.reload();
        } else if (errors.message && errors.message.includes('CSRF')) {
          alert('Security token expired. Please refresh the page and try again.');
          window.location.reload();
        } else {
          alert('Error creating sale. Please check your input and try again.');
        }
      },
      onFinish: () => {
        console.log('Form submission finished');
        createForm.processing = false;
        setIsSubmitting(false);
      }
    });
    
    // Let the backend handle everything - no local state updates needed
  };

  const handleEditSale = (e) => {
    e.preventDefault();
    
    if (!selectedSale) return;
    
    editForm.put(route('sales.update', selectedSale.id), {
      onSuccess: (response) => {
        setIsEditOpen(false);
        setSelectedSale(null);
        editForm.reset();
        
        // Refresh all related data
        router.reload({
          only: ['sales', 'medicines', 'customers', 'stats'],
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            console.log('Sales page data refreshed after edit');
            setLastUpdated(new Date());
            
            // Dispatch update events to notify other pages
            dispatchUpdateEvent('saleUpdated', {
              sale: response
            }, ['dashboard', 'medicines', 'stock-movements', 'customers']);
          }
        });
      },
      onError: (errors) => {
        console.error('Edit sale errors:', errors);
      }
    });
  };

  const handleDeleteSale = () => {
    if (!selectedSale) return;
    
    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you absolutely sure you want to delete this sale?\n\n` +
      `Invoice: ${selectedSale.invoice || `INV-${String(selectedSale.id).padStart(6, '0')}`}\n` +
      `Customer: ${getCustomerName(selectedSale)}\n` +
      `Medicine: ${typeof selectedSale.medicine === 'string' ? selectedSale.medicine : selectedSale.medicine?.name}\n` +
      `Amount: UGX ${Number(selectedSale.total_price || selectedSale.total || 0).toLocaleString()}\n\n` +
      `This action cannot be undone and will restore stock levels.`
    );
    
    if (!confirmDelete) return;
    
    deleteForm.delete(route('sales.destroy', selectedSale.id), {
      onSuccess: (response) => {
        console.log('Sale deleted successfully:', response);
        
        setIsDeleteOpen(false);
        setSelectedSale(null);
        deleteForm.reset();
        setLastUpdated(new Date());
        
        // Show success message
        alert(`✅ Sale Deleted Successfully!\n\nThe sale has been removed and stock levels have been restored.`);
        
        // Dispatch update events to notify other pages
        setTimeout(() => {
          dispatchUpdateEvent('saleDeleted', {
            sale: selectedSale,
            timestamp: new Date()
          }, ['dashboard', 'medicines', 'stock-movements']);
        }, 100);
      },
      onError: (errors) => {
        console.error('Sale deletion failed:', errors);
        
        if (errors.error) {
          alert(`Error: ${errors.error}`);
        } else {
          alert('Error deleting sale. Please check your permissions and try again.');
        }
      },
      onFinish: () => {
        console.log('Delete operation finished');
      }
    });
  };

  const handleRefund = (e) => {
    e.preventDefault();
    
    if (!selectedSale) return;
    
    // Validate refund form
    refundForm.clearErrors();
    const errors = {};
    
    if (!refundForm.data.reason || refundForm.data.reason.trim() === '') {
      errors.reason = 'Refund reason is required';
    }
    
    if (!refundForm.data.refund_amount || parseFloat(refundForm.data.refund_amount) <= 0) {
      errors.refund_amount = 'Refund amount must be greater than 0';
    } else if (parseFloat(refundForm.data.refund_amount) > parseFloat(selectedSale.total_price || selectedSale.total)) {
      errors.refund_amount = 'Refund amount cannot exceed sale total';
    }
    
    if (Object.keys(errors).length > 0) {
      Object.keys(errors).forEach(key => {
        refundForm.setError(key, errors[key]);
      });
      return;
    }
    
    console.log('Processing refund for sale:', selectedSale.id, refundForm.data);
    
    refundForm.post(route('sales.refund', selectedSale.id), {
      onSuccess: (response) => {
        console.log('Refund processed successfully:', response);
        
        setIsRefundOpen(false);
        setSelectedSale(null);
        refundForm.reset();
        setLastUpdated(new Date());
        
        // Show success message
        const refundAmount = parseFloat(refundForm.data.refund_amount);
        const saleTotal = parseFloat(selectedSale.total_price || selectedSale.total);
        const isFullRefund = refundAmount >= saleTotal;
        
        alert(`✅ Refund Processed Successfully!\n\n` +
              `Amount: UGX ${refundAmount.toLocaleString()}\n` +
              `Type: ${isFullRefund ? 'Full Refund' : 'Partial Refund'}\n` +
              `${isFullRefund ? 'Stock has been restored to inventory.' : ''}`);
        
        // Dispatch update events to notify other pages
        setTimeout(() => {
          dispatchUpdateEvent('saleRefunded', {
            sale: selectedSale,
            refundAmount: refundAmount,
            isFullRefund: isFullRefund,
            timestamp: new Date()
          }, ['dashboard', 'medicines', 'stock-movements']);
        }, 100);
      },
      onError: (errors) => {
        console.error('Refund processing failed:', errors);
        
        // Handle specific validation errors
        if (errors.refund_amount) {
          refundForm.setError('refund_amount', errors.refund_amount);
        }
        if (errors.reason) {
          refundForm.setError('reason', errors.reason);
        }
        
        if (!errors.refund_amount && !errors.reason) {
          alert('Error processing refund. Please check your input and try again.');
        }
      },
      onFinish: () => {
        console.log('Refund operation finished');
      }
    });
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales.filter(s => {
      if (q) {
        const medicineName = typeof s.medicine === 'string' ? s.medicine : s.medicine?.name || '';
        const customerName = getCustomerName(s);
        const match = (customerName + ' ' + medicineName + ' ' + (s.invoice || '')).toLowerCase();
        if (!match.includes(q)) return false;
      }
      if (dateFrom && new Date(s.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.date) > new Date(dateTo)) return false;
      if (paymentFilter && s.payment_method !== paymentFilter) return false;
      if (customerFilter) {
        const customerName = getCustomerName(s);
        if (!customerName.toLowerCase().includes(customerFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [sales, query, dateFrom, dateTo, paymentFilter, customerFilter]);

  const totalRevenue = filtered.reduce((sum, s) => sum + (Number(s.total_price || s.total) || 0), 0);
  const totalTransactions = filtered.length;
  const topMedicine = React.useMemo(() => {
    const counts = {};
    sales.forEach(s => {
      const medicineName = typeof s.medicine === 'string' ? s.medicine : s.medicine?.name || 'Unknown';
      counts[medicineName] = (counts[medicineName] || 0) + s.quantity;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] ?? '-';
  }, [sales]);

  const exportCSV = () => {
    const headers = ['Invoice', 'Date', 'Customer', 'Medicine', 'Quantity', 'Total'];
    const rows = filtered.map(s => [
      s.invoice ?? '',
      s.date,
      getCustomerName(s),
      typeof s.medicine === 'string' ? s.medicine : s.medicine?.name || '',
      s.quantity,
      s.total_price || s.total,
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetails = s => {
    setSelectedSale(s);
    setIsDetailOpen(true);
  };

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Sales</h2>}
    >
      <Head>
        <title>Sales Management</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div 
        className={`min-h-screen transition-all duration-500 ${
          darkMode 
            ? 'bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900' 
            : 'bg-gradient-to-br from-accent-50 via-primary-50 to-neutral-50'
        }`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Floating Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${darkMode ? 'bg-blue-500/10' : 'bg-yellow-200/30'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute top-3/4 right-1/4 w-96 h-96 ${darkMode ? 'bg-purple-500/10' : 'bg-pink-200/30'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
          <div className={`absolute top-1/2 left-1/2 w-80 h-80 ${darkMode ? 'bg-indigo-500/10' : 'bg-blue-200/30'} rounded-full blur-3xl animate-pulse delay-500`}></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6">
        {/* Enhanced Modern Header */}
        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 mb-8 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-yellow-400 to-orange-500'} flex items-center justify-center shadow-lg`}>
                <i className="bi bi-receipt text-2xl text-white"></i>
              </div>
              <div>
                <h1 className={`text-4xl font-black ${darkMode ? 'bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent'}`}>
                  Sales Management
                </h1>
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                  Track revenue, manage transactions, and analyze sales performance
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${canManageSales ? (darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') : (darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700')}`}>
                    <i className={`bi ${canManageSales ? 'bi-check-circle-fill' : 'bi-eye-fill'}`}></i>
                    <span className="text-sm font-medium">
                      {canManageSales ? 'Full Access' : 'View Only'}
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <span className="text-sm">Role: {userRole}</span>
                  </div>
                  <button
                    onClick={() => window.location.href = '/customers'}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                  >
                    <i className="bi bi-people-fill"></i>
                    <span className="text-sm font-medium">Manage Customers</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  darkMode 
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className={`bi ${darkMode ? 'bi-sun-fill' : 'bi-moon-fill'} text-xl`}></i>
              </button>
              
              {/* Refresh Button */}
              <button
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 1000);
                }}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  darkMode 
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                } ${isLoading ? 'animate-spin' : ''}`}
              >
                <i className="bi bi-arrow-clockwise text-xl"></i>
              </button>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Live Data
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {canManageSales && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              <PrimaryButton onClick={openCreateModal}>
                <i className="bi bi-plus-lg me-2"></i>New Sale
              </PrimaryButton>
              <SecondaryButton onClick={() => window.print()}>
                <i className="bi bi-printer me-2"></i>Print Report
              </SecondaryButton>
            </div>
            <div className="flex gap-2">
              <SecondaryButton onClick={exportCSV}>
                <i className="bi bi-download me-2"></i>Export CSV
              </SecondaryButton>
              <SecondaryButton
                onClick={() => {
                  setQuery('');
                  setDateFrom('');
                  setDateTo('');
                  setPaymentFilter('');
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>Clear Filters
              </SecondaryButton>
            </div>
          </div>
        )}

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>
                  Total Revenue
                </div>
                <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                  UGX {totalRevenue.toLocaleString()}
                </div>
                <div className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'} flex items-center gap-1`}>
                  <i className="bi bi-arrow-up"></i>
                  <span>+12% from last month</span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}>
                <i className={`bi bi-cash-coin text-2xl ${darkMode ? 'text-green-400' : 'text-green-600'}`}></i>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Average Sale Card */}
          <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-accent-500/20 to-primary-600/20 border-accent-500/30' : 'bg-gradient-to-br from-accent-50 to-primary-50 border-accent-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>
                  Average Sale
                </div>
                <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                  UGX {totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions).toLocaleString() : '0'}
                </div>
                <div className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'} flex items-center gap-1`}>
                  <i className="bi bi-arrow-up"></i>
                  <span>+8% improvement</span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center`}>
                <i className={`bi bi-graph-up text-2xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}></i>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Top Medicine Card */}
          <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-primary-500/20 to-neutral-600/20 border-primary-500/30' : 'bg-gradient-to-br from-primary-50 to-neutral-50 border-primary-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-2`}>
                  Top Medicine
                </div>
                <div className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1 truncate`}>
                  {topMedicine}
                </div>
                <div className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-600'} flex items-center gap-1`}>
                  <i className="bi bi-star-fill"></i>
                  <span>Best seller</span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'} flex items-center justify-center`}>
                <i className={`bi bi-capsule-pill text-2xl ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}></i>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Today's Sales Card */}
          <div className={`group relative overflow-hidden backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-orange-500/20 to-red-600/20 border-orange-500/30' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200/50'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${darkMode ? 'text-orange-400' : 'text-orange-600'} mb-2`}>
                  Today's Sales
                </div>
                <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                  {filtered.filter(s => s.date === new Date().toISOString().split('T')[0]).length}
                </div>
                <div className={`text-sm ${darkMode ? 'text-orange-300' : 'text-orange-600'} flex items-center gap-1`}>
                  <i className="bi bi-arrow-up"></i>
                  <span>+24% vs yesterday</span>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'} flex items-center justify-center`}>
                <i className={`bi bi-receipt-cutoff text-2xl ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}></i>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <i className={`bi bi-funnel text-xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}></i>
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filter & Search Sales</h3>
            {(query || dateFrom || dateTo || paymentFilter || customerFilter) && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-slate-600/30 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                {[query, dateFrom, dateTo, paymentFilter, customerFilter].filter(Boolean).length} active filters
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2 block`}>
                Search Sales
              </label>
              <div className="relative">
                <input
                  id="sales-search"
                  type="search"
                  placeholder="Customer, medicine, or invoice..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className={`w-full py-2 pl-10 pr-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
              </div>
            </div>

            {/* Customer Filter */}
            <div>
              <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2 block`}>
                Customer
              </label>
              <div className="relative">
                <select
                  value={customerFilter}
                  onChange={e => setCustomerFilter(e.target.value)}
                  className={`w-full py-2 pl-10 pr-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">All Customers</option>
                  {availableCustomers.map(customer => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <i className={`bi bi-person absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2 block`}>
                From Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className={`w-full py-2 pl-10 pr-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <i className={`bi bi-calendar absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2 block`}>
                To Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className={`w-full py-2 pl-10 pr-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <i className={`bi bi-calendar absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2 block`}>
                Payment Method
              </label>
              <div className="relative">
                <select
                  value={paymentFilter}
                  onChange={e => setPaymentFilter(e.target.value)}
                  className={`w-full py-2 pl-10 pr-4 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">All Methods</option>
                  <option value="cash">💵 Cash</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                  <option value="card">💳 Card</option>
                  <option value="credit">📋 Credit</option>
                </select>
                <i className={`bi bi-credit-card absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50">
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Showing {filtered.length} of {sales.length} sales
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setQuery('');
                  setDateFrom('');
                  setDateTo('');
                  setPaymentFilter('');
                  setCustomerFilter('');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-600/50 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <i className="bi bi-arrow-clockwise"></i>
                Clear All
              </button>
              <button
                onClick={() => window.print()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
              >
                <i className="bi bi-printer"></i>
                Print
              </button>
              <button
                onClick={exportCSV}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
              >
                <i className="bi bi-download"></i>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Modern Table with Better Borders */}
        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl border-2 ${darkMode ? 'border-gray-600/50' : 'border-gray-200/50'} shadow-2xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className={`${darkMode ? 'bg-gradient-to-r from-slate-700/40 to-gray-700/40' : 'bg-gradient-to-r from-slate-100 to-gray-100'} border-b-2 ${darkMode ? 'border-gray-600/50' : 'border-gray-300'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider border-r ${darkMode ? 'border-gray-600/30' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-calendar-event text-slate-500"></i>
                      Date & Time
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider border-r ${darkMode ? 'border-gray-600/30' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-receipt text-slate-500"></i>
                      Invoice
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider border-r ${darkMode ? 'border-gray-600/30' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-person-circle text-slate-500"></i>
                      Customer
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider border-r ${darkMode ? 'border-gray-600/30' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-capsule text-slate-500"></i>
                      Medicine
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider border-r ${darkMode ? 'border-gray-600/30' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-box text-slate-500"></i>
                      Quantity
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider border-r ${darkMode ? 'border-gray-600/30' : 'border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-currency-exchange text-slate-500"></i>
                      Total Amount
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-right text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wider`}>
                    <div className="flex items-center justify-end gap-2">
                      <i className="bi bi-gear text-slate-500"></i>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y-2 ${darkMode ? 'divide-gray-600/30' : 'divide-gray-200'}`}>
                {filtered.map((sale, index) => {
                  const customerName = getCustomerName(sale);
                  const customerInitials = customerName === 'Walk-in Customer' 
                    ? 'WC' 
                    : customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  
                  return (
                    <tr 
                      key={sale.id} 
                      className={`transition-all duration-300 hover:scale-[1.01] ${
                        darkMode 
                          ? 'hover:bg-gray-700/30 hover:shadow-lg hover:shadow-slate-500/10' 
                          : 'hover:bg-slate-50/50 hover:shadow-lg hover:shadow-slate-500/10'
                      } ${index % 2 === 0 ? (darkMode ? 'bg-gray-800/10' : 'bg-slate-50/30') : ''} group`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} border-r ${darkMode ? 'border-gray-600/20' : 'border-gray-200'}`}>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">
                            {sale.date || (sale.created_at ? new Date(sale.created_at).toLocaleDateString() : new Date().toLocaleDateString())}
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                            <i className="bi bi-clock text-xs"></i>
                            {sale.created_at ? new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Today'}
                          </span>
                        </div>
                      </td>
                      
                      <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-700'} border-r ${darkMode ? 'border-gray-600/20' : 'border-gray-200'}`}>
                        <div className="flex flex-col items-start">
                          <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${darkMode ? 'bg-gradient-to-r from-slate-600/30 to-gray-600/30 text-slate-300 border-2 border-slate-500/30' : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-2 border-slate-300'} shadow-sm`}>
                            {sale.invoice || `INV-${String(sale.id).padStart(6, '0')}`}
                          </span>
                          <span className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            ID: #{sale.id}
                          </span>
                        </div>
                      </td>
                      
                      <td className={`px-6 py-4 whitespace-nowrap border-r ${darkMode ? 'border-gray-600/20' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-gradient-to-br from-slate-600/30 to-gray-600/30 border border-slate-500/30' : 'bg-gradient-to-br from-slate-200 to-gray-200 border border-slate-300'} flex items-center justify-center shadow-sm`}>
                            <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              {customerInitials}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => window.location.href = `/customers?search=${encodeURIComponent(customerName)}`}
                              className={`text-sm font-bold hover:underline ${darkMode ? 'text-slate-300 hover:text-slate-200' : 'text-slate-600 hover:text-slate-700'} truncate block`}
                            >
                              {customerName}
                            </button>
                            {sale.customer_phone && (
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1 mt-1`}>
                                <i className="bi bi-telephone text-xs"></i>
                                <a href={`tel:${sale.customer_phone}`} className="hover:underline">
                                  {sale.customer_phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap border-r ${darkMode ? 'border-gray-600/20' : 'border-gray-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-gradient-to-br from-slate-600/30 to-gray-600/30 border border-slate-500/30' : 'bg-gradient-to-br from-slate-200 to-gray-200 border border-slate-300'} flex items-center justify-center shadow-sm`}>
                            <i className={`bi bi-capsule-pill text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'} truncate`}>
                              {typeof sale.medicine === 'string' ? sale.medicine : sale.medicine?.name || 'Unknown Medicine'}
                            </div>
                            {typeof sale.medicine === 'object' && sale.medicine?.brand && (
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1 mt-1`}>
                                <i className="bi bi-tag text-xs"></i>
                                {sale.medicine.brand}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className={`px-6 py-4 whitespace-nowrap border-r ${darkMode ? 'border-gray-600/20' : 'border-gray-200'}`}>
                        <div className="flex flex-col">
                          <span className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            {sale.quantity}
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            units
                          </span>
                          {sale.unit_price && (
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1 mt-1`}>
                              <i className="bi bi-at text-xs"></i>
                              UGX {Number(sale.unit_price).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className={`px-6 py-4 whitespace-nowrap border-r ${darkMode ? 'border-gray-600/20' : 'border-gray-200'}`}>
                        <div className="flex flex-col space-y-2">
                          <div className={`text-lg font-black ${sale.status === 'refunded' ? 'line-through text-red-500' : sale.status === 'partially_refunded' ? 'text-orange-600' : (darkMode ? 'text-green-400' : 'text-green-600')}`}>
                            UGX {Number(sale.total_price || sale.total || 0).toLocaleString()}
                          </div>
                          
                          {sale.refund_amount && (
                            <div className={`text-xs font-medium ${darkMode ? 'text-red-400' : 'text-red-600'} flex items-center gap-1 px-2 py-1 rounded-lg ${darkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                              <i className="bi bi-arrow-return-left"></i>
                              <span>Refunded: UGX {Number(sale.refund_amount).toLocaleString()}</span>
                            </div>
                          )}
                          
                          {sale.payment_method && (
                            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${getStatusColor(sale.payment_method)} border ${darkMode ? 'border-gray-600/30' : 'border-gray-200'}`}>
                              <i className={`bi ${getStatusIcon(sale.payment_method)}`}></i>
                              <span className="capitalize font-medium">{sale.payment_method.replace('_', ' ')}</span>
                            </div>
                          )}
                          
                          {sale.status && sale.status !== 'completed' && (
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border-2 ${
                              sale.status === 'refunded' 
                                ? (darkMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-200')
                                : sale.status === 'partially_refunded'
                                ? (darkMode ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-700 border-orange-200')
                                : ''
                            }`}>
                              <i className={`bi ${sale.status === 'refunded' ? 'bi-x-circle' : 'bi-exclamation-triangle'}`}></i>
                              <span className="capitalize">{sale.status.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={() => openDetails(sale)}
                            className={`p-2.5 rounded-xl transition-all duration-200 ${darkMode ? 'bg-slate-600/30 text-slate-300 hover:bg-slate-600/40 hover:scale-110 border border-slate-500/30' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 hover:scale-110 border border-slate-300'} shadow-sm`}
                            title="View Details"
                          >
                            <i className="bi bi-eye text-sm"></i>
                          </button>
                          {canManageSales && (
                            <>
                              <button
                                onClick={() => openEditModal(sale)}
                                className={`p-2.5 rounded-xl transition-all duration-200 ${darkMode ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/40 hover:scale-110 border border-amber-500/30' : 'bg-amber-200 text-amber-700 hover:bg-amber-300 hover:scale-110 border border-amber-300'} shadow-sm`}
                                title="Edit Sale"
                              >
                                <i className="bi bi-pencil text-sm"></i>
                              </button>
                              <button
                                onClick={() => openRefundModal(sale)}
                                disabled={sale.status === 'refunded'}
                                className={`p-2.5 rounded-xl transition-all duration-200 ${
                                  sale.status === 'refunded' 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 border border-gray-300'
                                    : (darkMode ? 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/40 hover:scale-110 border border-indigo-500/30' : 'bg-indigo-200 text-indigo-700 hover:bg-indigo-300 hover:scale-110 border border-indigo-300')
                                } shadow-sm`}
                                title={sale.status === 'refunded' ? 'Sale already refunded' : 'Process Refund'}
                              >
                                <i className="bi bi-arrow-return-left text-sm"></i>
                              </button>
                              {canDeleteSales && (
                                <button
                                  onClick={() => openDeleteModal(sale)}
                                  className={`p-2.5 rounded-xl transition-all duration-200 ${darkMode ? 'bg-red-600/30 text-red-400 hover:bg-red-600/40 hover:scale-110 border border-red-500/30' : 'bg-red-200 text-red-700 hover:bg-red-300 hover:scale-110 border border-red-300'} shadow-sm`}
                                  title="Delete Sale"
                                >
                                  <i className="bi bi-trash text-sm"></i>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className={`px-6 py-16 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} border-t-2 ${darkMode ? 'border-gray-600/30' : 'border-gray-200'}`}>
                      <div className="flex flex-col items-center">
                        <div className={`w-20 h-20 rounded-2xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'} flex items-center justify-center mb-6`}>
                          <i className={`bi bi-receipt text-3xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          No sales found
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-4 max-w-md`}>
                          {query || dateFrom || dateTo || paymentFilter || customerFilter 
                            ? 'No sales match your current filters. Try adjusting your search criteria.'
                            : 'No sales have been recorded yet. Create your first sale to get started.'
                          }
                        </p>
                        {canManageSales && (
                          <button
                            onClick={() => setIsCreateOpen(true)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                              darkMode 
                                ? 'bg-slate-600/30 text-slate-300 hover:bg-slate-600/40 border border-slate-500/30' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
                            }`}
                          >
                            <i className="bi bi-plus-lg"></i>
                            Create First Sale
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

        {/* Enhanced Detail Modal */}
        <Modal show={isDetailOpen} onClose={() => setIsDetailOpen(false)} maxWidth="3xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                  <i className="bi bi-receipt text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sale Transaction Details</h3>
                  <p className="text-gray-500">Complete invoice and customer information</p>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setIsDetailOpen(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {selectedSale ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Customer & Invoice Info */}
                <div className="lg:col-span-1">
                  {/* Invoice Header */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 mb-6 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-3">
                      <i className="bi bi-receipt-cutoff text-yellow-600 text-xl"></i>
                      <div>
                        <h4 className="font-bold text-gray-900">Invoice Details</h4>
                        <p className="text-xs text-gray-600">Transaction information</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Invoice #:</span>
                        <span className="font-medium text-gray-900">{selectedSale.invoice ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">{selectedSale.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Time:</span>
                        <span className="font-medium text-gray-900">
                          {selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-xl p-4 border border-accent-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {selectedSale.customer && typeof selectedSale.customer === 'string' ? selectedSale.customer.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Customer Information</h4>
                        <p className="text-xs text-gray-600">Contact details</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Name</div>
                        <div className="font-medium text-gray-900">{getCustomerName(selectedSale)}</div>
                      </div>
                      {selectedSale.customer_phone && (
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone Number</div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${selectedSale.customer_phone}`}
                              className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <i className="bi bi-telephone"></i>
                              {selectedSale.customer_phone}
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="pt-2 border-t border-blue-200">
                        <button
                          onClick={() => window.location.href = `/customers?search=${encodeURIComponent(selectedSale.customer)}`}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <i className="bi bi-person-circle"></i>
                          View Customer Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Medicine & Transaction Details */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 gap-6">

                    {/* Medicine Information */}
                    <div className="bg-gradient-to-br from-primary-50 to-neutral-50 rounded-xl p-4 border border-primary-200">
                      <div className="flex items-center gap-3 mb-4">
                        <i className="bi bi-capsule-pill text-primary-600 text-xl"></i>
                        <div>
                          <h4 className="font-bold text-gray-900">Medicine Details</h4>
                          <p className="text-xs text-gray-600">Product information</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Medicine Name</div>
                          <div className="font-medium text-gray-900">
                            {typeof selectedSale.medicine === 'string' ? selectedSale.medicine : selectedSale.medicine?.name || 'Unknown Medicine'}
                          </div>
                        </div>
                        {typeof selectedSale.medicine === 'object' && selectedSale.medicine?.brand && (
                          <div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Brand</div>
                            <div className="font-medium text-gray-900">{selectedSale.medicine?.brand || 'N/A'}</div>
                          </div>
                        )}
                        <div className="pt-2 border-t border-purple-200">
                          <button
                            onClick={() => window.location.href = '/medicines'}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            <i className="bi bi-box-seam"></i>
                            View Medicine Inventory
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Summary */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <i className="bi bi-calculator text-green-600 text-xl"></i>
                        <div>
                          <h4 className="font-bold text-gray-900">Transaction Summary</h4>
                          <p className="text-xs text-gray-600">Pricing and payment details</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quantity</div>
                            <div className="text-xl font-bold text-gray-900">{selectedSale.quantity}</div>
                          </div>
                          {selectedSale.unit_price && (
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Unit Price</div>
                              <div className="text-xl font-bold text-gray-900">UGX {Number(selectedSale.unit_price).toLocaleString()}</div>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 text-white">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-xs text-green-100 uppercase tracking-wide mb-1">Total Amount</div>
                              <div className="text-2xl font-black">UGX {Number(selectedSale.total_price || selectedSale.total || 0).toLocaleString()}</div>
                            </div>
                            <i className="bi bi-cash-coin text-3xl text-green-200"></i>
                          </div>
                        </div>

                        {selectedSale.payment_method && (
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Method</div>
                            <div className="flex items-center gap-2">
                              <i className={`bi ${getStatusIcon(selectedSale.payment_method)} ${getStatusColor(selectedSale.payment_method)}`}></i>
                              <span className="font-medium text-gray-900 capitalize">
                                {selectedSale.payment_method.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                {(selectedSale.served_by || selectedSale.notes) && (
                  <div className="lg:col-span-3 mt-6">
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-4">
                        <i className="bi bi-info-circle text-gray-600 text-xl"></i>
                        <h4 className="font-bold text-gray-900">Additional Information</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedSale.served_by && (
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Served By</div>
                            <div className="font-medium text-gray-900">{selectedSale.served_by || 'N/A'}</div>
                          </div>
                        )}
                        {selectedSale.notes && (
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</div>
                            <div className="text-sm text-gray-700">{selectedSale.notes || 'No notes'}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {canManageSales && (
                  <div className="lg:col-span-3 mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => {
                          setIsDetailOpen(false);
                          openEditModal(selectedSale);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <i className="bi bi-pencil"></i>
                        Edit Sale
                      </button>
                      <button
                        onClick={() => {
                          setIsDetailOpen(false);
                          openRefundModal(selectedSale);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <i className="bi bi-arrow-return-left"></i>
                        Process Refund
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No sale selected.</div>
            )}

            <div className="mt-6 flex justify-end">
              <SecondaryButton onClick={() => setIsDetailOpen(false)}>Close</SecondaryButton>
            </div>
          </div>
        </Modal>

        {/* Enhanced Create Sale Modal */}
        <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="4xl">
          <div className="relative bg-white overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 opacity-50"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            
            {/* Modal Header */}
            <div className="relative px-5 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 border-b-4 border-green-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/30">
                      <i className="bi bi-receipt text-2xl text-white"></i>
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                      <i className="bi bi-plus text-xs text-white font-bold"></i>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">Create New Sale</h2>
                    <p className="text-xs text-green-50 mt-1 font-medium">
                      <i className="bi bi-info-circle mr-1"></i>
                      Record a new sale transaction
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:rotate-90 border border-white/20"
                  onClick={() => setIsCreateOpen(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSale} noValidate className="relative p-5 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
              {/* Customer Section */}
              <div className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-accent-100 hover:border-accent-200 transition-all duration-300">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-accent-500 to-accent-600 rounded-full shadow-lg">
                  <span className="text-xs font-bold text-white">STEP 1</span>
                </div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-person-circle text-white text-lg"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Customer Information</h4>
                      <p className="text-xs text-gray-500">Select or add customer</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open('/customers', '_blank')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 text-sm font-medium shadow-md"
                  >
                    <i className="bi bi-person-plus"></i>
                    New Customer
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                      <i className="bi bi-asterisk text-red-500 text-xs"></i>
                      Customer Name
                    </label>
                    <div className="relative">
                      <select
                        id="customer"
                        className="block w-full pl-12 pr-10 py-3 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200 text-gray-900 font-medium appearance-none bg-white cursor-pointer relative z-20"
                        value={createForm.data.customer}
                        onChange={e => {
                          const selectedCustomer = availableCustomers.find(c => c.name === e.target.value);
                          createForm.setData({
                            ...createForm.data,
                            customer: e.target.value,
                            customer_phone: selectedCustomer?.phone || createForm.data.customer_phone
                          });
                        }}
                      >
                        <option value="">Select a customer</option>
                        {availableCustomers.map(customer => (
                          <option key={customer.id} value={customer.name}>
                            {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                        <i className="bi bi-person text-gray-400"></i>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none z-10">
                        <i className="bi bi-chevron-down text-gray-400"></i>
                      </div>
                    </div>
                    {createForm.errors.customer && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <i className="bi bi-exclamation-circle-fill"></i>
                        {createForm.errors.customer}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="customer_phone" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                      <i className="bi bi-telephone text-blue-500"></i>
                      Customer Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <i className="bi bi-telephone text-gray-400"></i>
                      </div>
                      <input
                        id="customer_phone"
                        type="tel"
                        className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200 text-gray-900 font-medium"
                        value={createForm.data.customer_phone}
                        onChange={e => createForm.setData('customer_phone', e.target.value)}
                        placeholder="0700123456"
                        readOnly={!!availableCustomers.find(c => c.name === createForm.data.customer)?.phone}
                      />
                    </div>
                    {createForm.errors.customer_phone && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <i className="bi bi-exclamation-circle-fill"></i>
                        {createForm.errors.customer_phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Medicine Section */}
              <div className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-primary-100 hover:border-primary-200 transition-all duration-300">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full shadow-lg">
                  <span className="text-xs font-bold text-white">STEP 2</span>
                </div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-capsule-pill text-white text-lg"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Medicine Selection</h4>
                      <p className="text-xs text-gray-500">Choose from inventory</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open('/medicines', '_blank')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 text-sm font-medium shadow-md"
                  >
                    <i className="bi bi-box-seam"></i>
                    View Inventory
                  </button>
                </div>
                <div>
                  <label htmlFor="medicine_id" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                    <i className="bi bi-asterisk text-red-500 text-xs"></i>
                    Select Medicine
                  </label>
                  <div className="relative">
                    <select
                      id="medicine_id"
                      className="block w-full pl-12 pr-10 py-3 border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl transition-all duration-200 text-gray-900 font-medium appearance-none bg-white cursor-pointer relative z-20"
                      value={createForm.data.medicine_id}
                      onChange={e => {
                        const selectedMedicine = availableMedicines.find(m => m.id.toString() === e.target.value);
                        console.log('Selected medicine:', selectedMedicine);
                        
                        // Set packet and box sizes from medicine data
                        setPacketSize(selectedMedicine?.units_per_packet || selectedMedicine?.packet_size || 10);
                        setBoxSize(selectedMedicine?.units_per_box || selectedMedicine?.box_size || 100);
                        
                        // Set the unit price from the medicine (use selling_price for consistency with POS)
                        const unitPrice = selectedMedicine?.selling_price || selectedMedicine?.price || '';
                        console.log('Setting unit price to:', unitPrice);
                        
                        createForm.setData({
                          ...createForm.data,
                          medicine_id: e.target.value,
                          unit_price: unitPrice.toString()
                        });
                      }}
                    >
                      <option value="">Choose a medicine from inventory</option>
                      {availableMedicines.map(medicine => {
                        const categoryIcon = {
                          'Pain Relief': '💊',
                          'Antibiotics': '🦠',
                          'Respiratory': '🫁',
                          'Gastrointestinal': '🫃',
                          'Cardiovascular': '❤️',
                          'Diabetes': '🩸',
                          'Vitamins': '🌿',
                          'Antimalarials': '🦟',
                          'Topical': '🧴',
                          'Women\'s Health': '👩‍⚕️',
                          'Mental Health': '🧠'
                        }[medicine.category] || '💊';
                        
                        return (
                          <option key={medicine.id} value={medicine.id}>
                            {categoryIcon} {medicine.name} - {medicine.brand} (Stock: {medicine.stock}) - UGX {(medicine.selling_price || medicine.price || 0).toLocaleString()}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                      <i className="bi bi-capsule text-gray-400"></i>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none z-10">
                      <i className="bi bi-chevron-down text-gray-400"></i>
                    </div>
                  </div>
                  {createForm.errors.medicine_id && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <i className="bi bi-exclamation-circle-fill"></i>
                      {createForm.errors.medicine_id}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <i className="bi bi-info-circle"></i>
                    Stock levels and prices are shown for each medicine
                  </p>
                </div>
              </div>

              {/* Pricing & Payment Section */}
              <div className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-green-100 hover:border-green-200 transition-all duration-300">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg">
                  <span className="text-xs font-bold text-white">STEP 3</span>
                </div>
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <i className="bi bi-calculator text-white text-lg"></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Pricing & Payment</h4>
                    <p className="text-xs text-gray-500">Set quantity and payment method</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    {/* Header with Label and Tooltip */}
                    <div className="flex items-center gap-2">
                      <InputLabel htmlFor="quantity" value="Quantity *" />
                      <div className="group relative">
                        <i className="bi bi-info-circle text-blue-500 text-sm cursor-help"></i>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-50">
                          <div className="font-bold mb-2">💡 3-Tier Sales System</div>
                          <div className="space-y-1">
                            <div className="text-blue-300">• <strong>Units:</strong> Individual items (tablets, capsules)</div>
                            <div className="text-green-300">• <strong>Packets:</strong> Small packs ({packetSize} units)</div>
                            <div className="text-purple-300">• <strong>Boxes:</strong> Large boxes ({boxSize} units)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Buttons - Full Width */}
                    <div className="flex items-center gap-2 bg-gradient-to-r from-accent-50 via-green-50 to-primary-50 p-2 rounded-xl border-2 border-accent-200 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setSaleUnit('units')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                          saleUnit === 'units' 
                            ? 'bg-blue-600 text-white shadow-lg scale-105' 
                            : 'bg-white text-blue-600 hover:bg-blue-100'
                        }`}
                        title="Sell individual units"
                      >
                        <i className="bi bi-hash mr-1"></i>
                        Units
                      </button>
                      <button
                        type="button"
                        onClick={() => setSaleUnit('packets')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                          saleUnit === 'packets' 
                            ? 'bg-green-600 text-white shadow-lg scale-105' 
                            : 'bg-white text-green-600 hover:bg-green-100'
                        }`}
                        title="Sell in packets"
                      >
                        <i className="bi bi-bag mr-1"></i>
                        Packets
                      </button>
                      <button
                        type="button"
                        onClick={() => setSaleUnit('boxes')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                          saleUnit === 'boxes' 
                            ? 'bg-purple-600 text-white shadow-lg scale-105' 
                            : 'bg-white text-purple-600 hover:bg-purple-100'
                        }`}
                        title="Sell in boxes"
                      >
                        <i className="bi bi-box-seam mr-1"></i>
                        Boxes
                      </button>
                    </div>

                    {/* 3-Tier Info Cards */}
                    {createForm.data.medicine_id && (
                      <div className="grid grid-cols-3 gap-3">
                        {/* Units Card */}
                        <div className={`p-3 rounded-xl border-2 transition-all ${
                          saleUnit === 'units' 
                            ? 'bg-blue-50 border-blue-400 shadow-lg ring-2 ring-blue-200' 
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}>
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              saleUnit === 'units' ? 'bg-blue-600' : 'bg-gray-300'
                            }`}>
                              <i className="bi bi-hash text-white text-lg"></i>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">Units</div>
                              <div className="text-xs text-gray-600 mt-1">1 = 1 item</div>
                            </div>
                            <div className="text-sm font-black text-blue-600">
                              {(() => {
                                const med = availableMedicines.find(m => m.id.toString() === createForm.data.medicine_id);
                                return `${med?.stock || 0} avail`;
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Packets Card */}
                        <div className={`p-3 rounded-xl border-2 transition-all ${
                          saleUnit === 'packets' 
                            ? 'bg-green-50 border-green-400 shadow-lg ring-2 ring-green-200' 
                            : 'bg-white border-gray-200 hover:border-green-300'
                        }`}>
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              saleUnit === 'packets' ? 'bg-green-600' : 'bg-gray-300'
                            }`}>
                              <i className="bi bi-bag text-white text-lg"></i>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">Packets</div>
                              <div className="text-xs text-gray-600 mt-1">1 = {packetSize} units</div>
                            </div>
                            <div className="text-sm font-black text-green-600">
                              {(() => {
                                const med = availableMedicines.find(m => m.id.toString() === createForm.data.medicine_id);
                                return `${Math.floor((med?.stock || 0) / packetSize)} avail`;
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Boxes Card */}
                        <div className={`p-3 rounded-xl border-2 transition-all ${
                          saleUnit === 'boxes' 
                            ? 'bg-purple-50 border-purple-400 shadow-lg ring-2 ring-purple-200' 
                            : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}>
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              saleUnit === 'boxes' ? 'bg-purple-600' : 'bg-gray-300'
                            }`}>
                              <i className="bi bi-box-seam text-white text-lg"></i>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">Boxes</div>
                              <div className="text-xs text-gray-600 mt-1">1 = {boxSize} units</div>
                            </div>
                            <div className="text-sm font-black text-purple-600">
                              {(() => {
                                const med = availableMedicines.find(m => m.id.toString() === createForm.data.medicine_id);
                                return `${Math.floor((med?.stock || 0) / boxSize)} avail`;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quantity Input */}
                    <div className="relative">
                      <TextInput
                        id="quantity"
                        type="number"
                        min="1"
                        step="1"
                        className="pl-12 pr-4 block w-full text-lg font-semibold h-12"
                        value={
                          saleUnit === 'packets' 
                            ? Math.floor(createForm.data.quantity / packetSize)
                            : saleUnit === 'boxes'
                            ? Math.floor(createForm.data.quantity / boxSize)
                            : createForm.data.quantity
                        }
                        onChange={e => {
                          const inputValue = Number(e.target.value);
                          const actualUnits = 
                            saleUnit === 'packets' 
                              ? inputValue * packetSize
                              : saleUnit === 'boxes'
                              ? inputValue * boxSize
                              : inputValue;
                          createForm.setData('quantity', actualUnits);
                        }}
                        placeholder={
                          saleUnit === 'packets' 
                            ? 'Enter number of packets'
                            : saleUnit === 'boxes'
                            ? 'Enter number of boxes'
                            : 'Enter number of units'
                        }
                      />
                      <i className={`bi ${
                        saleUnit === 'packets' ? 'bi-bag' : saleUnit === 'boxes' ? 'bi-box-seam' : 'bi-hash'
                      } absolute left-3 top-1/2 -translate-y-1/2 ${
                        saleUnit === 'packets' ? 'text-green-500' : saleUnit === 'boxes' ? 'text-purple-500' : 'text-blue-500'
                      } text-lg`}></i>
                    </div>

                    {/* Quick Buttons */}
                    {saleUnit !== 'units' && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-600 font-medium">Quick:</span>
                        {saleUnit === 'packets' && [1, 5, 10, 20, 50].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => createForm.setData('quantity', num * packetSize)}
                            className="px-3 py-1 bg-white border-2 border-green-200 text-green-600 rounded-lg text-xs font-bold hover:bg-green-50 hover:border-green-400 transition-all duration-200 hover:scale-105"
                          >
                            {num} {num === 1 ? 'packet' : 'packets'}
                          </button>
                        ))}
                        {saleUnit === 'boxes' && [1, 2, 5, 10].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => createForm.setData('quantity', num * boxSize)}
                            className="px-3 py-1 bg-white border-2 border-purple-200 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-50 hover:border-purple-400 transition-all duration-200 hover:scale-105"
                          >
                            {num} {num === 1 ? 'box' : 'boxes'}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Conversion Display */}
                    {saleUnit !== 'units' && createForm.data.quantity > 0 && (
                      <div className={`mt-2 p-2 rounded-lg border ${
                        saleUnit === 'packets' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-purple-50 border-purple-200'
                      }`}>
                        <div className="flex items-center gap-2 text-sm flex-wrap">
                          <i className={`bi bi-calculator ${
                            saleUnit === 'packets' ? 'text-green-600' : 'text-purple-600'
                          }`}></i>
                          <span className={`font-medium ${
                            saleUnit === 'packets' ? 'text-green-700' : 'text-purple-700'
                          }`}>
                            {saleUnit === 'packets' 
                              ? `${Math.floor(createForm.data.quantity / packetSize)} packets × ${packetSize} units`
                              : `${Math.floor(createForm.data.quantity / boxSize)} boxes × ${boxSize} units`
                            } = 
                          </span>
                          <span className={`font-black text-lg ${
                            saleUnit === 'packets' ? 'text-green-900' : 'text-purple-900'
                          }`}>
                            {createForm.data.quantity} units
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Stock Warning */}
                    {createForm.data.medicine_id && createForm.data.quantity > 0 && (() => {
                      const med = availableMedicines.find(m => m.id.toString() === createForm.data.medicine_id);
                      if (med && createForm.data.quantity > med.stock) {
                        return (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <i className="bi bi-exclamation-triangle text-red-600"></i>
                            <span className="text-red-700 text-xs font-medium">
                              Insufficient stock! Only {med.stock} units available
                              {saleUnit === 'packets' && ` (${Math.floor(med.stock / packetSize)} packets)`}
                              {saleUnit === 'boxes' && ` (${Math.floor(med.stock / boxSize)} boxes)`}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <InputError message={createForm.errors.quantity} className="mt-2" />
                  </div>
                  <div>
                    <InputLabel htmlFor="unit_price" value="Unit Price (Auto)" />
                    <div className="relative mt-1">
                      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                        <i className="bi bi-cash-coin text-green-600 text-xl"></i>
                        <div className="flex-1">
                          <div className="text-xs text-green-700 font-medium">Price per unit</div>
                          <div className="text-2xl font-black text-green-900">
                            UGX {createForm.data.unit_price ? Number(createForm.data.unit_price).toLocaleString() : '0'}
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold">
                          From Medicine
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                      <i className="bi bi-info-circle"></i>
                      <span>Price automatically set from medicine database</span>
                    </div>
                  </div>
                  <div>
                    <InputLabel htmlFor="payment_method" value="Payment Method *" />
                    <div className="relative mt-1">
                      <select
                        id="payment_method"
                        className="pl-10 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        value={createForm.data.payment_method}
                        onChange={e => createForm.setData('payment_method', e.target.value)}
                      >
                        <option value="cash">💵 Cash</option>
                        <option value="mobile_money">📱 Mobile Money</option>
                        <option value="card">💳 Card</option>
                        <option value="credit">📋 Credit</option>
                      </select>
                      <i className="bi bi-credit-card absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <InputError message={createForm.errors.payment_method} className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="relative bg-white rounded-2xl p-4 shadow-lg border-2 border-gray-100 hover:border-gray-200 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
                    <i className="bi bi-journal-text text-white text-lg"></i>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">Additional Notes</h4>
                    <p className="text-xs text-gray-500">Optional information</p>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    id="notes"
                    rows="3"
                    className="block w-full px-4 py-3 border-2 border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 rounded-xl transition-all duration-200 text-gray-900"
                    value={createForm.data.notes}
                    onChange={e => createForm.setData('notes', e.target.value)}
                    placeholder="Any additional notes about this sale (prescription details, special instructions, etc.)"
                  />
                </div>
                {createForm.errors.notes && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    {createForm.errors.notes}
                  </p>
                )}
              </div>

              {/* Enhanced Total Calculation */}
              {createForm.data.quantity > 0 && createForm.data.unit_price > 0 && (
                <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-2xl animate-fadeIn">
                  <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl"></div>
                  <div className="relative flex items-center justify-between">
                    <div>
                      <div className="text-green-100 text-sm mb-2 font-medium flex items-center gap-2">
                        <i className="bi bi-receipt"></i>
                        Transaction Total
                      </div>
                      <div className="text-4xl font-black mb-2">
                        UGX {(createForm.data.quantity * createForm.data.unit_price).toLocaleString()}
                      </div>
                      <div className="text-green-100 text-sm flex items-center gap-2 flex-wrap">
                        {saleUnit === 'packets' ? (
                          <>
                            <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                              <i className="bi bi-bag"></i>
                              {Math.floor(createForm.data.quantity / packetSize)} packets
                            </span>
                            <span>×</span>
                            <span className="bg-white/20 px-2 py-1 rounded">{packetSize} units/packet</span>
                            <span>=</span>
                            <span className="bg-white/20 px-2 py-1 rounded">{createForm.data.quantity} units</span>
                            <span>×</span>
                            <span className="bg-white/20 px-2 py-1 rounded">UGX {Number(createForm.data.unit_price).toLocaleString()}</span>
                          </>
                        ) : saleUnit === 'boxes' ? (
                          <>
                            <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1">
                              <i className="bi bi-box-seam"></i>
                              {Math.floor(createForm.data.quantity / boxSize)} boxes
                            </span>
                            <span>×</span>
                            <span className="bg-white/20 px-2 py-1 rounded">{boxSize} units/box</span>
                            <span>=</span>
                            <span className="bg-white/20 px-2 py-1 rounded">{createForm.data.quantity} units</span>
                            <span>×</span>
                            <span className="bg-white/20 px-2 py-1 rounded">UGX {Number(createForm.data.unit_price).toLocaleString()}</span>
                          </>
                        ) : (
                          <>
                            <span className="bg-white/20 px-2 py-1 rounded">{createForm.data.quantity} units</span>
                            <span>×</span>
                            <span className="bg-white/20 px-2 py-1 rounded">UGX {Number(createForm.data.unit_price).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
                        <i className="bi bi-check-circle text-5xl text-white"></i>
                      </div>
                      <div className="text-green-100 text-xs font-semibold">Ready to Process</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="bi bi-shield-check text-green-600"></i>
                  <span className="font-medium">All data is encrypted and secure</span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    <i className="bi bi-x-circle mr-2"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createForm.processing}
                    className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-green-700"
                  >
                    {createForm.processing ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                        Processing Sale...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle mr-2"></i>
                        Create Sale
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>

        {/* Edit Sale Modal */}
        <Modal show={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidth="3xl">
          <div className="relative bg-white overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-50 via-primary-50 to-neutral-50 opacity-50"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            
            {/* Modal Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-accent-600 via-primary-600 to-primary-700 border-b-4 border-accent-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/30">
                      <i className="bi bi-pencil-square text-3xl text-white"></i>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                      <i className="bi bi-lightning-fill text-xs text-white"></i>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white drop-shadow-lg">Edit Sale Transaction</h2>
                    <p className="text-sm text-cyan-50 mt-1 font-medium flex items-center gap-2">
                      <i className="bi bi-info-circle"></i>
                      Update sale details and transaction information
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:rotate-90 border border-white/20"
                  onClick={() => setIsEditOpen(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg text-2xl"></i>
                </button>
              </div>
            </div>

            {selectedSale && (
              <form onSubmit={handleEditSale} noValidate className="relative p-6 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* Customer Section */}
                <div className="relative bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-5 shadow-lg border-2 border-accent-200 hover:border-accent-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-person-circle text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Customer Information</h4>
                      <p className="text-xs text-gray-600">Update customer details</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit_customer" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-asterisk text-red-500 text-xs"></i>
                        Customer Name
                      </label>
                      <div className="relative">
                        <select
                          id="edit_customer"
                          className="block w-full pl-12 pr-10 py-3 border-2 border-gray-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 rounded-xl transition-all duration-200 text-gray-900 font-medium appearance-none bg-white cursor-pointer"
                          value={editForm.data.customer}
                          onChange={e => {
                            const selectedCustomer = availableCustomers.find(c => c.name === e.target.value);
                            editForm.setData({
                              ...editForm.data,
                              customer: e.target.value,
                              customer_phone: selectedCustomer?.phone || editForm.data.customer_phone
                            });
                          }}
                          required
                        >
                          <option value="">Select a customer</option>
                          {availableCustomers.map(customer => (
                            <option key={customer.id} value={customer.name}>
                              {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-person text-gray-400"></i>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <i className="bi bi-chevron-down text-gray-400"></i>
                        </div>
                      </div>
                      {editForm.errors.customer && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.customer}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="edit_customer_phone" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-telephone text-cyan-500"></i>
                        Customer Phone
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-telephone text-gray-400"></i>
                        </div>
                        <input
                          id="edit_customer_phone"
                          type="tel"
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 rounded-xl transition-all duration-200 text-gray-900 font-medium"
                          value={editForm.data.customer_phone}
                          onChange={e => editForm.setData('customer_phone', e.target.value)}
                          placeholder="0700123456"
                          readOnly={!!availableCustomers.find(c => c.name === editForm.data.customer)?.phone}
                        />
                      </div>
                      {editForm.errors.customer_phone && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.customer_phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medicine Selection */}
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 shadow-lg border-2 border-green-200 hover:border-green-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-capsule text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Medicine Selection</h4>
                      <p className="text-xs text-gray-600">Choose from inventory</p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="edit_medicine_id" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                      <i className="bi bi-asterisk text-red-500 text-xs"></i>
                      Select Medicine
                    </label>
                    <div className="relative">
                      <select
                        id="edit_medicine_id"
                        className="block w-full pl-12 pr-10 py-3 border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl transition-all duration-200 text-gray-900 font-medium appearance-none bg-white cursor-pointer"
                        value={editForm.data.medicine_id}
                        onChange={e => {
                          const selectedMedicine = availableMedicines.find(m => m.id.toString() === e.target.value);
                          console.log('Selected medicine for edit:', selectedMedicine);
                          
                          // Set the unit price from the medicine
                          const unitPrice = selectedMedicine?.price || selectedMedicine?.selling_price || editForm.data.unit_price;
                          
                          editForm.setData({
                            ...editForm.data,
                            medicine_id: e.target.value,
                            unit_price: unitPrice.toString()
                          });
                        }}
                        required
                      >
                        <option value="">Select a medicine</option>
                        {availableMedicines.map(medicine => (
                          <option key={medicine.id} value={medicine.id}>
                            {medicine.name} {medicine.brand ? `(${medicine.brand})` : ''} - Stock: {medicine.stock} - UGX {Number(medicine.price || medicine.selling_price || 0).toLocaleString()}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <i className="bi bi-capsule text-gray-400"></i>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <i className="bi bi-chevron-down text-gray-400"></i>
                      </div>
                    </div>
                    {editForm.errors.medicine_id && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <i className="bi bi-exclamation-circle-fill"></i>
                        {editForm.errors.medicine_id}
                      </p>
                    )}
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="relative bg-gradient-to-br from-primary-50 to-neutral-50 rounded-2xl p-5 shadow-lg border-2 border-primary-200 hover:border-primary-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-neutral-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-calculator text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Transaction Details</h4>
                      <p className="text-xs text-gray-600">Update quantity and pricing</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit_quantity" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-asterisk text-red-500 text-xs"></i>
                        Quantity
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-box text-gray-400"></i>
                        </div>
                        <input
                          id="edit_quantity"
                          type="number"
                          min="1"
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl transition-all duration-200 text-gray-900 font-medium"
                          value={editForm.data.quantity}
                          onChange={e => editForm.setData('quantity', Number(e.target.value))}
                          required
                        />
                      </div>
                      {editForm.errors.quantity && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.quantity}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="edit_unit_price" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-asterisk text-red-500 text-xs"></i>
                        Unit Price (UGX)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-cash-coin text-gray-400"></i>
                        </div>
                        <input
                          id="edit_unit_price"
                          type="number"
                          step="0.01"
                          min="0"
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl transition-all duration-200 text-gray-900 font-medium"
                          value={editForm.data.unit_price}
                          onChange={e => editForm.setData('unit_price', e.target.value)}
                          required
                        />
                      </div>
                      {editForm.errors.unit_price && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.unit_price}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total Display */}
                  <div className="mt-4 p-4 bg-white rounded-xl border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">Total Amount:</span>
                      <span className="text-2xl font-black text-purple-600">
                        UGX {(editForm.data.quantity * parseFloat(editForm.data.unit_price || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment & Notes */}
                <div className="relative bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-5 shadow-lg border-2 border-orange-200 hover:border-orange-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-credit-card text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Payment & Notes</h4>
                      <p className="text-xs text-gray-600">Payment method and additional info</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit_payment_method" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-asterisk text-red-500 text-xs"></i>
                        Payment Method
                      </label>
                      <div className="relative">
                        <select
                          id="edit_payment_method"
                          className="block w-full pl-12 pr-10 py-3 border-2 border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 rounded-xl transition-all duration-200 text-gray-900 font-medium appearance-none bg-white cursor-pointer"
                          value={editForm.data.payment_method}
                          onChange={e => editForm.setData('payment_method', e.target.value)}
                          required
                        >
                          <option value="cash">💵 Cash</option>
                          <option value="mobile_money">📱 Mobile Money</option>
                          <option value="card">💳 Card</option>
                          <option value="credit">📋 Credit</option>
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-wallet2 text-gray-400"></i>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <i className="bi bi-chevron-down text-gray-400"></i>
                        </div>
                      </div>
                      {editForm.errors.payment_method && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.payment_method}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="edit_notes" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-chat-left-text text-orange-500"></i>
                        Notes (Optional)
                      </label>
                      <textarea
                        id="edit_notes"
                        rows="3"
                        className="block w-full px-4 py-3 border-2 border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 rounded-xl transition-all duration-200 text-gray-900 resize-none"
                        value={editForm.data.notes}
                        onChange={e => editForm.setData('notes', e.target.value)}
                        placeholder="Add any additional notes about this sale..."
                      />
                      {editForm.errors.notes && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <i className="bi bi-x-circle"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editForm.processing}
                    className="px-8 py-3 bg-gradient-to-r from-accent-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <i className="bi bi-check-circle-fill"></i>
                    Update Sale
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>

        {/* Refund Modal */}
        <Modal show={isRefundOpen} onClose={() => setIsRefundOpen(false)} maxWidth="2xl">
          <div className="relative bg-white overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-neutral-50 to-neutral-100 opacity-50"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            
            {/* Modal Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-primary-600 via-neutral-600 to-neutral-700 border-b-4 border-primary-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/30">
                      <i className="bi bi-arrow-return-left text-3xl text-white"></i>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                      <i className="bi bi-exclamation text-xs text-white font-bold"></i>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white drop-shadow-lg">Process Refund</h2>
                    <p className="text-sm text-purple-50 mt-1 font-medium flex items-center gap-2">
                      <i className="bi bi-shield-check"></i>
                      Issue a refund for this sale transaction
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:rotate-90 border border-white/20"
                  onClick={() => setIsRefundOpen(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg text-2xl"></i>
                </button>
              </div>
            </div>

            {selectedSale && (
              <form onSubmit={handleRefund} noValidate className="relative p-6 space-y-5">
                {/* Sale Information Card */}
                <div className="relative bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-5 shadow-lg border-2 border-accent-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-receipt-cutoff text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Sale Information</h4>
                      <p className="text-xs text-gray-600">Original transaction details</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-3 border border-blue-200">
                      <div className="text-xs text-gray-500 font-medium mb-1">Invoice Number</div>
                      <div className="text-sm font-bold text-gray-900">{selectedSale.invoice}</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-blue-200">
                      <div className="text-xs text-gray-500 font-medium mb-1">Customer</div>
                      <div className="text-sm font-bold text-gray-900">{selectedSale.customer}</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-blue-200">
                      <div className="text-xs text-gray-500 font-medium mb-1">Medicine</div>
                      <div className="text-sm font-bold text-gray-900">{typeof selectedSale.medicine === 'string' ? selectedSale.medicine : selectedSale.medicine?.name}</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-blue-200">
                      <div className="text-xs text-gray-500 font-medium mb-1">Original Amount</div>
                      <div className="text-sm font-bold text-green-600">UGX {Number(selectedSale.total_price || selectedSale.total || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Refund Amount */}
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 shadow-lg border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-cash-coin text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Refund Amount</h4>
                      <p className="text-xs text-gray-600">Enter the amount to refund</p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="refund_amount" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                      <i className="bi bi-asterisk text-red-500 text-xs"></i>
                      Refund Amount (UGX)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <i className="bi bi-cash-stack text-gray-400 text-lg"></i>
                      </div>
                      <input
                        id="refund_amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={selectedSale.total_price || selectedSale.total}
                        className="block w-full pl-12 pr-4 py-4 border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl transition-all duration-200 text-gray-900 font-bold text-lg"
                        value={refundForm.data.refund_amount}
                        onChange={e => refundForm.setData('refund_amount', e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    {refundForm.errors.refund_amount && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <i className="bi bi-exclamation-circle-fill"></i>
                        {refundForm.errors.refund_amount}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                      <i className="bi bi-info-circle"></i>
                      Maximum refund: UGX {Number(selectedSale.total_price || selectedSale.total || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Refund Reason */}
                <div className="relative bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-5 shadow-lg border-2 border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-clipboard-check text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Refund Reason</h4>
                      <p className="text-xs text-gray-600">Select the reason for refund</p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="refund_reason" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                      <i className="bi bi-asterisk text-red-500 text-xs"></i>
                      Reason
                    </label>
                    <div className="relative">
                      <select
                        id="refund_reason"
                        className="block w-full pl-12 pr-10 py-3 border-2 border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 rounded-xl transition-all duration-200 text-gray-900 font-medium appearance-none bg-white cursor-pointer"
                        value={refundForm.data.reason}
                        onChange={e => refundForm.setData('reason', e.target.value)}
                        required
                      >
                        <option value="">Select Reason</option>
                        <option value="customer_request">👤 Customer Request</option>
                        <option value="defective_product">⚠️ Defective Product</option>
                        <option value="wrong_medicine">❌ Wrong Medicine</option>
                        <option value="expired_medicine">📅 Expired Medicine</option>
                        <option value="duplicate_sale">🔄 Duplicate Sale</option>
                        <option value="other">📝 Other</option>
                      </select>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <i className="bi bi-tag text-gray-400"></i>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <i className="bi bi-chevron-down text-gray-400"></i>
                      </div>
                    </div>
                    {refundForm.errors.reason && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <i className="bi bi-exclamation-circle-fill"></i>
                        {refundForm.errors.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="relative bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 shadow-lg border-2 border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-chat-left-text text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Additional Notes</h4>
                      <p className="text-xs text-gray-600">Provide more details (optional)</p>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="refund_notes" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                      <i className="bi bi-pencil text-gray-500"></i>
                      Notes
                    </label>
                    <textarea
                      id="refund_notes"
                      rows="4"
                      className="block w-full px-4 py-3 border-2 border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 rounded-xl transition-all duration-200 text-gray-900 resize-none"
                      value={refundForm.data.notes}
                      onChange={e => refundForm.setData('notes', e.target.value)}
                      placeholder="Add any additional details about the refund..."
                    />
                    {refundForm.errors.notes && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <i className="bi bi-exclamation-circle-fill"></i>
                        {refundForm.errors.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsRefundOpen(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <i className="bi bi-x-circle"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={refundForm.processing}
                    className="px-8 py-3 bg-gradient-to-r from-primary-500 to-neutral-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <i className="bi bi-arrow-return-left"></i>
                    Process Refund
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>

        {/* Delete Sale Modal */}
        <Modal show={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} maxWidth="2xl">
          <div className="relative bg-white overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 opacity-50"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            
            {/* Modal Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 border-b-4 border-red-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/30 animate-pulse">
                      <i className="bi bi-exclamation-triangle-fill text-3xl text-white"></i>
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                      <i className="bi bi-exclamation text-sm text-white font-bold"></i>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white drop-shadow-lg">Delete Sale</h2>
                    <p className="text-sm text-red-50 mt-1 font-medium flex items-center gap-2">
                      <i className="bi bi-shield-exclamation"></i>
                      This action cannot be undone - proceed with caution
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:rotate-90 border border-white/20"
                  onClick={() => setIsDeleteOpen(false)}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg text-2xl"></i>
                </button>
              </div>
            </div>

            {selectedSale && (
              <div className="relative p-6 space-y-5">
                {/* Warning Alert */}
                <div className="relative bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl p-5 shadow-lg border-2 border-red-300 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-red-500 flex items-center justify-center shadow-lg">
                        <i className="bi bi-exclamation-triangle-fill text-white text-2xl"></i>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-black text-red-900 mb-2">
                        ⚠️ Permanent Deletion Warning
                      </h4>
                      <div className="text-sm text-red-800 space-y-2">
                        <p className="font-medium">
                          You are about to permanently delete the sale record for <span className="font-black text-red-900">{selectedSale.customer}</span>.
                        </p>
                        <div className="bg-white/50 rounded-lg p-3 mt-3">
                          <p className="font-bold text-red-900 mb-2">⚡ This will:</p>
                          <ul className="list-disc list-inside space-y-1 text-red-800">
                            <li>Remove the sale from all records</li>
                            <li>Affect inventory tracking</li>
                            <li>Impact financial reports</li>
                            <li>Cannot be recovered</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sale Information Card */}
                <div className="relative bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 shadow-lg border-2 border-gray-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-slate-700 flex items-center justify-center shadow-lg">
                      <i className="bi bi-receipt-cutoff text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Sale Information</h4>
                      <p className="text-xs text-gray-600">Review before deletion</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="bi bi-hash text-blue-500"></i>
                        <div className="text-xs text-gray-500 font-medium">Invoice Number</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{selectedSale.invoice}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="bi bi-person-circle text-blue-500"></i>
                        <div className="text-xs text-gray-500 font-medium">Customer</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{selectedSale.customer}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="bi bi-capsule-pill text-purple-500"></i>
                        <div className="text-xs text-gray-500 font-medium">Medicine</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{typeof selectedSale.medicine === 'string' ? selectedSale.medicine : selectedSale.medicine?.name}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="bi bi-cash-coin text-green-500"></i>
                        <div className="text-xs text-gray-500 font-medium">Amount</div>
                      </div>
                      <div className="text-sm font-bold text-green-600">UGX {Number(selectedSale.total_price || selectedSale.total || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="bi bi-calendar-event text-orange-500"></i>
                        <div className="text-xs text-gray-500 font-medium">Transaction Date</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">{selectedSale.date}</div>
                    </div>
                  </div>
                </div>

                {/* Confirmation Section */}
                <div className="relative bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 shadow-lg border-2 border-yellow-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg">
                      <i className="bi bi-shield-check text-white text-xl"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">Final Confirmation</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Please confirm that you understand this action is <span className="font-black text-red-600">permanent and irreversible</span>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(false)}
                    className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <i className="bi bi-x-circle"></i>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSale}
                    disabled={deleteForm.processing}
                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <i className="bi bi-trash-fill"></i>
                    Delete Sale Permanently
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
