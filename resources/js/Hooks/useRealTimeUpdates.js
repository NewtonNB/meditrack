import { useEffect } from 'react';
import { router } from '@inertiajs/react';

/**
 * Custom hook for handling real-time updates across pages
 * @param {Object} options - Configuration options
 * @param {string} options.pageName - Name of the current page (e.g., 'dashboard', 'medicines', 'sales')
 * @param {Array} options.dataKeys - Array of data keys to reload (e.g., ['medicines', 'stats'])
 * @param {Function} options.onUpdate - Optional callback function when update occurs
 * @param {boolean} options.enabled - Whether to enable real-time updates (default: true)
 */
export function useRealTimeUpdates({ 
  pageName, 
  dataKeys = [], 
  onUpdate = null, 
  enabled = true 
}) {
  useEffect(() => {
    if (!enabled) return;

    const handleSaleCreated = (event) => {
      console.log(`${pageName}: Sale created event received`, event.detail);
      
      // Refresh data for this page
      router.reload({ 
        only: dataKeys,
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          console.log(`${pageName} page refreshed after sale creation`);
          if (onUpdate) onUpdate('sale_created', event.detail);
        }
      });
    };

    const handleSaleUpdated = (event) => {
      console.log(`${pageName}: Sale updated event received`, event.detail);
      
      // Refresh data for this page
      router.reload({ 
        only: dataKeys,
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          console.log(`${pageName} page refreshed after sale update`);
          if (onUpdate) onUpdate('sale_updated', event.detail);
        }
      });
    };

    const handlePurchaseCreated = (event) => {
      console.log(`${pageName}: Purchase created event received`, event.detail);
      
      // Refresh data for this page
      router.reload({ 
        only: dataKeys,
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          console.log(`${pageName} page refreshed after purchase creation`);
          if (onUpdate) onUpdate('purchase_created', event.detail);
        }
      });
    };

    const handleStockUpdated = (event) => {
      console.log(`${pageName}: Stock updated event received`, event.detail);
      
      // Refresh data for this page
      router.reload({ 
        only: dataKeys,
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          console.log(`${pageName} page refreshed after stock update`);
          if (onUpdate) onUpdate('stock_updated', event.detail);
        }
      });
    };

    const handleDataUpdated = (event) => {
      const { type, affectedPages } = event.detail;
      
      // Check if this page should be updated
      if (affectedPages.includes(pageName) || affectedPages.includes('all')) {
        console.log(`${pageName}: General data update event received`, event.detail);
        
        router.reload({ 
          only: dataKeys,
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            console.log(`${pageName} page refreshed after general data update`);
            if (onUpdate) onUpdate('data_updated', event.detail);
          }
        });
      }
    };

    // Add event listeners
    window.addEventListener('saleCreated', handleSaleCreated);
    window.addEventListener('saleUpdated', handleSaleUpdated);
    window.addEventListener('purchaseCreated', handlePurchaseCreated);
    window.addEventListener('stockUpdated', handleStockUpdated);
    window.addEventListener('dataUpdated', handleDataUpdated);

    // Cleanup
    return () => {
      window.removeEventListener('saleCreated', handleSaleCreated);
      window.removeEventListener('saleUpdated', handleSaleUpdated);
      window.removeEventListener('purchaseCreated', handlePurchaseCreated);
      window.removeEventListener('stockUpdated', handleStockUpdated);
      window.removeEventListener('dataUpdated', handleDataUpdated);
    };
  }, [pageName, dataKeys, onUpdate, enabled]);
}

/**
 * Utility function to dispatch update events
 * @param {string} eventType - Type of event ('saleCreated', 'saleUpdated', etc.)
 * @param {Object} data - Event data
 * @param {Array} affectedPages - Array of page names that should be updated
 */
export function dispatchUpdateEvent(eventType, data, affectedPages = []) {
  // Dispatch specific event
  window.dispatchEvent(new CustomEvent(eventType, {
    detail: {
      ...data,
      timestamp: new Date()
    }
  }));

  // Also dispatch general data update event
  window.dispatchEvent(new CustomEvent('dataUpdated', {
    detail: {
      type: eventType,
      affectedPages,
      data,
      timestamp: new Date()
    }
  }));
}

export default useRealTimeUpdates;