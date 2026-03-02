import { useState, useEffect } from 'react';

export function usePurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    todayTotal: 0,
    todayCount: 0,
    weeklyTotal: 0,
    monthlyTotal: 0,
    pendingOrders: 0,
  });

  // Load purchases from localStorage
  useEffect(() => {
    const loadPurchases = () => {
      try {
        const storedPurchases = localStorage.getItem('meditrack_purchases');
        const purchasesData = storedPurchases ? JSON.parse(storedPurchases) : [];
        setPurchases(purchasesData);
        calculateStats(purchasesData);
      } catch (error) {
        console.error('Error loading purchases:', error);
        setPurchases([]);
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();

    // Listen for purchase updates
    const handlePurchasesUpdate = () => {
      loadPurchases();
    };

    window.addEventListener('purchasesUpdated', handlePurchasesUpdate);
    return () => window.removeEventListener('purchasesUpdated', handlePurchasesUpdate);
  }, []);

  // Calculate statistics
  const calculateStats = (purchasesData) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayPurchases = purchasesData.filter(purchase => {
      const purchaseDate = new Date(purchase.created_at);
      return purchaseDate >= today;
    });

    const weeklyPurchases = purchasesData.filter(purchase => {
      const purchaseDate = new Date(purchase.created_at);
      return purchaseDate >= weekAgo;
    });

    const monthlyPurchases = purchasesData.filter(purchase => {
      const purchaseDate = new Date(purchase.created_at);
      return purchaseDate >= monthAgo;
    });

    const pendingPurchases = purchasesData.filter(purchase => purchase.status === 'pending');

    const todayTotal = todayPurchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);
    const weeklyTotal = weeklyPurchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);
    const monthlyTotal = monthlyPurchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);

    setStats({
      total: purchasesData.length,
      todayTotal,
      todayCount: todayPurchases.length,
      weeklyTotal,
      monthlyTotal,
      pendingOrders: pendingPurchases.length,
    });
  };

  // Save purchases to localStorage
  const savePurchases = (purchasesData) => {
    try {
      localStorage.setItem('meditrack_purchases', JSON.stringify(purchasesData));
      window.dispatchEvent(new Event('purchasesUpdated'));
    } catch (error) {
      console.error('Error saving purchases:', error);
    }
  };

  // Add new purchase
  const addPurchase = (purchaseData) => {
    const newPurchase = {
      id: Date.now(),
      purchase_order: `PO-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      ...purchaseData,
    };

    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);
    calculateStats(updatedPurchases);
    return newPurchase;
  };

  // Update purchase
  const updatePurchase = (id, updates) => {
    const updatedPurchases = purchases.map(purchase =>
      purchase.id === id ? { ...purchase, ...updates, updated_at: new Date().toISOString() } : purchase
    );
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);
    calculateStats(updatedPurchases);
  };

  // Delete purchase
  const deletePurchase = (id) => {
    const updatedPurchases = purchases.filter(purchase => purchase.id !== id);
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);
    calculateStats(updatedPurchases);
  };

  // Get purchase by ID
  const getPurchase = (id) => {
    return purchases.find(purchase => purchase.id === id);
  };

  // Get purchases by supplier
  const getPurchasesBySupplier = (supplierId) => {
    return purchases.filter(purchase => purchase.supplier_id === supplierId);
  };

  return {
    purchases,
    loading,
    stats,
    addPurchase,
    updatePurchase,
    deletePurchase,
    getPurchase,
    getPurchasesBySupplier,
  };
}
