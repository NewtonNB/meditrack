import { useState, useEffect } from 'react';

export function useSales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    todayTotal: 0,
    todayCount: 0,
    weeklyTotal: 0,
    monthlyTotal: 0,
    averageOrderValue: 0,
  });

  // Load sales from localStorage
  useEffect(() => {
    const loadSales = () => {
      try {
        const storedSales = localStorage.getItem('meditrack_sales');
        const salesData = storedSales ? JSON.parse(storedSales) : [];
        setSales(salesData);
        calculateStats(salesData);
      } catch (error) {
        console.error('Error loading sales:', error);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    loadSales();

    // Listen for sales updates
    const handleSalesUpdate = () => {
      loadSales();
    };

    window.addEventListener('salesUpdated', handleSalesUpdate);
    return () => window.removeEventListener('salesUpdated', handleSalesUpdate);
  }, []);

  // Calculate statistics
  const calculateStats = (salesData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todaySales = salesData.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= today;
    });

    const weeklySales = salesData.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= weekAgo;
    });

    const monthlySales = salesData.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= monthAgo;
    });

    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const weeklyRevenue = weeklySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

    setStats({
      total: salesData.length,
      todayTotal: todayRevenue,
      todayCount: todaySales.length,
      weeklyTotal: weeklyRevenue,
      monthlyTotal: monthlyRevenue,
      averageOrderValue: salesData.length > 0 ? totalRevenue / salesData.length : 0,
    });
  };

  // Save sales to localStorage
  const saveSales = (salesData) => {
    try {
      localStorage.setItem('meditrack_sales', JSON.stringify(salesData));
      window.dispatchEvent(new Event('salesUpdated'));
    } catch (error) {
      console.error('Error saving sales:', error);
    }
  };

  // Add new sale
  const addSale = async (saleData) => {
    try {
      // Save to database first
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
        body: JSON.stringify({
          ...saleData,
          sale_type: 'pos', // Mark as POS sale
          created_at: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const savedSale = await response.json();
        
        // Also save to localStorage for immediate UI update
        const newSale = {
          id: savedSale.id || Date.now(),
          transaction_id: savedSale.transaction_id || `TXN-${Date.now()}`,
          created_at: savedSale.created_at || new Date().toISOString(),
          ...saleData,
        };

        const updatedSales = [newSale, ...sales];
        setSales(updatedSales);
        saveSales(updatedSales);
        calculateStats(updatedSales);
        
        return savedSale;
      } else {
        throw new Error('Failed to save sale to database');
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      
      // Fallback to localStorage only
      const newSale = {
        id: Date.now(),
        transaction_id: `TXN-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...saleData,
      };

      const updatedSales = [newSale, ...sales];
      setSales(updatedSales);
      saveSales(updatedSales);
      calculateStats(updatedSales);
      return newSale;
    }
  };

  // Update sale
  const updateSale = (id, updates) => {
    const updatedSales = sales.map(sale =>
      sale.id === id ? { ...sale, ...updates, updated_at: new Date().toISOString() } : sale
    );
    setSales(updatedSales);
    saveSales(updatedSales);
    calculateStats(updatedSales);
  };

  // Delete sale
  const deleteSale = (id) => {
    const updatedSales = sales.filter(sale => sale.id !== id);
    setSales(updatedSales);
    saveSales(updatedSales);
    calculateStats(updatedSales);
  };

  // Get sale by ID
  const getSale = (id) => {
    return sales.find(sale => sale.id === id);
  };

  // Get sales by customer
  const getSalesByCustomer = (customerId) => {
    return sales.filter(sale => sale.customer_id === customerId);
  };

  // Get sales by date range
  const getSalesByDateRange = (startDate, endDate) => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= startDate && saleDate <= endDate;
    });
  };

  // Generate sample sales data
  const generateSampleSales = () => {
    const sampleSales = [
      {
        id: 1,
        transaction_id: 'TXN-001',
        customer_id: 1,
        customer_name: 'John Doe',
        items: [
          { medicine_id: 1, name: 'Paracetamol', quantity: 2, unit_price: 5.99, total: 11.98 },
          { medicine_id: 2, name: 'Ibuprofen', quantity: 1, unit_price: 8.50, total: 8.50 },
        ],
        subtotal: 20.48,
        tax_amount: 2.05,
        discount_amount: 0,
        total_amount: 22.53,
        payment_method: 'cash',
        status: 'completed',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        transaction_id: 'TXN-002',
        customer_id: 2,
        customer_name: 'Jane Smith',
        items: [
          { medicine_id: 3, name: 'Amoxicillin', quantity: 1, unit_price: 15.99, total: 15.99 },
        ],
        subtotal: 15.99,
        tax_amount: 1.60,
        discount_amount: 2.00,
        total_amount: 15.59,
        payment_method: 'card',
        status: 'completed',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      },
    ];

    setSales(sampleSales);
    saveSales(sampleSales);
    calculateStats(sampleSales);
  };

  return {
    sales,
    loading,
    stats,
    addSale,
    updateSale,
    deleteSale,
    getSale,
    getSalesByCustomer,
    getSalesByDateRange,
    generateSampleSales,
  };
}