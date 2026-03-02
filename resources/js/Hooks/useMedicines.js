import { useState, useEffect } from 'react';

// Sample medicines data (fallback)
const sampleMedicines = [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    brand: 'GSK',
    category: 'Pain Relief',
    price: 2000,
    cost: 1500,
    stock: 100,
    min_stock: 20,
    expiry_date: '2025-12-31',
    batch_number: 'PAR001',
    supplier: 'Medical Supplies Ltd',
    created_at: '2025-01-01',
  },
  {
    id: 2,
    name: 'Ibuprofen 400mg',
    brand: 'Pfizer',
    category: 'Pain Relief',
    price: 2500,
    cost: 2000,
    stock: 80,
    min_stock: 15,
    expiry_date: '2025-11-30',
    batch_number: 'IBU002',
    supplier: 'Pharma Distributors',
    created_at: '2025-01-02',
  },
  {
    id: 3,
    name: 'Amoxicillin 250mg',
    brand: 'Cipla',
    category: 'Antibiotics',
    price: 3000,
    cost: 2200,
    stock: 50,
    min_stock: 10,
    expiry_date: '2025-10-15',
    batch_number: 'AMX003',
    supplier: 'Global Pharma',
    created_at: '2025-01-03',
  },
  {
    id: 4,
    name: 'Cough Syrup 100ml',
    brand: 'Benylin',
    category: 'Respiratory',
    price: 5000,
    cost: 3500,
    stock: 25,
    min_stock: 5,
    expiry_date: '2025-09-30',
    batch_number: 'CSY004',
    supplier: 'Medical Supplies Ltd',
    created_at: '2025-01-04',
  },
  {
    id: 5,
    name: 'Vitamin C 1000mg',
    brand: 'Nature Made',
    category: 'Vitamins',
    price: 1500,
    cost: 1000,
    stock: 15,
    min_stock: 8,
    expiry_date: '2026-03-15',
    batch_number: 'VTC005',
    supplier: 'Health Products Inc',
    created_at: '2025-01-05',
  },
];

// Custom hook for managing medicines across the entire application
export function useMedicines(serverMedicines = null) {
  const [medicines, setMedicines] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load medicines - prioritize server data over localStorage
  useEffect(() => {
    const loadMedicines = () => {
      try {
        // Always use server data if available (most up-to-date)
        if (serverMedicines && serverMedicines.length > 0) {
          setMedicines(serverMedicines);
          // Update localStorage with fresh server data
          localStorage.setItem('pharmacy_medicines', JSON.stringify(serverMedicines));
        } else {
          // Fall back to localStorage only if no server data
          const savedMedicines = localStorage.getItem('pharmacy_medicines');
          if (savedMedicines) {
            const parsedMedicines = JSON.parse(savedMedicines);
            setMedicines(parsedMedicines);
          } else {
            // Last resort: use sample data
            setMedicines(sampleMedicines);
          }
        }
      } catch (error) {
        console.error('Error loading medicines:', error);
        setMedicines(serverMedicines || sampleMedicines);
      } finally {
        setIsLoaded(true);
      }
    };

    loadMedicines();
  }, [serverMedicines]);

  // Save medicines to localStorage whenever medicines change
  useEffect(() => {
    if (isLoaded && medicines.length > 0) {
      localStorage.setItem('pharmacy_medicines', JSON.stringify(medicines));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('medicinesUpdated', {
        detail: { medicines }
      }));
    }
  }, [medicines, isLoaded]);

  // Listen for medicine updates from other components
  useEffect(() => {
    const handleMedicinesUpdate = (event) => {
      setMedicines(event.detail.medicines);
    };

    window.addEventListener('medicinesUpdated', handleMedicinesUpdate);
    return () => window.removeEventListener('medicinesUpdated', handleMedicinesUpdate);
  }, []);

  // Helper functions
  const addMedicine = async (medicineData) => {
    try {
      // Make API call to create medicine in database
      const response = await fetch('/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(medicineData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Add to local state only if API call succeeds
      const newMedicine = {
        id: result.id || Date.now(),
        ...medicineData,
        created_at: new Date().toISOString(),
      };
      setMedicines(prev => [...prev, newMedicine]);
      
      return { success: true, data: newMedicine };
    } catch (error) {
      console.error('Error adding medicine:', error);
      return { success: false, error: error.message };
    }
  };

  const updateMedicine = async (id, medicineData) => {
    try {
      // Make API call to update medicine in database
      const response = await fetch(`/medicines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(medicineData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local state only if API call succeeds
      setMedicines(prev => 
        prev.map(medicine => 
          medicine.id === id ? { ...medicine, ...medicineData } : medicine
        )
      );

      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating medicine:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteMedicine = (id) => {
    setMedicines(prev => prev.filter(medicine => medicine.id !== id));
  };

  const updateStock = async (id, newStock) => {
    try {
      // Make API call to update medicine stock in database
      const response = await fetch(`/medicines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ stock: newStock }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local state only if API call succeeds
      setMedicines(prev => 
        prev.map(medicine => 
          medicine.id === id ? { ...medicine, stock: newStock } : medicine
        )
      );

      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating stock:', error);
      return { success: false, error: error.message };
    }
  };

  // Calculate statistics
  const stats = {
    total: medicines.length,
    lowStock: medicines.filter(m => m.stock <= (m.min_stock || 10)).length,
    outOfStock: medicines.filter(m => m.stock === 0).length,
    expiringSoon: medicines.filter(m => {
      const expiryDate = new Date(m.expiry_date);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      return expiryDate <= threeMonthsFromNow;
    }).length,
    totalValue: medicines.reduce((sum, m) => sum + (m.price * m.stock), 0),
    categories: [...new Set(medicines.map(m => m.category))].length,
    byCategory: medicines.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {}),
  };

  return {
    medicines,
    stats,
    isLoaded,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    updateStock,
    setMedicines,
  };
}

// Utility function to get medicine stats for any component
export function getMedicineStats() {
  try {
    const savedMedicines = localStorage.getItem('pharmacy_medicines');
    if (savedMedicines) {
      const medicines = JSON.parse(savedMedicines);
      return {
        total: medicines.length,
        lowStock: medicines.filter(m => m.stock <= (m.min_stock || 10)).length,
        outOfStock: medicines.filter(m => m.stock === 0).length,
        expiringSoon: medicines.filter(m => {
          const expiryDate = new Date(m.expiry_date);
          const threeMonthsFromNow = new Date();
          threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
          return expiryDate <= threeMonthsFromNow;
        }).length,
        totalValue: medicines.reduce((sum, m) => sum + (m.price * m.stock), 0),
        categories: [...new Set(medicines.map(m => m.category))].length,
      };
    }
  } catch (error) {
    console.error('Error getting medicine stats:', error);
  }
  
  // Fallback stats
  return {
    total: 5, // Sample data count
    lowStock: 2,
    outOfStock: 0,
    expiringSoon: 1,
    totalValue: 500000,
    categories: 4,
  };
}