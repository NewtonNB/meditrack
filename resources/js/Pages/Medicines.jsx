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
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { useMedicines } from '@/Hooks/useMedicines';
// import { toast } from 'react-toastify';
import BarcodeScanner from '@/Components/BarcodeScanner';
import { useRealTimeUpdates } from '@/Hooks/useRealTimeUpdates';

export default function Medicines() {
  const { props } = usePage();
  
  // Get server medicines data - handle both paginated and non-paginated responses
  const serverMedicines = React.useMemo(() => {
    if (props.medicines?.data) {
      // Paginated response
      return props.medicines.data;
    } else if (Array.isArray(props.medicines)) {
      // Direct array
      return props.medicines;
    }
    return [];
  }, [props.medicines]);
  
  // Use shared medicines hook for real-time sync with Sales and Purchases pages
  const { 
    medicines: allMedicines, 
    addMedicine, 
    updateMedicine, 
    deleteMedicine, 
    updateStock,
    stats 
  } = useMedicines(serverMedicines);
  
  const pagination = props.medicines?.meta || null;

  const [query, setQuery] = React.useState('');
  const [perPage, setPerPage] = React.useState(10);
  const [sortKey, setSortKey] = React.useState('name');
  const [sortDir, setSortDir] = React.useState('asc');
  const [stockFilter, setStockFilter] = React.useState('all'); // all, low, out
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isStockAdjustOpen, setIsStockAdjustOpen] = React.useState(false);
  const [isRemoveExpiredOpen, setIsRemoveExpiredOpen] = React.useState(false);
  const [isReorderOpen, setIsReorderOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);

  // Use real-time updates hook
  useRealTimeUpdates({
    pageName: 'medicines',
    dataKeys: ['medicines'],
    onUpdate: (eventType, data) => {
      console.log(`Medicines page updated due to: ${eventType}`, JSON.stringify(data));
    }
  });

  // Calculate expiring medicines
  const expiringMedicines = React.useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return allMedicines.filter(medicine => {
      if (!medicine.expiry_date) return false;
      const expiryDate = new Date(medicine.expiry_date);
      return expiryDate > now && expiryDate <= thirtyDaysFromNow && medicine.stock > 0;
    }).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  }, [allMedicines]);



  const medicines = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...allMedicines];
    
    // Enhanced text search filter
    if (q) {
      list = list.filter(m => {
        const searchFields = [
          m.name,
          m.brand,
          m.batch_number,
          m.sku,
          m.category,
          m.supplier,
          m.description
        ].filter(Boolean).map(field => field.toLowerCase());
        
        return searchFields.some(field => field.includes(q));
      });
    }
    
    // Enhanced stock level filter
    if (stockFilter === 'low') {
      list = list.filter(m => m.stock <= (m.reorder_level || m.min_stock || 10) && m.stock > 0);
    } else if (stockFilter === 'out') {
      list = list.filter(m => m.stock === 0);
    }
    
    // Apply enhanced sorting
    list = sortMedicines(list, sortKey, sortDir);
    
    // Apply pagination
    return list.slice(0, perPage);
  }, [allMedicines, query, stockFilter, perPage, sortKey, sortDir]);

  const stockAdjustForm = useForm({
    adjustment_type: 'add', // add, subtract, set
    quantity: 0,
    reason: '',
  });

  const reorderForm = useForm({
    supplier_name: '',
    quantity: 0,
    unit_cost: '',
    notes: '',
  });

  const createForm = useForm({
    name: '',
    brand: '',
    batch_number: '',
    expiry_date: '',
    cost_price: '',
    selling_price: '',
    stock: 0,
    supplier_id: '',
    reorder_level: 10,
    description: '',
  });

  const editForm = useForm({
    name: '',
    brand: '',
    batch_number: '',
    expiry_date: '',
    cost_price: '',
    selling_price: '',
    stock: 0,
    supplier_id: '',
    reorder_level: 10,
    description: '',
  });

  const openDelete = (id, item = null) => {
    setSelectedId(id);
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    
    // Set processing state
    createForm.setProcessing(true);
    
    try {
      // Use the shared hook to add medicine (syncs with Sales and Purchases pages)
      const result = await addMedicine({
        name: createForm.data.name,
        brand: createForm.data.brand,
        batch_number: createForm.data.batch_number,
        expiry_date: createForm.data.expiry_date,
        cost_price: parseFloat(createForm.data.cost_price) || 0,
        selling_price: parseFloat(createForm.data.selling_price) || 0,
        stock: parseInt(createForm.data.stock) || 0,
        supplier_id: createForm.data.supplier_id,
        reorder_level: parseInt(createForm.data.reorder_level) || 10,
        description: createForm.data.description,
        category: createForm.data.category || 'General',
      });

      if (result.success) {
        // Close modal and reset form
        setIsCreateOpen(false);
        createForm.reset();
        
        // Show success message
        console.log('Medicine added successfully');
      } else {
        // Handle error
        console.error('Failed to add medicine:', result.error);
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
    } finally {
      createForm.setProcessing(false);
    }
    
    // Dispatch activity event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('newActivity', {
        detail: {
          id: `medicine-create-${Date.now()}`,
          type: 'medicine',
          title: 'New Medicine Added',
          description: `Added ${createForm.data.name} to inventory`,
          details: `Stock: ${createForm.data.stock} units • Price: UGX ${parseFloat(createForm.data.selling_price).toLocaleString()}`,
          time: new Date().toISOString(),
          priority: 'normal',
          route: '/medicines'
        }
      }));
    }, 100);
    
    setIsCreateOpen(false);
    createForm.reset();
  };

  const confirmDelete = () => {
    if (!selectedId) return;
    
    // Use the shared hook to delete medicine (syncs with Sales and Purchases pages)
    deleteMedicine(selectedId);
    
    // Dispatch activity event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('newActivity', {
        detail: {
          id: `medicine-delete-${Date.now()}`,
          type: 'alert',
          title: 'Medicine Removed',
          description: `Removed ${selectedItem?.name || 'medicine'} from inventory`,
          details: `Stock was: ${selectedItem?.stock || 0} units`,
          time: new Date().toISOString(),
          priority: 'high',
          route: '/medicines'
        }
      }));
    }, 100);
    
    setIsDeleteOpen(false);
    setSelectedItem(null);
  };

  const handleRemoveExpired = () => {
    if (!selectedItem) return;
    
    // Update stock to 0 for expired medicine
    updateStock(selectedItem.id, -selectedItem.stock, 'Expired medicine removed');
    
    // Dispatch activity event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('newActivity', {
        detail: {
          id: `medicine-expired-${Date.now()}`,
          type: 'alert',
          title: 'Expired Medicine Removed',
          description: `Removed ${selectedItem.stock} units of ${selectedItem.name} (Expired: ${new Date(selectedItem.expiry_date).toLocaleDateString()})`,
          details: `Batch: ${selectedItem.batch_number || 'N/A'} • Value: UGX ${(selectedItem.stock * selectedItem.cost_price).toLocaleString()}`,
          time: new Date().toISOString(),
          priority: 'high',
          route: '/medicines'
        }
      }));
    }, 100);
    
    setIsRemoveExpiredOpen(false);
    setSelectedItem(null);
  };

  const handleCreateReorder = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    // Create purchase order via API
    fetch('/api/purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
      },
      body: JSON.stringify({
        medicine_id: selectedItem.id,
        supplier_name: reorderForm.data.supplier_name,
        quantity: reorderForm.data.quantity,
        unit_cost: parseFloat(reorderForm.data.unit_cost),
        notes: reorderForm.data.notes || `Reorder for low stock: ${selectedItem.name}`,
        status: 'pending'
      })
    }).then(res => res.json())
      .then(data => {
        // Dispatch activity event
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('newActivity', {
            detail: {
              id: `purchase-reorder-${Date.now()}`,
              type: 'purchase',
              title: 'Reorder Created',
              description: `Created purchase order for ${reorderForm.data.quantity} units of ${selectedItem.name}`,
              details: `Supplier: ${reorderForm.data.supplier_name} • Unit Cost: UGX ${parseFloat(reorderForm.data.unit_cost).toLocaleString()}`,
              time: new Date().toISOString(),
              priority: 'normal',
              route: '/purchases'
            }
          }));
        }, 100);
      })
      .catch(err => console.error('Failed to create reorder:', err));
    
    setIsReorderOpen(false);
    reorderForm.reset();
    setSelectedItem(null);
  };

  const openView = item => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };
  const openEdit = item => {
    setSelectedItem(item);
    setIsEditOpen(true);
    editForm.setData({
      name: item.name || '',
      brand: item.brand || '',
      batch_number: item.batch_number || '',
      expiry_date: item.expiry_date || '',
      cost_price: item.cost_price || '',
      selling_price: item.selling_price || '',
      stock: item.stock || 0,
      supplier_id: item.supplier_id || '',
      reorder_level: item.reorder_level || 10,
      description: item.description || '',
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    // Set processing state
    editForm.setProcessing(true);
    
    try {
      // Use the shared hook to update medicine (syncs with Sales and Purchases pages)
      const result = await updateMedicine(selectedItem.id, {
        name: editForm.data.name,
        brand: editForm.data.brand,
        batch_number: editForm.data.batch_number,
        expiry_date: editForm.data.expiry_date,
        cost_price: parseFloat(editForm.data.cost_price) || 0,
        selling_price: parseFloat(editForm.data.selling_price) || 0,
        stock: parseInt(editForm.data.stock) || 0,
        supplier_id: editForm.data.supplier_id,
        reorder_level: parseInt(editForm.data.reorder_level) || 10,
        description: editForm.data.description,
      });

      if (result.success) {
        // Close modal and reset form
        setIsEditOpen(false);
        editForm.reset();
        setSelectedItem(null);
        
        // Show success message (you can add toast notification here)
        console.log('Medicine updated successfully');
      } else {
        // Handle error
        console.error('Failed to update medicine:', result.error);
        // You can set form errors here if needed
      }
    } catch (error) {
      console.error('Error updating medicine:', error);
    } finally {
      editForm.setProcessing(false);
    }
    
    // Dispatch activity event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('newActivity', {
        detail: {
          id: `medicine-update-${Date.now()}`,
          type: 'medicine',
          title: 'Medicine Updated',
          description: `Updated ${editForm.data.name} information`,
          details: `Stock: ${editForm.data.stock} units • Price: UGX ${parseFloat(editForm.data.selling_price).toLocaleString()}`,
          time: new Date().toISOString(),
          priority: 'normal',
          route: '/medicines'
        }
      }));
    }, 100);
    
    setIsEditOpen(false);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Brand', 'SKU', 'Stock', 'Selling Price'];
    const rows = allMedicines.map(m => [
      m.name,
      m.brand ?? '-',
      m.sku ?? '-',
      m.stock,
      m.selling_price,
    ]);
    const csv = [headers, ...rows]
      .map(r =>
        r
          .map(String)
          .map(v => '"' + v.replaceAll('"', '""') + '"')
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicines.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearSelection = () => {
    setSelectedId(null);
    setSelectedItem(null);
  };

  const toggleSort = key => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Enhanced sorting function for better date and numeric handling
  const sortMedicines = (list, key, direction) => {
    return [...list].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];
      
      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return direction === 'asc' ? 1 : -1;
      if (bVal == null) return direction === 'asc' ? -1 : 1;
      
      // Handle dates
      if (key === 'expiry_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Handle numbers
      if (key === 'stock' || key === 'selling_price' || key === 'cost_price') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      // Handle strings
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      
      if (direction === 'asc') {
        return aVal.localeCompare(bVal, undefined, { numeric: true });
      } else {
        return bVal.localeCompare(aVal, undefined, { numeric: true });
      }
    });
  };

  const [isLoading, setIsLoading] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const [selectedMedicines, setSelectedMedicines] = React.useState([]);
  const [showBulkActions, setShowBulkActions] = React.useState(false);

  React.useEffect(() => {
    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Medicines</h2>}
    >
      <Head>
        <title>Medicines</title>
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
            ? 'bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900' 
            : 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50'
        }`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Floating Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${darkMode ? 'bg-green-500/10' : 'bg-green-200/30'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute top-3/4 right-1/4 w-96 h-96 ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-200/30'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
          <div className={`absolute top-1/2 left-1/2 w-80 h-80 ${darkMode ? 'bg-teal-500/10' : 'bg-teal-200/30'} rounded-full blur-3xl animate-pulse delay-500`}></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6">
        {/* Expiry Alerts Section */}
        {expiringMedicines.length > 0 && (
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-red-500/10' : 'bg-red-50/80'} rounded-2xl p-6 mb-6 border-2 ${darkMode ? 'border-red-400/30' : 'border-red-200'} shadow-xl`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-red-500/20' : 'bg-red-100'} flex items-center justify-center`}>
                  <i className={`bi bi-exclamation-triangle text-2xl ${darkMode ? 'text-red-300' : 'text-red-600'}`}></i>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                    ⚠️ Expiry Alerts ({expiringMedicines.length})
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-600'}`}>
                    Medicines expiring within 30 days - Take action to prevent losses
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'} text-sm font-bold`}>
                {expiringMedicines.length} items
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiringMedicines.slice(0, 6).map((medicine) => {
                const daysToExpiry = Math.ceil((new Date(medicine.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                const urgency = daysToExpiry <= 7 ? 'critical' : daysToExpiry <= 14 ? 'high' : 'medium';
                
                return (
                  <div
                    key={medicine.id}
                    className={`p-4 rounded-xl border-2 ${
                      urgency === 'critical' 
                        ? darkMode ? 'bg-red-500/20 border-red-400/50' : 'bg-red-100 border-red-300'
                        : urgency === 'high'
                        ? darkMode ? 'bg-orange-500/20 border-orange-400/50' : 'bg-orange-100 border-orange-300'
                        : darkMode ? 'bg-yellow-500/20 border-yellow-400/50' : 'bg-yellow-100 border-yellow-300'
                    } hover:shadow-lg transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {medicine.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        urgency === 'critical' 
                          ? darkMode ? 'bg-red-600 text-white' : 'bg-red-200 text-red-800'
                          : urgency === 'high'
                          ? darkMode ? 'bg-orange-600 text-white' : 'bg-orange-200 text-orange-800'
                          : darkMode ? 'bg-yellow-600 text-black' : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {daysToExpiry}d
                      </span>
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
                      <div>Expires: {new Date(medicine.expiry_date).toLocaleDateString()}</div>
                      <div>Stock: {medicine.stock} units</div>
                      <div>Batch: {medicine.batch_number || 'N/A'}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(medicine);
                          setIsViewOpen(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          darkMode 
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        } transition-colors duration-200`}
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(medicine);
                          setIsRemoveExpiredOpen(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          darkMode 
                            ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        } transition-colors duration-200`}
                      >
                        <i className="bi bi-trash mr-1"></i>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {expiringMedicines.length > 6 && (
              <div className="mt-4 text-center">
                <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-600'}`}>
                  And {expiringMedicines.length - 6} more medicines expiring soon...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Low Stock Alerts Section */}
        {allMedicines.filter(m => m.stock > 0 && m.stock <= (m.reorder_level || 10)).length > 0 && (
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-orange-500/10' : 'bg-orange-50/80'} rounded-2xl p-6 mb-6 border-2 ${darkMode ? 'border-orange-400/30' : 'border-orange-200'} shadow-xl`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'} flex items-center justify-center`}>
                  <i className={`bi bi-exclamation-circle text-2xl ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}></i>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>
                    📦 Low Stock Alerts ({allMedicines.filter(m => m.stock > 0 && m.stock <= (m.reorder_level || 10)).length})
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-orange-200' : 'text-orange-600'}`}>
                    Medicines below reorder level - Create purchase orders to restock
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'} text-sm font-bold`}>
                {allMedicines.filter(m => m.stock > 0 && m.stock <= (m.reorder_level || 10)).length} items
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMedicines.filter(m => m.stock > 0 && m.stock <= (m.reorder_level || 10)).slice(0, 6).map((medicine) => {
                const stockPercentage = ((medicine.stock / (medicine.reorder_level || 10)) * 100).toFixed(0);
                
                return (
                  <div
                    key={medicine.id}
                    className={`p-4 rounded-xl border-2 ${
                      darkMode ? 'bg-orange-500/20 border-orange-400/50' : 'bg-orange-100 border-orange-300'
                    } hover:shadow-lg transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {medicine.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        darkMode ? 'bg-orange-600 text-white' : 'bg-orange-200 text-orange-800'
                      }`}>
                        {stockPercentage}%
                      </span>
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} space-y-1`}>
                      <div>Current Stock: {medicine.stock} units</div>
                      <div>Reorder Level: {medicine.reorder_level || 10} units</div>
                      <div>Brand: {medicine.brand || 'N/A'}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(medicine);
                          reorderForm.setData({
                            supplier_name: '',
                            quantity: (medicine.reorder_level || 10) * 2,
                            unit_cost: medicine.cost_price || '',
                            notes: `Reorder for low stock: ${medicine.name}`
                          });
                          setIsReorderOpen(true);
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${
                          darkMode 
                            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                        } transition-colors duration-200`}
                      >
                        <i className="bi bi-cart-plus mr-1"></i>
                        Reorder
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(medicine);
                          setIsViewOpen(true);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-medium ${
                          darkMode 
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        } transition-colors duration-200`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {allMedicines.filter(m => m.stock > 0 && m.stock <= (m.reorder_level || 10)).length > 6 && (
              <div className="mt-4 text-center">
                <p className={`text-sm ${darkMode ? 'text-orange-200' : 'text-orange-600'}`}>
                  And {allMedicines.filter(m => m.stock > 0 && m.stock <= (m.reorder_level || 10)).length - 6} more medicines need restocking...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modern Header */}
        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 mb-8 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-green-400 to-emerald-500'} flex items-center justify-center shadow-lg`}>
                <i className="bi bi-capsule-pill text-2xl text-white"></i>
              </div>
              <div>
                <h1 className={`text-4xl font-black ${darkMode ? 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'}`}>
                  Medicine Inventory
                </h1>
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                  Manage your medicine stock, track inventory levels, and monitor expiry dates
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                    <i className="bi bi-check-circle-fill"></i>
                    <span className="text-sm font-medium">Inventory Active</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <span className="text-sm">
                      Showing {Math.min(medicines.length, perPage)} of {allMedicines.length} items
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search name, brand or SKU..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className={`w-64 pr-10 pl-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-600/50 text-gray-200 placeholder-gray-400' : 'bg-white/50 border-gray-200/50 text-gray-800'} shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200`}
                />
                <i className={`bi bi-search absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}></i>
              </div>

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
              
              {/* Export Button */}
              <button
                onClick={exportCSV}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  darkMode 
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <i className="bi bi-download mr-2"></i>Export CSV
              </button>
              {/* Scan Button */}
              <button
                onClick={() => setScannerOpen(true)}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  darkMode 
                    ? 'bg-accent-500/20 text-accent-300 hover:bg-accent-500/30' 
                    : 'bg-accent-100 text-accent-700 hover:bg-accent-200'
                }`}
                title="Scan barcode or QR"
              >
                <i className="bi bi-upc-scan mr-2"></i>Scan
              </button>
              
              {/* Add Medicine Button */}
              <button
                onClick={() => {
                  clearSelection();
                  setIsCreateOpen(true);
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  darkMode 
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <i className="bi bi-plus-lg mr-2"></i>Add Medicine
              </button>
            </div>
          </div>
        </div>

        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl overflow-hidden`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Displaying{' '}
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {Math.min(medicines.length, perPage)}
              </span>{' '}
              of{' '}
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {allMedicines.length}
              </span>{' '}
              total medicines
              {query || stockFilter !== 'all' ? (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  Filtered
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Stock Filter:</label>
                <select
                  value={stockFilter}
                  onChange={e => setStockFilter(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Items</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Items per page:
                </label>
                <select
                  value={perPage}
                  onChange={e => setPerPage(Number(e.target.value))}
                  className={`text-sm border-2 rounded-lg px-3 py-1 font-medium ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={allMedicines.length}>All ({allMedicines.length})</option>
                </select>
              </div>
            </div>
          </div>

          {allMedicines.length === 0 ? (
            <div className="text-center py-16">
              <div className={`mx-auto w-32 h-32 rounded-full ${darkMode ? 'bg-gray-800/50' : 'bg-green-50'} flex items-center justify-center mb-6`}>
                <i className={`bi bi-capsule-pill text-4xl ${darkMode ? 'text-gray-400' : 'text-green-500'}`}></i>
              </div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                No medicines in inventory
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6 max-w-md mx-auto`}>
                Start building your medicine inventory by adding your first medicine. You can add details like stock levels, pricing, and expiry dates.
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  darkMode 
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20' 
                    : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                } hover:scale-105`}
              >
                <i className="bi bi-plus-lg"></i>
                Add Your First Medicine
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Enhanced Table Header with Bulk Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {medicines.length} of {allMedicines.length} medicines
                  </div>
                  {query && (
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <i className="bi bi-search"></i>
                      Filtered by: "{query}"
                    </div>
                  )}
                </div>
                
                {/* Table View Options */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSort('name')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      sortKey === 'name' 
                        ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                        : darkMode ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <i className={`bi ${sortKey === 'name' && sortDir === 'asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up'} mr-1`}></i>
                    Name {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => toggleSort('stock')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      sortKey === 'stock' 
                        ? darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                        : darkMode ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <i className={`bi ${sortKey === 'stock' && sortDir === 'asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up'} mr-1`}></i>
                    Stock {sortKey === 'stock' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              </div>

              {/* Enhanced Responsive Table */}
              <div className={`rounded-2xl border-2 overflow-hidden ${
                darkMode ? 'border-gray-700/50 bg-gray-800/30' : 'border-gray-200/50 bg-white/50'
              } backdrop-blur-xl shadow-xl`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-50/80'} backdrop-blur-sm sticky top-0 z-10`}>
                      <tr>
                        <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                          <button
                            onClick={() => toggleSort('name')}
                            className="flex items-center gap-2 hover:text-green-500 transition-colors group"
                          >
                            <i className="bi bi-capsule text-green-500"></i>
                            Medicine Details
                            <i className={`bi ${
                              sortKey === 'name' 
                                ? sortDir === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down'
                                : 'bi-chevron-expand'
                            } text-xs opacity-50 group-hover:opacity-100 transition-opacity`}></i>
                          </button>
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                          <button
                            onClick={() => toggleSort('stock')}
                            className="flex items-center gap-2 hover:text-green-500 transition-colors group"
                          >
                            <i className="bi bi-boxes text-green-500"></i>
                            Stock Status
                            <i className={`bi ${
                              sortKey === 'stock' 
                                ? sortDir === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down'
                                : 'bi-chevron-expand'
                            } text-xs opacity-50 group-hover:opacity-100 transition-opacity`}></i>
                          </button>
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                          <div className="flex items-center gap-2">
                            <i className="bi bi-currency-exchange text-green-500"></i>
                            Pricing Info
                          </div>
                        </th>
                        <th className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                          <button
                            onClick={() => toggleSort('expiry_date')}
                            className="flex items-center gap-2 hover:text-green-500 transition-colors group"
                          >
                            <i className="bi bi-calendar-event text-green-500"></i>
                            Expiry Status
                            <i className={`bi ${
                              sortKey === 'expiry_date' 
                                ? sortDir === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down'
                                : 'bi-chevron-expand'
                            } text-xs opacity-50 group-hover:opacity-100 transition-opacity`}></i>
                          </button>
                        </th>
                        <th className={`px-6 py-4 text-right text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase tracking-wider`}>
                          <div className="flex items-center justify-end gap-2">
                            <i className="bi bi-gear text-green-500"></i>
                            Actions
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800/20' : 'bg-white/20'} backdrop-blur-sm divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-200/50'}`}>
                      {medicines.map((m, index) => {
                        const isExpired = m.expiry_date && new Date(m.expiry_date) < new Date();
                        const isExpiringSoon = m.expiry_date && new Date(m.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && !isExpired;
                        const isLowStock = m.stock <= (m.reorder_level || 10);
                        const isOutOfStock = m.stock === 0;
                        
                        return (
                          <tr 
                            key={m.id} 
                            className={`transition-all duration-200 hover:scale-[1.01] ${
                              darkMode 
                                ? 'hover:bg-gray-700/30 hover:shadow-lg hover:shadow-green-500/10' 
                                : 'hover:bg-green-50/50 hover:shadow-lg hover:shadow-green-500/10'
                            } ${index % 2 === 0 ? (darkMode ? 'bg-gray-800/10' : 'bg-gray-50/30') : ''}`}
                          >
                            {/* Medicine Details Column */}
                            <td className="px-6 py-4">
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center flex-shrink-0`}>
                                  <i className={`bi bi-capsule-pill text-lg ${darkMode ? 'text-green-400' : 'text-green-600'}`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                                    {m.name}
                                  </div>
                                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 space-y-1`}>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Brand:</span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                        {m.brand || 'Generic'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">SKU:</span>
                                      <code className={`px-2 py-0.5 rounded text-xs font-mono ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                        {m.sku || m.batch_number || `MED-${m.id}`}
                                      </code>
                                    </div>
                                    {m.created_at && (
                                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                        Added: {new Date(m.created_at).toLocaleDateString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Stock Status Column */}
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className={`text-2xl font-black ${
                                    isOutOfStock ? 'text-red-500' : 
                                    isLowStock ? 'text-orange-500' : 
                                    darkMode ? 'text-green-400' : 'text-green-600'
                                  }`}>
                                    {m.stock}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      units in stock
                                    </span>
                                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                      Reorder at: {m.reorder_level || 10}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Stock Status Badge */}
                                <div className="flex items-center gap-2">
                                  {isOutOfStock ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                      <i className="bi bi-exclamation-triangle-fill"></i>
                                      Out of Stock
                                    </span>
                                  ) : isLowStock ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                                      <i className="bi bi-exclamation-circle-fill"></i>
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                      <i className="bi bi-check-circle-fill"></i>
                                      In Stock
                                    </span>
                                  )}
                                </div>

                                {/* Stock Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      isOutOfStock ? 'bg-red-500' : 
                                      isLowStock ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                    style={{ 
                                      width: `${Math.min(100, Math.max(5, (m.stock / ((m.reorder_level || 10) * 2)) * 100))}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>

                            {/* Pricing Info Column */}
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {/* Selling Price */}
                                <div className="flex items-center gap-2">
                                  <i className={`bi bi-tag-fill text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}></i>
                                  <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    UGX {Number(m.selling_price || 0).toLocaleString()}
                                  </span>
                                </div>
                                
                                {/* Cost Price (if user has permission) */}
                                {props.canViewCosts && m.cost_price && (
                                  <div className="flex items-center gap-2">
                                    <i className={`bi bi-receipt text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      Cost: UGX {Number(m.cost_price).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Profit Margin */}
                                {props.canViewCosts && m.cost_price && m.selling_price && m.cost_price > 0 && (
                                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-bold">
                                    <i className="bi bi-graph-up-arrow"></i>
                                    {(((m.selling_price - m.cost_price) / m.cost_price) * 100).toFixed(1)}% margin
                                  </div>
                                )}

                                {/* Total Value */}
                                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  Total value: UGX {Number((m.selling_price || 0) * m.stock).toLocaleString()}
                                </div>
                              </div>
                            </td>

                            {/* Expiry Status Column */}
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {m.expiry_date ? (
                                  <>
                                    <div className={`text-sm font-medium ${
                                      isExpired ? 'text-red-600' : 
                                      isExpiringSoon ? 'text-orange-600' : 
                                      darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                      {new Date(m.expiry_date).toLocaleDateString()}
                                    </div>
                                    
                                    {/* Expiry Status Badge */}
                                    {isExpired ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                        <i className="bi bi-x-circle-fill"></i>
                                        Expired
                                      </span>
                                    ) : isExpiringSoon ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                                        <i className="bi bi-clock-fill"></i>
                                        Expires Soon
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                        <i className="bi bi-shield-check-fill"></i>
                                        Valid
                                      </span>
                                    )}

                                    {/* Days until expiry */}
                                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                      {(() => {
                                        const days = Math.ceil((new Date(m.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                                        if (days < 0) return `Expired ${Math.abs(days)} days ago`;
                                        if (days === 0) return 'Expires today';
                                        if (days === 1) return 'Expires tomorrow';
                                        return `${days} days remaining`;
                                      })()}
                                    </div>
                                  </>
                                ) : (
                                  <div className="space-y-1">
                                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      No expiry date
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                      <i className="bi bi-calendar-x"></i>
                                      Not set
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Actions Column */}
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {/* Quick View Button */}
                                <button
                                  onClick={() => openView(m)}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    darkMode 
                                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:scale-110' 
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-110'
                                  }`}
                                  title="View Details"
                                >
                                  <i className="bi bi-eye text-sm"></i>
                                </button>

                                {props.canManage && (
                                  <>
                                    {/* Stock Adjustment Button */}
                                    <button
                                      onClick={() => {
                                        setSelectedItem(m);
                                        setIsStockAdjustOpen(true);
                                        stockAdjustForm.reset();
                                      }}
                                      className={`p-2 rounded-lg transition-all duration-200 ${
                                        darkMode 
                                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:scale-110' 
                                          : 'bg-green-100 text-green-700 hover:bg-green-200 hover:scale-110'
                                      }`}
                                      title="Adjust Stock"
                                    >
                                      <i className="bi bi-plus-minus text-sm"></i>
                                    </button>

                                    {/* Edit Button */}
                                    <button
                                      onClick={() => openEdit(m)}
                                      className={`p-2 rounded-lg transition-all duration-200 ${
                                        darkMode 
                                          ? 'bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 hover:scale-110' 
                                          : 'bg-accent-100 text-accent-700 hover:bg-accent-200 hover:scale-110'
                                      }`}
                                      title="Edit Medicine"
                                    >
                                      <i className="bi bi-pencil text-sm"></i>
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => openDelete(m.id, m)}
                                      className={`p-2 rounded-lg transition-all duration-200 ${
                                        darkMode 
                                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:scale-110' 
                                          : 'bg-red-100 text-red-700 hover:bg-red-200 hover:scale-110'
                                      }`}
                                      title="Delete Medicine"
                                    >
                                      <i className="bi bi-trash text-sm"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Enhanced Pagination */}
              {pagination && (
                <div className={`flex items-center justify-between px-6 py-4 rounded-xl ${
                  darkMode ? 'bg-gray-800/30' : 'bg-white/30'
                } backdrop-blur-xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Showing {pagination.from || 1} to {pagination.to || medicines.length} of {pagination.total || allMedicines.length} medicines
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {pagination.prev_page_url && (
                      <button
                        onClick={() => router.get(pagination.prev_page_url)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          darkMode 
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <i className="bi bi-chevron-left mr-1"></i>
                        Previous
                      </button>
                    )}
                    
                    <span className={`px-3 py-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Page {pagination.current_page || 1} of {pagination.last_page || 1}
                    </span>
                    
                    {pagination.next_page_url && (
                      <button
                        onClick={() => router.get(pagination.next_page_url)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          darkMode 
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Next
                        <i className="bi bi-chevron-right ml-1"></i>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Create Modal */}
        <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="4xl">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900' : 'bg-gradient-to-br from-green-50 via-emerald-50 to-white'} p-8`}>
            {/* Header with Gradient */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                  <i className="bi bi-capsule-pill text-3xl text-white"></i>
                </div>
                <div className="flex-1">
                  <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'}`}>
                    Add New Medicine
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Add medicine to your inventory with complete details
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

            <form onSubmit={submitCreate} className="space-y-6">
              {/* Medicine Name */}
              <div className="group">
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <i className="bi bi-capsule text-green-500"></i>
                  Medicine Name
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g., Paracetamol 500mg"
                    value={createForm.data.name}
                    onChange={e => createForm.setData('name', e.target.value)}
                    className={`w-full px-4 py-3 pl-12 rounded-xl border-2 transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:bg-gray-800' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:bg-green-50/30'
                    } focus:ring-4 focus:ring-green-500/20 focus:outline-none`}
                  />
                  <i className={`bi bi-capsule absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}></i>
                </div>
                {createForm.errors.name && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <i className="bi bi-exclamation-circle"></i>
                    {createForm.errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Brand */}
                <div className="group">
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                    <i className="bi bi-tag text-green-500"></i>
                    Brand
                  </label>
                  <input
                    id="brand"
                    type="text"
                    placeholder="e.g., GSK"
                    value={createForm.data.brand}
                    onChange={e => createForm.setData('brand', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                    } focus:ring-4 focus:ring-green-500/20 focus:outline-none`}
                  />
                  {createForm.errors.brand && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <i className="bi bi-exclamation-circle"></i>
                      {createForm.errors.brand}
                    </p>
                  )}
                </div>

                {/* Batch Number */}
                <div className="group">
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                    <i className="bi bi-upc-scan text-green-500"></i>
                    Batch Number
                  </label>
                  <input
                    id="batch_number"
                    type="text"
                    placeholder="e.g., BAT001"
                    value={createForm.data.batch_number}
                    onChange={e => createForm.setData('batch_number', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                    } focus:ring-4 focus:ring-green-500/20 focus:outline-none`}
                  />
                  {createForm.errors.batch_number && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <i className="bi bi-exclamation-circle"></i>
                      {createForm.errors.batch_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Expiry Date */}
                <div className="group">
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                    <i className="bi bi-calendar-event text-green-500"></i>
                    Expiry Date
                  </label>
                  <input
                    id="expiry_date"
                    type="date"
                    value={createForm.data.expiry_date}
                    onChange={e => createForm.setData('expiry_date', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white focus:border-green-500' 
                        : 'bg-white border-gray-200 text-gray-900 focus:border-green-500'
                    } focus:ring-4 focus:ring-green-500/20 focus:outline-none`}
                  />
                </div>

                {/* Category */}
                <div className="group">
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                    <i className="bi bi-grid text-green-500"></i>
                    Category
                  </label>
                  <input
                    id="category"
                    type="text"
                    placeholder="e.g., Pain Relief"
                    value={createForm.data.category}
                    onChange={e => createForm.setData('category', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                    } focus:ring-4 focus:ring-green-500/20 focus:outline-none`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Stock */}
                <div className="group">
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                    <i className="bi bi-box text-green-500"></i>
                    Initial Stock
                  </label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={createForm.data.stock}
                    onChange={e => createForm.setData('stock', Number(e.target.value))}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                    } focus:ring-4 focus:ring-green-500/20 focus:outline-none`}
                  />
                </div>

                {/* Cost Price */}
                <div className="group">
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                    <i className="bi bi-cash text-green-500"></i>
                    Cost Price
                  </label>
                  <input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={createForm.data.cost_price}
                    onChange={e => createForm.setData('cost_price', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                    } focus:ring-4 focus:ring-green-500/20 focus:outline-none`}
                  />
                </div>

                {/* Selling Price */}
                <div className="group">
                  <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                    <i className="bi bi-cash-coin text-green-500"></i>
                    Selling Price
                  </label>
                  <input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={createForm.data.selling_price}
                    onChange={e => createForm.setData('selling_price', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      darkMode 
                        ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-green-500' 
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                    } focus:ring-4 focus:ring-green-500/20 focus:outline-none`}
                  />
                </div>
              </div>

              {/* Profit Margin Display */}
              {createForm.data.cost_price && createForm.data.selling_price && (
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-green-500/10 border-2 border-green-500/20' : 'bg-green-50 border-2 border-green-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-900'}`}>
                      Profit Margin
                    </span>
                    <span className={`text-2xl font-black ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {(((createForm.data.selling_price - createForm.data.cost_price) / createForm.data.cost_price) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {createForm.processing ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle mr-2"></i>
                      Add Medicine
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Enhanced Delete Confirm Modal */}
        <Modal show={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} maxWidth="xl">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-red-900 to-rose-900' : 'bg-gradient-to-br from-red-50 via-rose-50 to-white'} p-8`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl">
                <i className="bi bi-exclamation-triangle text-3xl text-white"></i>
              </div>
              <div>
                <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete Medicine</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This action cannot be undone</p>
              </div>
            </div>

            {selectedItem && (
              <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} mb-6`}>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Are you sure you want to permanently delete this medicine?
                </p>
                <div className={`mt-4 p-4 rounded-xl ${darkMode ? 'bg-red-500/10 border-2 border-red-500/20' : 'bg-red-50 border-2 border-red-200'}`}>
                  <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.name}</p>
                  {selectedItem.brand && (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Brand: {selectedItem.brand}</p>
                  )}
                  {selectedItem.batch_number && (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Batch: {selectedItem.batch_number}</p>
                  )}
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stock: {selectedItem.stock} units</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-2 border-gray-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
                <i className="bi bi-trash mr-2"></i>
                Delete Medicine
              </button>
            </div>
          </div>
        </Modal>

        {/* Enhanced View Modal */}
        <Modal
          show={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            clearSelection();
          }}
          maxWidth="3xl"
        >
          <div className={`${darkMode ? 'bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900' : 'bg-gradient-to-br from-accent-50 via-primary-50 to-white'} p-8`}>
            {/* Header */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 to-primary-500/10 rounded-2xl blur-xl"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center shadow-xl">
                  <i className="bi bi-eye text-3xl text-white"></i>
                </div>
                <div className="flex-1">
                  <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-accent-400 to-primary-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent'}`}>
                    Medicine Details
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Complete information about this medicine
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsViewOpen(false);
                    clearSelection();
                  }}
                  className={`p-3 rounded-xl transition-all duration-200 ${darkMode ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>
            </div>

            {selectedItem ? (
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Name</div>
                    <div className="font-medium text-gray-800">{selectedItem.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Brand</div>
                    <div className="font-medium text-gray-800">{selectedItem.brand || '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Batch Number</div>
                    <div className="font-medium text-gray-800">{selectedItem.batch_number || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Expiry Date</div>
                    <div className={`font-medium ${
                      selectedItem.expiry_date && new Date(selectedItem.expiry_date) < new Date() 
                        ? 'text-red-600' 
                        : selectedItem.expiry_date && new Date(selectedItem.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? 'text-orange-600'
                        : 'text-gray-800'
                    }`}>
                      {selectedItem.expiry_date ? new Date(selectedItem.expiry_date).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Stock Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Current Stock</div>
                      <div className={`font-medium text-lg ${
                        selectedItem.stock <= (selectedItem.reorder_level || 10) 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {selectedItem.stock}
                        {selectedItem.stock <= (selectedItem.reorder_level || 10) && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Low Stock</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Reorder Level</div>
                      <div className="font-medium text-gray-800">{selectedItem.reorder_level || 10}</div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Pricing Information */}
                <div className="border-t pt-4">
                  <div className="bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-6 border-2 border-accent-200">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="bi bi-currency-exchange text-2xl text-accent-600"></i>
                      <h4 className="text-lg font-black text-gray-900">Pricing Information</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Cost Price */}
                      {props.canViewCosts && selectedItem.cost_price && (
                        <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <i className="bi bi-tag text-gray-500"></i>
                            <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">Cost Price</div>
                          </div>
                          <div className="text-2xl font-black text-gray-900">
                            UGX {Number(selectedItem.cost_price).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Purchase price</div>
                        </div>
                      )}
                      
                      {/* Selling Price */}
                      <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <i className="bi bi-cash-coin text-green-600"></i>
                          <div className="text-xs text-green-600 uppercase tracking-wide font-bold">Selling Price</div>
                        </div>
                        <div className="text-2xl font-black text-green-600">
                          UGX {Number(selectedItem.selling_price || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Retail price</div>
                      </div>
                    </div>
                    
                    {/* Profit Analysis */}
                    {props.canViewCosts && selectedItem.cost_price && selectedItem.selling_price && selectedItem.cost_price > 0 && (
                      <div className="mt-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border-2 border-green-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-green-700 uppercase tracking-wide font-bold mb-1">
                              💰 Profit Analysis
                            </div>
                            <div className="text-sm text-gray-700">
                              <span className="font-bold">UGX {(Number(selectedItem.selling_price) - Number(selectedItem.cost_price)).toLocaleString()}</span> profit per unit
                            </div>
                            {selectedItem.stock > 0 && (
                              <div className="text-xs text-gray-600 mt-1">
                                Total potential profit: <span className="font-bold">UGX {((Number(selectedItem.selling_price) - Number(selectedItem.cost_price)) * selectedItem.stock).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-4xl font-black text-green-600">
                              {(((selectedItem.selling_price - selectedItem.cost_price) / selectedItem.cost_price) * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-green-600 font-bold">
                              {Number(selectedItem.selling_price) > Number(selectedItem.cost_price) * 1.2 ? '📈 Excellent' : '📊 Good'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                {(selectedItem.description || selectedItem.supplier) && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Information</h4>
                    {selectedItem.supplier && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Supplier</div>
                        <div className="font-medium text-gray-800">{selectedItem.supplier.name}</div>
                      </div>
                    )}
                    {selectedItem.description && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Description</div>
                        <div className="text-sm text-gray-700">{selectedItem.description}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamps */}
                <div className="border-t pt-4 text-xs text-gray-400">
                  {selectedItem.created_at && (
                    <div>Created: {new Date(selectedItem.created_at).toLocaleString()}</div>
                  )}
                  {selectedItem.updated_at && (
                    <div>Last Updated: {new Date(selectedItem.updated_at).toLocaleString()}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No item selected.</div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsViewOpen(false);
                  clearSelection();
                }}
                className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-accent-500 to-primary-600 text-white hover:shadow-xl hover:scale-105' 
                    : 'bg-gradient-to-r from-accent-500 to-primary-600 text-white hover:shadow-xl hover:scale-105'
                }`}
              >
                <i className="bi bi-check-circle mr-2"></i>
                Close
              </button>
            </div>
          </div>
        </Modal>

        {/* Enhanced Edit Modal */}
        <Modal show={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidth="4xl">
          <div className={`${darkMode ? 'bg-gradient-to-br from-primary-900 via-primary-800 to-accent-900' : 'bg-gradient-to-br from-accent-50 via-primary-50 to-white'} p-8`}>
            {/* Header */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 to-primary-500/10 rounded-2xl blur-xl"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center shadow-xl">
                  <i className="bi bi-pencil-square text-3xl text-white"></i>
                </div>
                <div className="flex-1">
                  <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-accent-400 to-primary-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent'}`}>
                    Edit Medicine
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Update medicine information and save changes
                  </p>
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

            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <InputLabel htmlFor="edit_name" value="Name" />
                <TextInput
                  id="edit_name"
                  className="mt-1 block w-full"
                  value={editForm.data.name}
                  onChange={e => editForm.setData('name', e.target.value)}
                />
                <InputError className="mt-2" message={editForm.errors.name} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel htmlFor="edit_brand" value="Brand" />
                  <TextInput
                    id="edit_brand"
                    className="mt-1 block w-full"
                    value={editForm.data.brand}
                    onChange={e => editForm.setData('brand', e.target.value)}
                  />
                  <InputError className="mt-2" message={editForm.errors.brand} />
                </div>
                <div>
                  <InputLabel htmlFor="edit_batch_number" value="Batch Number" />
                  <TextInput
                    id="edit_batch_number"
                    className="mt-1 block w-full"
                    value={editForm.data.batch_number}
                    onChange={e => editForm.setData('batch_number', e.target.value)}
                  />
                  <InputError className="mt-2" message={editForm.errors.batch_number} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel htmlFor="edit_expiry_date" value="Expiry Date" />
                  <TextInput
                    id="edit_expiry_date"
                    type="date"
                    className="mt-1 block w-full"
                    value={editForm.data.expiry_date}
                    onChange={e => editForm.setData('expiry_date', e.target.value)}
                  />
                  <InputError className="mt-2" message={editForm.errors.expiry_date} />
                </div>
                <div>
                  <InputLabel htmlFor="edit_supplier_id" value="Supplier (Optional)" />
                  <select
                    id="edit_supplier_id"
                    className="mt-1 block w-full border-gray-300 focus:border-accent-500 focus:ring-accent-500 rounded-md shadow-sm"
                    value={editForm.data.supplier_id}
                    onChange={e => editForm.setData('supplier_id', e.target.value)}
                  >
                    <option value="">Select Supplier</option>
                    {(props.suppliers || []).map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <InputError className="mt-2" message={editForm.errors.supplier_id} />
                </div>
              </div>

              <div>
                <InputLabel htmlFor="edit_description" value="Description (optional)" />
                <textarea
                  id="edit_description"
                  rows="3"
                  className="mt-1 block w-full border rounded p-2 text-sm"
                  value={editForm.data.description}
                  onChange={e => editForm.setData('description', e.target.value)}
                />
                <InputError className="mt-2" message={editForm.errors.description} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <InputLabel htmlFor="edit_stock" value="Current Stock" />
                  <TextInput
                    id="edit_stock"
                    type="number"
                    min="0"
                    className="mt-1 block w-full"
                    value={editForm.data.stock}
                    onChange={e => editForm.setData('stock', Number(e.target.value))}
                  />
                  <InputError className="mt-2" message={editForm.errors.stock} />
                </div>
                <div>
                  <InputLabel htmlFor="edit_reorder_level" value="Reorder Level" />
                  <TextInput
                    id="edit_reorder_level"
                    type="number"
                    min="0"
                    className="mt-1 block w-full"
                    value={editForm.data.reorder_level}
                    onChange={e => editForm.setData('reorder_level', Number(e.target.value))}
                  />
                  <InputError className="mt-2" message={editForm.errors.reorder_level} />
                </div>
                <div>
                  <InputLabel htmlFor="edit_cost_price" value="Cost Price" />
                  <TextInput
                    id="edit_cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full"
                    value={editForm.data.cost_price}
                    onChange={e => editForm.setData('cost_price', e.target.value)}
                  />
                  <InputError className="mt-2" message={editForm.errors.cost_price} />
                </div>
              </div>

              <div>
                <InputLabel htmlFor="edit_selling_price" value="Selling Price" />
                <TextInput
                  id="edit_selling_price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full"
                  value={editForm.data.selling_price}
                  onChange={e => editForm.setData('selling_price', e.target.value)}
                />
                <InputError className="mt-2" message={editForm.errors.selling_price} />
                {editForm.data.cost_price && editForm.data.selling_price && (
                  <p className="text-xs text-gray-600 mt-1">
                    Profit Margin: {(((editForm.data.selling_price - editForm.data.cost_price) / editForm.data.cost_price) * 100).toFixed(1)}%
                  </p>
                )}
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {editForm.processing ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle mr-2"></i>
                      Update Medicine
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Enhanced Stock Adjustment Modal */}
        <Modal show={isStockAdjustOpen} onClose={() => setIsStockAdjustOpen(false)} maxWidth="2xl">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-orange-900 to-amber-900' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-white'} p-8`}>
            {/* Header */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl blur-xl"></div>
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-xl">
                  <i className="bi bi-box-seam text-3xl text-white"></i>
                </div>
                <div className="flex-1">
                  <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent'}`}>
                    Adjust Stock
                  </h3>
                  {selectedItem && (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      {selectedItem.name} • Current Stock: <span className="font-bold">{selectedItem.stock} units</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsStockAdjustOpen(false)}
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
                if (!selectedItem) return;
                
                let newStock = selectedItem.stock;
                const oldStock = selectedItem.stock;
                
                if (stockAdjustForm.data.adjustment_type === 'add') {
                  newStock += Number(stockAdjustForm.data.quantity);
                } else if (stockAdjustForm.data.adjustment_type === 'subtract') {
                  newStock -= Number(stockAdjustForm.data.quantity);
                } else if (stockAdjustForm.data.adjustment_type === 'set') {
                  newStock = Number(stockAdjustForm.data.quantity);
                }
                
                newStock = Math.max(0, newStock);
                
                // Use the shared hook to update stock (syncs with Sales and Purchases pages)
                updateStock(selectedItem.id, newStock);
                
                // Dispatch activity event
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('newActivity', {
                    detail: {
                      id: `medicine-stock-${Date.now()}`,
                      type: 'medicine',
                      title: 'Stock Adjusted',
                      description: `Adjusted stock for ${selectedItem.name}`,
                      details: `From ${oldStock} to ${newStock} units • Reason: ${stockAdjustForm.data.reason || 'Manual adjustment'}`,
                      time: new Date().toISOString(),
                      priority: 'normal',
                      route: '/medicines'
                    }
                  }));
                }, 100);
                
                setIsStockAdjustOpen(false);
                stockAdjustForm.reset();
              }} 
              className="space-y-6"
            >
              {/* Adjustment Type */}
              <div className="group">
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <i className="bi bi-arrow-left-right text-orange-500"></i>
                  Adjustment Type
                </label>
                <select
                  id="adjustment_type"
                  value={stockAdjustForm.data.adjustment_type}
                  onChange={e => stockAdjustForm.setData('adjustment_type', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700 text-white focus:border-orange-500' 
                      : 'bg-white border-gray-200 text-gray-900 focus:border-orange-500'
                  } focus:ring-4 focus:ring-orange-500/20 focus:outline-none`}
                >
                  <option value="add">➕ Add Stock</option>
                  <option value="subtract">➖ Remove Stock</option>
                  <option value="set">🎯 Set Exact Amount</option>
                </select>
              </div>

              {/* Quantity */}
              <div className="group">
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <i className="bi bi-123 text-orange-500"></i>
                  Quantity
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="0"
                  placeholder="Enter quantity"
                  value={stockAdjustForm.data.quantity}
                  onChange={e => stockAdjustForm.setData('quantity', Number(e.target.value))}
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-500'
                  } focus:ring-4 focus:ring-orange-500/20 focus:outline-none`}
                />
                {selectedItem && stockAdjustForm.data.quantity > 0 && (
                  <div className={`mt-3 p-4 rounded-xl ${darkMode ? 'bg-orange-500/10 border-2 border-orange-500/20' : 'bg-orange-50 border-2 border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${darkMode ? 'text-orange-300' : 'text-orange-900'}`}>
                        New Stock Level
                      </span>
                      <span className={`text-2xl font-black ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                        {
                          stockAdjustForm.data.adjustment_type === 'add' 
                            ? selectedItem.stock + Number(stockAdjustForm.data.quantity)
                            : stockAdjustForm.data.adjustment_type === 'subtract'
                            ? Math.max(0, selectedItem.stock - Number(stockAdjustForm.data.quantity))
                            : Number(stockAdjustForm.data.quantity)
                        } units
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="group">
                <label className={`block text-sm font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <i className="bi bi-chat-left-text text-orange-500"></i>
                  Reason (Optional)
                </label>
                <textarea
                  id="reason"
                  rows="3"
                  placeholder="e.g., Received new shipment, Damaged goods, Stock count correction..."
                  value={stockAdjustForm.data.reason}
                  onChange={e => stockAdjustForm.setData('reason', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-500'
                  } focus:ring-4 focus:ring-orange-500/20 focus:outline-none`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsStockAdjustOpen(false)}
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
                  disabled={!stockAdjustForm.data.quantity}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <i className="bi bi-check-circle mr-2"></i>
                  Adjust Stock
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Remove Expired Medicine Modal */}
        <Modal show={isRemoveExpiredOpen} onClose={() => setIsRemoveExpiredOpen(false)} maxWidth="xl">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-red-900 to-rose-900' : 'bg-gradient-to-br from-red-50 via-rose-50 to-white'} p-8`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl">
                <i className="bi bi-trash text-3xl text-white"></i>
              </div>
              <div>
                <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent'}`}>
                  Remove Expired Medicine
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  This will remove the expired stock from inventory
                </p>
              </div>
            </div>

            {selectedItem && (
              <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border-2 border-red-500/30' : 'bg-red-50 border-2 border-red-200'} mb-6`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Medicine Name</p>
                    <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Brand</p>
                    <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.brand || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Current Stock</p>
                    <p className={`font-bold text-lg ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{selectedItem.stock} units</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Expiry Date</p>
                    <p className={`font-bold text-lg ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {selectedItem.expiry_date ? new Date(selectedItem.expiry_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Batch Number</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.batch_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Estimated Loss</p>
                    <p className={`font-bold text-lg ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      UGX {((selectedItem.stock || 0) * (selectedItem.cost_price || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={`p-4 rounded-xl ${darkMode ? 'bg-yellow-500/10 border-2 border-yellow-400/30' : 'bg-yellow-50 border-2 border-yellow-200'} mb-6`}>
              <div className="flex items-start gap-3">
                <i className={`bi bi-exclamation-triangle text-2xl ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}></i>
                <div>
                  <p className={`font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'} mb-1`}>Warning</p>
                  <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                    This action will set the stock to 0 and create a stock movement record. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsRemoveExpiredOpen(false)}
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
                onClick={handleRemoveExpired}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
                <i className="bi bi-trash mr-2"></i>
                Remove Expired Stock
              </button>
            </div>
          </div>
        </Modal>

        {/* Create Reorder/Purchase Order Modal */}
        <Modal show={isReorderOpen} onClose={() => setIsReorderOpen(false)} maxWidth="2xl">
          <div className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900' : 'bg-gradient-to-br from-green-50 via-emerald-50 to-white'} p-8`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                <i className="bi bi-cart-plus text-3xl text-white"></i>
              </div>
              <div>
                <h3 className={`text-3xl font-black ${darkMode ? 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'}`}>
                  Create Reorder
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Create a purchase order to restock this medicine
                </p>
              </div>
            </div>

            {selectedItem && (
              <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50 border-2 border-green-500/30' : 'bg-green-50 border-2 border-green-200'} mb-6`}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Medicine</p>
                    <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.name}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Brand</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.brand || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Current Stock</p>
                    <p className={`font-bold text-lg ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{selectedItem.stock} units</p>
                  </div>
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Reorder Level</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedItem.reorder_level || 10} units</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateReorder} className="space-y-5">
              <div>
                <InputLabel htmlFor="supplier_name" value="Supplier Name" />
                <TextInput
                  id="supplier_name"
                  type="text"
                  className="mt-1 block w-full"
                  value={reorderForm.data.supplier_name}
                  onChange={e => reorderForm.setData('supplier_name', e.target.value)}
                  required
                  placeholder="Enter supplier name"
                />
                <InputError className="mt-2" message={reorderForm.errors.supplier_name} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel htmlFor="quantity" value="Order Quantity" />
                  <TextInput
                    id="quantity"
                    type="number"
                    min="1"
                    className="mt-1 block w-full"
                    value={reorderForm.data.quantity}
                    onChange={e => reorderForm.setData('quantity', Number(e.target.value))}
                    required
                  />
                  <InputError className="mt-2" message={reorderForm.errors.quantity} />
                </div>

                <div>
                  <InputLabel htmlFor="unit_cost" value="Unit Cost (UGX)" />
                  <TextInput
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full"
                    value={reorderForm.data.unit_cost}
                    onChange={e => reorderForm.setData('unit_cost', e.target.value)}
                    required
                  />
                  <InputError className="mt-2" message={reorderForm.errors.unit_cost} />
                </div>
              </div>

              <div>
                <InputLabel htmlFor="notes" value="Notes (Optional)" />
                <textarea
                  id="notes"
                  rows="3"
                  className={`mt-1 block w-full rounded-xl border-2 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:border-green-500 focus:ring-4 focus:ring-green-500/20`}
                  value={reorderForm.data.notes}
                  onChange={e => reorderForm.setData('notes', e.target.value)}
                  placeholder="Add any additional notes..."
                ></textarea>
                <InputError className="mt-2" message={reorderForm.errors.notes} />
              </div>

              {reorderForm.data.quantity && reorderForm.data.unit_cost && (
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-blue-500/10 border-2 border-blue-400/30' : 'bg-blue-50 border-2 border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Total Order Cost:</span>
                    <span className={`text-2xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      UGX {(reorderForm.data.quantity * parseFloat(reorderForm.data.unit_cost || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsReorderOpen(false)}
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
                >
                  <i className="bi bi-cart-plus mr-2"></i>
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Barcode Scanner Overlay */}
        <BarcodeScanner
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={(code, type) => {
            try {
              // If QR JSON contains id, navigate to view
              if (type === 'qr') {
                const parsed = JSON.parse(code);
                if (parsed?.id) {
                  const item = allMedicines.find(m => m.id === parsed.id);
                  if (item) {
                    openView(item);
                    setScannerOpen(false);
                    return;
                  }
                }
              }
            } catch {}
            // Fallback: filter by code in SKU/batch/name
            setQuery(String(code));
          }}
        />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
