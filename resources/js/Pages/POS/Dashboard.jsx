import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { toast } from 'react-toastify';
import { useCustomers } from '@/Hooks/useCustomers';
import { useMedicines } from '@/Hooks/useMedicines';
import { useSales } from '@/Hooks/useSales';
import { commonMedicines } from '@/Data/commonMedicines';
import { 
  XMarkIcon, 
  BanknotesIcon, 
  PrinterIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function POSDashboard({ terminals, paymentMethods, customers: propsCustomers }) {
  // Hooks for shared data
  const { customers: hookCustomers, loading: customersLoading } = useCustomers();
  
  // Use props customers first, then fall back to hook
  const customers = propsCustomers || hookCustomers;
  const { medicines, loading: medicinesLoading } = useMedicines();
  const { addSale, stats: salesStats } = useSales();

  // Theme state
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Helper function to get category info safely
  const getCategoryInfo = (medicineName) => {
    if (!commonMedicines || !Array.isArray(commonMedicines)) {
      return { category: 'General', icon: '💊' };
    }
    
    const categoryInfo = commonMedicines.find(cm => cm.name === medicineName) || {};
    const categoryIcon = categoryInfo?.category === 'Pain Relief' ? '💊' :
                       categoryInfo?.category === 'Antibiotics' ? '🦠' :
                       categoryInfo?.category === 'Respiratory' ? '🫁' :
                       categoryInfo?.category === 'Cardiovascular' ? '❤️' :
                       categoryInfo?.category === 'Diabetes' ? '🩸' :
                       categoryInfo?.category === 'Gastrointestinal' ? '🫃' :
                       categoryInfo?.category === 'Mental Health' ? '🧠' :
                       categoryInfo?.category === 'Vitamins' ? '🌟' :
                       categoryInfo?.category === 'Topical' ? '🧴' :
                       categoryInfo?.category === 'Eye/Ear' ? '👁️' :
                       categoryInfo?.category === 'Emergency' ? '🚨' : '💊';
    
    return { ...categoryInfo, icon: categoryIcon };
  };

  // State management
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    loyalty_points_earned: 0,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cash: 0,
    card: 0,
    mobile_money: 0,
    insurance: 0,
    loyalty_points: 0,
  });
  const [amountTendered, setAmountTendered] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const searchInputRef = useRef(null);
  const customerSearchRef = useRef(null);

  // Search medicines using local data
  const searchMedicines = query => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const filtered = medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(query.toLowerCase()) ||
      medicine.generic_name?.toLowerCase().includes(query.toLowerCase()) ||
      medicine.brand?.toLowerCase().includes(query.toLowerCase()) ||
      medicine.barcode?.includes(query)
    );

    setSearchResults(filtered.slice(0, 10)); // Limit to 10 results
  };

  // Search customers using local data
  const searchCustomers = query => {
    if (query.length < 2) {
      setCustomerSearchResults([]);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.email?.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone?.includes(query)
    );

    setCustomerSearchResults(filtered.slice(0, 10)); // Limit to 10 results
  };

  // Add item to cart
  const addToCart = medicine => {
    const existingItem = cart.find(item => item.medicine_id === medicine.id);

    if (existingItem) {
      updateCartItemQuantity(medicine.id, existingItem.quantity + 1);
    } else {
      const newItem = {
        medicine_id: medicine.id,
        name: medicine.name,
        generic_name: medicine.generic_name || medicine.brand,
        unit_price: medicine.selling_price || medicine.price || 0,
        quantity: 1,
        available_stock: medicine.available_stock || medicine.stock,
        requires_prescription: medicine.requires_prescription || false,
        category: medicine.category,
        brand: medicine.brand,
      };
      setCart([...cart, newItem]);
    }

    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Update cart item quantity
  const updateCartItemQuantity = (medicineId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    setCart(
      cart.map(item =>
        item.medicine_id === medicineId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = medicineId => {
    setCart(cart.filter(item => item.medicine_id !== medicineId));
  };

  // Calculate totals
  const calculateTotals = () => {
    if (cart.length === 0) {
      setTotals({
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        loyalty_points_earned: 0,
      });
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = 0.1; // 10% tax rate
    const tax_amount = subtotal * taxRate;
    
    // Apply customer tier discount
    let discount_amount = 0;
    if (selectedCustomer?.tier === 'Gold') {
      discount_amount = subtotal * 0.1; // 10% discount for Gold
    } else if (selectedCustomer?.tier === 'Silver') {
      discount_amount = subtotal * 0.05; // 5% discount for Silver
    }

    const total_amount = subtotal + tax_amount - discount_amount;
    const loyalty_points_earned = Math.floor(total_amount / 10000); // 1 point per UGX 10,000

    setTotals({
      subtotal,
      discount_amount,
      tax_amount,
      total_amount,
      loyalty_points_earned,
    });
  };

  // Apply coupon
  const applyCoupon = () => {
    if (!couponCode.trim()) return;

    // Sample coupon codes
    const coupons = {
      'SAVE10': { type: 'percentage', value: 10, description: '10% off' },
      'SAVE5': { type: 'fixed', value: 5000, description: 'UGX 5,000 off' },
      'WELCOME': { type: 'percentage', value: 15, description: '15% off for new customers' },
      'BULK20': { type: 'percentage', value: 20, description: '20% off orders over UGX 50,000' },
    };

    const coupon = coupons[couponCode.toUpperCase()];
    
    if (!coupon) {
      toast.error('Invalid coupon code');
      return;
    }

    // Check if bulk discount applies
    if (couponCode.toUpperCase() === 'BULK20' && totals.subtotal < 50000) {
      toast.error('Bulk discount requires minimum order of UGX 50,000');
      return;
    }

    let additionalDiscount = 0;
    if (coupon.type === 'percentage') {
      additionalDiscount = totals.subtotal * (coupon.value / 100);
    } else {
      additionalDiscount = coupon.value;
    }

    // Update totals with coupon discount
    const newDiscountAmount = totals.discount_amount + additionalDiscount;
    const newTotalAmount = totals.subtotal + totals.tax_amount - newDiscountAmount;

    setTotals(prev => ({
      ...prev,
      discount_amount: newDiscountAmount,
      total_amount: newTotalAmount,
    }));

    toast.success(`Coupon applied! ${coupon.description}`);
    setCouponCode('');
  };

  // Process checkout
  const processCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Create temporary transaction for payment processing
      const tempTransaction = {
        id: Date.now(),
        transaction_id: `TXN-${Date.now()}`,
        items: cart,
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        discount_amount: totals.discount_amount,
        total_amount: totals.total_amount,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      setCurrentTransaction(tempTransaction);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error.message || 'Failed to create transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process payment
  const processPayment = async () => {
    if (!currentTransaction) return;

    const payments = [];

    // Add cash payment
    if (parseFloat(amountTendered) > 0) {
      payments.push({
        method: 'cash',
        amount: parseFloat(amountTendered),
        details: { amount_tendered: parseFloat(amountTendered) },
      });
    }

    // Add other payment methods
    Object.entries(paymentData).forEach(([method, amount]) => {
      if (parseFloat(amount) > 0) {
        payments.push({
          method,
          amount: parseFloat(amount),
          details: {},
        });
      }
    });

    const totalPayment = payments.reduce((sum, payment) => sum + payment.amount, 0);

    if (Math.abs(totalPayment - totals.total_amount) > 0.01) {
      toast.error('Payment amount does not match total');
      return;
    }

    setIsProcessing(true);

    try {
      // Create sale record using our hook
      const saleData = {
        customer_id: selectedCustomer?.id,
        items: cart.map(item => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        })),
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        discount_amount: totals.discount_amount,
        total_amount: totals.total_amount,
        payment_method: payments.length === 1 ? payments[0].method : 'mixed',
        sale_type: 'pos',
        transaction_id: currentTransaction?.transaction_id || `TXN-${Date.now()}`,
      };

      const newSale = await addSale(saleData);
      setCurrentTransaction(newSale);

      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      setShowReceiptModal(true);

      // Reset cart and form
      setCart([]);
      setSelectedCustomer(null);
      setPaymentData({ cash: 0, card: 0, mobile_money: 0, insurance: 0, loyalty_points: 0 });
      setAmountTendered('');
      setCouponCode('');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Print receipt
  const printReceipt = () => {
    if (!currentTransaction) return;

    try {
      const receiptData = {
        store_name: 'MediTrack Pharmacy',
        store_address: '123 Health Street, Kampala, Uganda',
        store_phone: '+256 700 123 456',
        receipt_number: `RCP-${currentTransaction.transaction_id}`,
        transaction_id: currentTransaction.transaction_id,
        date: new Date(currentTransaction.created_at).toLocaleString(),
        cashier: currentTransaction.cashier || 'Current User',
        customer: selectedCustomer,
        items: currentTransaction.items,
        subtotal: currentTransaction.subtotal,
        discount_amount: currentTransaction.discount_amount,
        tax_amount: currentTransaction.tax_amount,
        total_amount: currentTransaction.total_amount,
        payments: currentTransaction.payments,
      };

      // Open print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(generateReceiptHTML(receiptData));
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error('Failed to print receipt');
    }
  };

  // Generate receipt HTML
  const generateReceiptHTML = receiptData => {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                    .item { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { font-weight: bold; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${receiptData.store_name}</h2>
                    <p>${receiptData.store_address}</p>
                    <p>${receiptData.store_phone}</p>
                </div>
                <div class="line"></div>
                <p>Receipt: ${receiptData.receipt_number}</p>
                <p>Transaction: ${receiptData.transaction_id}</p>
                <p>Date: ${receiptData.date}</p>
                <p>Cashier: ${receiptData.cashier}</p>
                ${receiptData.customer ? `<p>Customer: ${receiptData.customer.name}</p>` : ''}
                <div class="line"></div>
                ${receiptData.items
                  .map(
                    item => `
                    <div class="item">
                        <span>${item.name}</span>
                        <span>UGX {Number(item.total_price || 0).toLocaleString()}</span>
                    </div>
                    <div style="font-size: 10px; color: #666;">
                        ${item.quantity} x UGX {Number(item.unit_price || 0).toLocaleString()}
                    </div>
                `
                  )
                  .join('')}
                <div class="line"></div>
                <div class="item">
                    <span>Subtotal:</span>
                    <span>UGX {Number(receiptData.subtotal || 0).toLocaleString()}</span>
                </div>
                ${
                  receiptData.discount_amount > 0
                    ? `
                    <div class="item">
                        <span>Discount:</span>
                        <span>-UGX {Number(receiptData.discount_amount || 0).toLocaleString()}</span>
                    </div>
                `
                    : ''
                }
                <div class="item">
                    <span>Tax:</span>
                    <span>UGX {Number(receiptData.tax_amount || 0).toLocaleString()}</span>
                </div>
                <div class="item total">
                    <span>TOTAL:</span>
                    <span>UGX {Number(receiptData.total_amount || 0).toLocaleString()}</span>
                </div>
                <div class="line"></div>
                ${receiptData.payments
                  .map(
                    payment => `
                    <div class="item">
                        <span>${payment.method}:</span>
                        <span>UGX {Number(payment.amount || 0).toLocaleString()}</span>
                    </div>
                `
                  )
                  .join('')}
                ${
                  receiptData.customer && receiptData.customer.loyalty_points
                    ? `
                    <div class="line"></div>
                    <p>Loyalty Points Earned: ${receiptData.customer.loyalty_points}</p>
                `
                    : ''
                }
                <div class="line"></div>
                <p style="text-align: center;">Thank you for your business!</p>
            </body>
            </html>
        `;
  };

  // Effects
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchMedicines(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, medicines]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchCustomers(customerSearchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [customerSearchQuery, customers]);

  useEffect(() => {
    calculateTotals();
  }, [cart, selectedCustomer]);

  // Calculate change
  const change = parseFloat(amountTendered) - totals.total_amount;

  return (
    <AuthenticatedLayout>
      <Head title="POS System - MediTrack" />

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

        <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Professional Header */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-3xl p-8 mb-8 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-2xl`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className={`relative w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-500 via-primary-500 to-primary-600 flex items-center justify-center shadow-2xl group`}>
                  <i className="bi bi-calculator text-3xl text-white"></i>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-400 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                </div>
                <div>
                  <h1 className={`text-5xl font-black mb-2 ${darkMode ? 'bg-gradient-to-r from-accent-400 via-primary-400 to-primary-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-accent-600 via-primary-600 to-primary-600 bg-clip-text text-transparent'}`}>
                    Point of Sale
                  </h1>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                    Advanced pharmacy transaction processing system
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                      <i className="bi bi-shield-check"></i>
                      <span className="text-sm font-semibold">Secure Transactions</span>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${darkMode ? 'bg-white/10 text-gray-300 border border-white/20' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                      <span className="text-sm font-medium">Terminal: {terminals?.[0]?.name || 'Main'}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold">Live System</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className={`flex items-center gap-1 p-1 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid'
                        ? darkMode ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-blue-600 shadow-md'
                        : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <i className="bi bi-grid-3x3-gap"></i>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'list'
                        ? darkMode ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-blue-600 shadow-md'
                        : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <i className="bi bi-list"></i>
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

                {/* Quick Actions */}
                <a
                  href="/customers"
                  className="px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  <i className="bi bi-people-fill"></i>
                  <span>Customers</span>
                </a>
                <a
                  href="/medicines"
                  className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 ${
                    darkMode 
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <i className="bi bi-capsule"></i>
                  <span>Medicines</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Product Search & Cart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Advanced Search Section */}
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${darkMode ? 'bg-blue-500/30' : 'bg-blue-100'} flex items-center justify-center`}>
                    <i className={`bi bi-search text-xl ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Product Search</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Find medicines by name, barcode, or category</p>
                  </div>
                </div>

                <div className="relative">
                  <i className={`bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search medicine by name, barcode, or scan..."
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border ${
                      darkMode 
                        ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-lg`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button className={`p-2 rounded-lg ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                      <i className={`bi bi-upc-scan text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Advanced Search Results */}
                {searchResults.length > 0 && (
                  <div className={`mt-4 border ${darkMode ? 'border-white/20' : 'border-gray-200'} rounded-xl max-h-80 overflow-y-auto backdrop-blur-sm`}>
                    {searchResults.map(medicine => {
                      const { icon: categoryIcon, category } = getCategoryInfo(medicine.name);
                      
                      const stockLevel = medicine.available_stock || medicine.stock || 0;
                      const stockColor = stockLevel > 50 ? (darkMode ? 'text-green-400' : 'text-green-600') : 
                                       stockLevel > 10 ? (darkMode ? 'text-yellow-400' : 'text-yellow-600') : (darkMode ? 'text-red-400' : 'text-red-600');
                      
                      return (
                        <div
                          key={medicine.id}
                          className={`group p-4 ${darkMode ? 'hover:bg-white/10' : 'hover:bg-white/80'} cursor-pointer border-b ${darkMode ? 'border-white/10' : 'border-gray-100'} last:border-b-0 transition-all duration-300 hover:shadow-lg`}
                          onClick={() => addToCart(medicine)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-gray-100'} flex items-center justify-center text-lg group-hover:scale-110 transition-transform`}>
                                  {categoryIcon}
                                </div>
                                <div>
                                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-blue-600 transition-colors`}>{medicine.name}</h4>
                                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{medicine.generic_name || medicine.brand}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                                  <i className={`bi bi-box-seam text-sm ${stockColor}`}></i>
                                  <span className={`text-xs font-medium ${stockColor}`}>
                                    {stockLevel} {medicine.unit || 'units'}
                                  </span>
                                </div>
                                {(medicine.category || category) && (
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                                    {medicine.category || category}
                                  </span>
                                )}
                                {medicine.requires_prescription && (
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-800'}`}>
                                    <i className="bi bi-prescription2 mr-1"></i>
                                    Rx Required
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-6">
                              <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'} mb-1`}>
                                UGX {Number(medicine.selling_price || medicine.price || 0).toLocaleString()}
                              </p>
                              <button className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} transition-all duration-300 flex items-center gap-2 group-hover:scale-105`}>
                                <i className="bi bi-plus-lg"></i>
                                <span className="text-sm font-medium">Add to Cart</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Add Popular Medicines */}
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${darkMode ? 'bg-purple-500/30' : 'bg-purple-100'} flex items-center justify-center`}>
                      <i className={`bi bi-lightning-charge-fill text-xl ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}></i>
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Add - Popular Items</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Fast access to frequently sold medicines</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                      <i className="bi bi-graph-up mr-1"></i>
                      Top Sellers
                    </span>
                  </div>
                </div>

                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1'} gap-4`}>
                  {medicines.slice(0, 8).map(medicine => {
                    const { icon: categoryIcon } = getCategoryInfo(medicine.name);
                    
                    return (
                      <button
                        key={medicine.id}
                        onClick={() => addToCart(medicine)}
                        className={`group p-4 border ${darkMode ? 'border-white/20 hover:border-blue-400/50 bg-white/5 hover:bg-white/10' : 'border-gray-200 hover:border-blue-300 bg-white/50 hover:bg-white/80'} rounded-xl transition-all duration-300 text-left hover:shadow-lg hover:scale-105`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-gray-100'} flex items-center justify-center text-lg group-hover:scale-110 transition-transform`}>
                            {categoryIcon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'} truncate group-hover:text-blue-600 transition-colors`}>
                              {medicine.name}
                            </h4>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>{medicine.brand}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                            UGX {Number(medicine.selling_price || medicine.price || 0).toLocaleString()}
                          </p>
                          <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <i className="bi bi-plus-lg text-sm"></i>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Shopping Cart */}
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl overflow-hidden`}>
                <div className={`p-6 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'} bg-gradient-to-r ${darkMode ? 'from-primary-800/50 to-primary-700/50' : 'from-accent-50/50 to-primary-50/50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${darkMode ? 'bg-indigo-500/30' : 'bg-indigo-100'} flex items-center justify-center`}>
                        <i className={`bi bi-cart3 text-xl ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}></i>
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Shopping Cart
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {cart.length} {cart.length === 1 ? 'item' : 'items'} • UGX {Number(cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setCart([])}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                          darkMode 
                            ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-400/30' 
                            : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
                        }`}
                      >
                        <i className="bi bi-trash mr-2"></i>
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {medicinesLoading ? (
                    <div className="text-center py-12">
                      <div className={`w-20 h-20 mx-auto mb-6 ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-2xl flex items-center justify-center`}>
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                      </div>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} font-medium`}>Loading medicines...</p>
                    </div>
                  ) : cart.length === 0 ? (
                    <div className="text-center py-12">
                      <div className={`w-20 h-20 mx-auto mb-6 ${darkMode ? 'bg-gray-500/20' : 'bg-gray-100'} rounded-2xl flex items-center justify-center`}>
                        <i className={`bi bi-cart-plus text-3xl ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
                      </div>
                      <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Cart is Empty</h4>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Search and add medicines to start a sale</p>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                          <i className="bi bi-search mr-1"></i>
                          Search above
                        </span>
                        <span className={`px-3 py-1 rounded-full ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                          <i className="bi bi-lightning mr-1"></i>
                          Quick add
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {cart.map(item => {
                        const { icon: categoryIcon, category } = getCategoryInfo(item.name);
                        
                        return (
                          <div
                            key={item.medicine_id}
                            className={`group p-4 border ${darkMode ? 'border-white/20 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-white/50 hover:bg-white/80'} rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-gray-100'} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                                    {categoryIcon}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-blue-600 transition-colors`}>{item.name}</h4>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.generic_name}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                    <i className="bi bi-cash-coin text-sm"></i>
                                    <span className="text-sm font-medium">UGX {Number(item.unit_price).toLocaleString()} each</span>
                                  </div>
                                  {(item.category || category) && (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                                      {item.category || category}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 ml-6">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateCartItemQuantity(item.medicine_id, item.quantity - 1)}
                                    className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'} flex items-center justify-center transition-all duration-300 hover:scale-110`}
                                  >
                                    <i className="bi bi-dash-lg"></i>
                                  </button>
                                  <div className={`w-16 h-10 rounded-xl ${darkMode ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'} flex items-center justify-center font-bold text-lg`}>
                                    {item.quantity}
                                  </div>
                                  <button
                                    onClick={() => updateCartItemQuantity(item.medicine_id, item.quantity + 1)}
                                    className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-green-100 text-green-600 hover:bg-green-200'} flex items-center justify-center transition-all duration-300 hover:scale-110`}
                                    disabled={item.quantity >= item.available_stock}
                                  >
                                    <i className="bi bi-plus-lg"></i>
                                  </button>
                                </div>

                                {/* Total Price */}
                                <div className="text-right min-w-[100px]">
                                  <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    UGX {(Number(item.quantity || 0) * Number(item.unit_price || 0)).toLocaleString()}
                                  </p>
                                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {item.quantity} × UGX {Number(item.unit_price).toLocaleString()}
                                  </p>
                                </div>

                                {/* Remove Button */}
                                <button
                                  onClick={() => removeFromCart(item.medicine_id)}
                                  className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'} flex items-center justify-center transition-all duration-300 hover:scale-110`}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Customer & Checkout */}
            <div className="space-y-6">
              {/* Advanced Customer Selection */}
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${darkMode ? 'bg-blue-500/30' : 'bg-blue-100'} flex items-center justify-center`}>
                    <i className={`bi bi-person-circle text-xl ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Customer</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Select or add customer for loyalty benefits</p>
                  </div>
                </div>

                {selectedCustomer ? (
                  <div className={`p-6 rounded-2xl border-2 ${darkMode ? 'bg-gradient-to-br from-accent-500/20 to-primary-600/20 border-accent-400/30' : 'bg-gradient-to-br from-accent-50 to-primary-50 border-accent-200'} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 to-transparent opacity-50"></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {selectedCustomer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-blue-900'} mb-1`}>{selectedCustomer.name}</h4>
                            <div className="space-y-1">
                              <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'} flex items-center gap-2`}>
                                <i className="bi bi-envelope"></i>
                                {selectedCustomer.email}
                              </p>
                              <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'} flex items-center gap-2`}>
                                <i className="bi bi-telephone"></i>
                                {selectedCustomer.phone}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className={`p-2 rounded-xl ${darkMode ? 'text-blue-300 hover:text-white hover:bg-white/20' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'} transition-all duration-300`}
                        >
                          <i className="bi bi-x-lg text-lg"></i>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-white/50'} text-center`}>
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <i className={`bi bi-star-fill text-yellow-500`}></i>
                            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-blue-800'}`}>Tier</span>
                          </div>
                          <p className={`font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                            {selectedCustomer.tier || 'Regular'}
                          </p>
                        </div>
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-white/50'} text-center`}>
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <i className={`bi bi-gem text-purple-500`}></i>
                            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-blue-800'}`}>Points</span>
                          </div>
                          <p className={`font-bold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                            {selectedCustomer.loyalty_points || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-4">
                      <i className={`bi bi-person-plus absolute left-4 top-1/2 -translate-y-1/2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                      <input
                        ref={customerSearchRef}
                        type="text"
                        placeholder="Search customer by name, email, or phone..."
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                          darkMode 
                            ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                        value={customerSearchQuery}
                        onChange={e => setCustomerSearchQuery(e.target.value)}
                      />
                      <button className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                        <i className={`bi bi-person-plus-fill ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
                      </button>
                    </div>

                    {customerSearchResults.length > 0 && (
                      <div className={`border ${darkMode ? 'border-white/20' : 'border-gray-200'} rounded-xl max-h-60 overflow-y-auto backdrop-blur-sm`}>
                        {customerSearchResults.map(customer => (
                          <div
                            key={customer.id}
                            className={`group p-4 ${darkMode ? 'hover:bg-white/10' : 'hover:bg-white/80'} cursor-pointer border-b ${darkMode ? 'border-white/10' : 'border-gray-100'} last:border-b-0 transition-all duration-300`}
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCustomerSearchQuery('');
                              setCustomerSearchResults([]);
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} group-hover:text-blue-600 transition-colors`}>{customer.name}</h4>
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{customer.email}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${darkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>
                                    <i className="bi bi-star-fill text-xs"></i>
                                    <span className="text-xs font-medium">{customer.tier || 'Regular'}</span>
                                  </div>
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                                    <i className="bi bi-gem text-xs"></i>
                                    <span className="text-xs font-medium">{customer.loyalty_points || 0} pts</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <i className="bi bi-arrow-right"></i>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Walk-in Customer Option */}
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setSelectedCustomer({ 
                            id: null, 
                            name: 'Walk-in Customer', 
                            email: '', 
                            phone: '', 
                            tier: 'Regular', 
                            loyalty_points: 0 
                          });
                          setCustomerSearchQuery('');
                          setCustomerSearchResults([]);
                        }}
                        className={`w-full p-4 rounded-xl border-2 border-dashed ${darkMode ? 'border-white/20 hover:border-blue-400/50 bg-white/5 hover:bg-white/10' : 'border-gray-300 hover:border-blue-300 bg-gray-50 hover:bg-blue-50'} transition-all duration-300 group`}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-gray-200'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <i className={`bi bi-person-walking text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}></i>
                          </div>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Walk-in Customer</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No loyalty benefits</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Coupon Section */}
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${darkMode ? 'bg-green-500/30' : 'bg-green-100'} flex items-center justify-center`}>
                    <i className={`bi bi-tag-fill text-xl ${darkMode ? 'text-green-300' : 'text-green-600'}`}></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Discount Coupon</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Apply promotional codes for discounts</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <i className={`bi bi-percent absolute left-4 top-1/2 -translate-y-1/2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                    <input
                      type="text"
                      placeholder="Enter coupon code (SAVE10, BULK20, etc.)"
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                        darkMode 
                          ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300`}
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={applyCoupon}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    <i className="bi bi-check-circle"></i>
                    <span>Apply</span>
                  </button>
                </div>

                {/* Sample Coupons */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {['SAVE10', 'BULK20', 'WELCOME', 'SAVE5'].map(code => (
                    <button
                      key={code}
                      onClick={() => setCouponCode(code)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                        darkMode 
                          ? 'bg-white/10 text-gray-300 hover:bg-white/20' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Sales Summary */}
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${darkMode ? 'bg-indigo-500/30' : 'bg-indigo-100'} flex items-center justify-center`}>
                    <i className={`bi bi-graph-up-arrow text-xl ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Today's Performance</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Real-time sales analytics</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-400/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'} text-center group hover:scale-105 transition-transform duration-300`}>
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${darkMode ? 'bg-green-500/30' : 'bg-green-100'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <i className={`bi bi-cash-coin text-xl ${darkMode ? 'text-green-300' : 'text-green-600'}`}></i>
                    </div>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'} mb-1`}>
                      UGX {Number(salesStats.todayTotal || 0).toLocaleString()}
                    </p>
                    <p className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Total Sales</p>
                  </div>
                  <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-accent-500/20 to-primary-600/20 border border-accent-400/30' : 'bg-gradient-to-br from-accent-50 to-primary-50 border border-accent-200'} text-center group hover:scale-105 transition-transform duration-300`}>
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-xl ${darkMode ? 'bg-accent-500/30' : 'bg-accent-100'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <i className={`bi bi-receipt text-xl ${darkMode ? 'text-accent-300' : 'text-accent-600'}`}></i>
                    </div>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-1`}>
                      {salesStats.todayCount || 0}
                    </p>
                    <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Transactions</p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/10' : 'bg-white/50'} border-t ${darkMode ? 'border-white/20' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-bar-chart text-lg ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}></i>
                      <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average Order:</span>
                    </div>
                    <span className={`text-lg font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      UGX {Number(salesStats.averageOrderValue || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Advanced Order Summary */}
              <div className={`backdrop-blur-xl ${darkMode ? 'bg-white/5' : 'bg-white/40'} rounded-2xl p-6 border ${darkMode ? 'border-white/10' : 'border-white/60'} shadow-xl`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${darkMode ? 'bg-orange-500/30' : 'bg-orange-100'} flex items-center justify-center`}>
                    <i className={`bi bi-calculator text-xl ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}></i>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order Summary</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Transaction breakdown and totals</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal:</span>
                    <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>UGX {Number(totals.subtotal || 0).toLocaleString()}</span>
                  </div>

                  {totals.discount_amount > 0 && (
                    <div className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                      <div className="flex items-center gap-2">
                        <i className={`bi bi-tag-fill ${darkMode ? 'text-green-400' : 'text-green-600'}`}></i>
                        <span className={`font-medium ${darkMode ? 'text-green-300' : 'text-green-600'}`}>Discount:</span>
                      </div>
                      <span className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>-UGX {Number(totals.discount_amount || 0).toLocaleString()}</span>
                    </div>
                  )}

                  <div className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <i className={`bi bi-percent ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}></i>
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tax (10%):</span>
                    </div>
                    <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>UGX {Number(totals.tax_amount || 0).toLocaleString()}</span>
                  </div>

                  <div className={`p-4 rounded-xl border-2 ${darkMode ? 'border-accent-400/30 bg-gradient-to-r from-accent-500/20 to-primary-600/20' : 'border-accent-200 bg-gradient-to-r from-accent-50 to-primary-50'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <i className={`bi bi-cash-coin text-xl ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}></i>
                        <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                      </div>
                      <span className={`text-3xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>UGX {Number(totals.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {totals.loyalty_points_earned > 0 && (
                    <div className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                      <div className="flex items-center gap-2">
                        <i className={`bi bi-star-fill ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}></i>
                        <span className={`font-medium ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>Points to Earn:</span>
                      </div>
                      <span className={`text-lg font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{totals.loyalty_points_earned} points</span>
                    </div>
                  )}
                </div>

                {/* Advanced Checkout Button */}
                <div className="mt-8 space-y-4">
                  <button
                    onClick={processCheckout}
                    disabled={cart.length === 0 || isProcessing}
                    className={`group relative w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden ${
                      cart.length === 0 || isProcessing
                        ? darkMode 
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-accent-500 via-primary-500 to-primary-600 text-white shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Processing Transaction...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-credit-card-2-front text-xl"></i>
                          <span>Proceed to Payment</span>
                          <i className="bi bi-arrow-right text-xl group-hover:translate-x-1 transition-transform"></i>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Quick Payment Options */}
                  {cart.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setAmountTendered(totals.total_amount.toString());
                          processCheckout();
                        }}
                        className={`p-3 rounded-xl border-2 border-dashed ${darkMode ? 'border-green-400/30 bg-green-500/10 text-green-300 hover:bg-green-500/20' : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'} transition-all duration-300 flex items-center justify-center gap-2 font-medium`}
                      >
                        <i className="bi bi-cash-stack"></i>
                        <span className="text-sm">Cash</span>
                      </button>
                      <button
                        onClick={() => {
                          setPaymentData(prev => ({ ...prev, card: totals.total_amount }));
                          processCheckout();
                        }}
                        className={`p-3 rounded-xl border-2 border-dashed ${darkMode ? 'border-blue-400/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20' : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'} transition-all duration-300 flex items-center justify-center gap-2 font-medium`}
                      >
                        <i className="bi bi-credit-card"></i>
                        <span className="text-sm">Card</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Process Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-900">
                  UGX {Number(totals.total_amount || 0).toLocaleString()}
                </p>
                <p className="text-blue-700">Total Amount Due</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Cash Payment */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <BanknotesIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Cash Payment</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount tendered"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={amountTendered}
                  onChange={e => setAmountTendered(e.target.value)}
                />
                {change > 0 && (
                  <p className="text-sm text-green-600 mt-1">Change: UGX {Number(change || 0).toLocaleString()}</p>
                )}
              </div>

              {/* Other Payment Methods */}
              {Object.entries(paymentMethods).map(([method, config]) => {
                if (method === 'cash') return null;

                const icons = {
                  card: CreditCardIcon,
                  mobile_money: DevicePhoneMobileIcon,
                  insurance: ShieldCheckIcon,
                  loyalty_points: StarIcon,
                };

                const Icon = icons[method] || CreditCardIcon;

                return (
                  <div key={method}>
                    <label className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{config.name}</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={paymentData[method]}
                      onChange={e =>
                        setPaymentData({
                          ...paymentData,
                          [method]: e.target.value,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={isProcessing}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && currentTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Successful!</h3>
              <p className="text-gray-600">Transaction ID: {currentTransaction.transaction_id}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={printReceipt}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PrinterIcon className="h-5 w-5" />
                Print Receipt
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setCurrentTransaction(null);
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
