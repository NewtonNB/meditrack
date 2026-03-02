import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load suppliers from localStorage
  useEffect(() => {
    const loadSuppliers = () => {
      try {
        const storedSuppliers = localStorage.getItem('meditrack_suppliers');
        let suppliersData = storedSuppliers ? JSON.parse(storedSuppliers) : [];
        
        // If no suppliers exist, create some sample suppliers
        if (suppliersData.length === 0) {
          suppliersData = [
            {
              id: 1,
              name: 'MedSupply Uganda Ltd',
              phone: '0700123456',
              email: 'orders@medsupply.ug',
              address: 'Plot 15, Industrial Area, Kampala',
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              name: 'Pharma Distributors East Africa',
              phone: '0750987654',
              email: 'sales@pharmaeast.com',
              address: 'Nakawa Business Park, Kampala',
              created_at: new Date().toISOString(),
            },
            {
              id: 3,
              name: 'Quality Medical Supplies',
              phone: '0780456789',
              email: 'info@qualitymed.co.ug',
              address: 'Ntinda Shopping Complex, Kampala',
              created_at: new Date().toISOString(),
            },
            {
              id: 4,
              name: 'Global Health Partners',
              phone: '0760321654',
              email: 'procurement@globalhealth.ug',
              address: 'Kololo Heights, Kampala',
              created_at: new Date().toISOString(),
            },
            {
              id: 5,
              name: 'East African Pharmaceuticals',
              phone: '0790654321',
              email: 'orders@eapharma.com',
              address: 'Bugolobi Industrial Area, Kampala',
              created_at: new Date().toISOString(),
            }
          ];
          // Save the sample suppliers
          localStorage.setItem('meditrack_suppliers', JSON.stringify(suppliersData));
        }
        
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();

    // Listen for supplier updates
    const handleSuppliersUpdate = () => {
      loadSuppliers();
    };

    window.addEventListener('suppliersUpdated', handleSuppliersUpdate);
    return () => window.removeEventListener('suppliersUpdated', handleSuppliersUpdate);
  }, []);

  // Save suppliers to localStorage
  const saveSuppliers = (suppliersData) => {
    try {
      localStorage.setItem('meditrack_suppliers', JSON.stringify(suppliersData));
      window.dispatchEvent(new Event('suppliersUpdated'));
    } catch (error) {
      console.error('Error saving suppliers:', error);
    }
  };

  // Add new supplier
  const addSupplier = (supplierData) => {
    const newSupplier = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...supplierData,
    };

    const updatedSuppliers = [newSupplier, ...suppliers];
    setSuppliers(updatedSuppliers);
    saveSuppliers(updatedSuppliers);
    return newSupplier;
  };

  // Update supplier
  const updateSupplier = (id, updates) => {
    const updatedSuppliers = suppliers.map(supplier =>
      supplier.id === id ? { ...supplier, ...updates, updated_at: new Date().toISOString() } : supplier
    );
    setSuppliers(updatedSuppliers);
    saveSuppliers(updatedSuppliers);
  };

  // Delete supplier
  const deleteSupplier = (id) => {
    const updatedSuppliers = suppliers.filter(supplier => supplier.id !== id);
    setSuppliers(updatedSuppliers);
    saveSuppliers(updatedSuppliers);
  };

  // Get supplier by ID
  const getSupplier = (id) => {
    return suppliers.find(supplier => supplier.id === id);
  };

  const fetchSuppliers = () => {
    setLoading(true);
    router.reload({
      only: ['suppliers'],
      onSuccess: () => setLoading(false),
      onError: () => setLoading(false),
    });
  };

  return {
    suppliers,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplier,
    fetchSuppliers,
  };
}
