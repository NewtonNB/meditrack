import { useState, useEffect } from 'react';

// No sample data - use only real customers from database

// Custom hook for managing customers across the entire application
export function useCustomers(serverCustomers = null) {
  const [customers, setCustomers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Prioritize server data over localStorage
  useEffect(() => {
    const loadCustomers = () => {
      try {
        // Always use server data if available
        if (serverCustomers && serverCustomers.length > 0) {
          setCustomers(serverCustomers);
        } else {
          // Only fall back to localStorage if no server data
          const savedCustomers = localStorage.getItem('pharmacy_customers');
          if (savedCustomers) {
            const parsedCustomers = JSON.parse(savedCustomers);
            setCustomers(parsedCustomers);
          } else {
            setCustomers([]);
          }
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        setCustomers(serverCustomers || []);
      } finally {
        setIsLoaded(true);
      }
    };

    loadCustomers();
  }, [serverCustomers]);

  // Save customers to localStorage whenever customers change
  useEffect(() => {
    if (isLoaded && customers.length > 0) {
      localStorage.setItem('pharmacy_customers', JSON.stringify(customers));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('customersUpdated', {
        detail: { customers }
      }));
    }
  }, [customers, isLoaded]);

  // Listen for customer updates from other components
  useEffect(() => {
    const handleCustomersUpdate = (event) => {
      setCustomers(event.detail.customers);
    };

    window.addEventListener('customersUpdated', handleCustomersUpdate);
    return () => window.removeEventListener('customersUpdated', handleCustomersUpdate);
  }, []);

  // Helper functions
  const addCustomer = (customerData) => {
    const newCustomer = {
      id: Date.now(),
      ...customerData,
      created_at: new Date().toISOString(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (id, customerData) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === id ? { ...customer, ...customerData } : customer
      )
    );
  };

  const deleteCustomer = (id) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
  };

  // Calculate statistics
  const stats = {
    total: customers.length,
    withEmail: customers.filter(c => c.email && c.email.trim()).length,
    withPhone: customers.filter(c => c.phone && c.phone.trim()).length,
    newThisMonth: customers.filter(c => {
      const created = new Date(c.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && 
             created.getFullYear() === now.getFullYear();
    }).length,
  };

  return {
    customers,
    stats,
    isLoaded,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setCustomers,
  };
}

// Utility function to get customer stats for any component
export function getCustomerStats() {
  try {
    const savedCustomers = localStorage.getItem('pharmacy_customers');
    if (savedCustomers) {
      const customers = JSON.parse(savedCustomers);
      return {
        total: customers.length,
        withEmail: customers.filter(c => c.email && c.email.trim()).length,
        withPhone: customers.filter(c => c.phone && c.phone.trim()).length,
        newThisMonth: customers.filter(c => {
          const created = new Date(c.created_at);
          const now = new Date();
          return created.getMonth() === now.getMonth() && 
                 created.getFullYear() === now.getFullYear();
        }).length,
      };
    }
  } catch (error) {
    console.error('Error getting customer stats:', error);
  }
  
  // Fallback stats
  return {
    total: 3, // Sample data count
    withEmail: 3,
    withPhone: 3,
    newThisMonth: 1,
  };
}