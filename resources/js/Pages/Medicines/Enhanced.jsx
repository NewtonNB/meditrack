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
// Temporarily removed problematic import
// import * as MedicineData from '@/Data/commonMedicines';
// import { toast } from 'react-toastify';
import BarcodeScanner from '@/Components/BarcodeScanner';

export default function MedicinesEnhanced() {
    const { props } = usePage();
    const serverMedicines = props.medicines?.data || [];

    // Local medicine data to prevent import issues
    const localMedicineCategories = [
        'Pain Relief', 'Antibiotics', 'Respiratory', 'Cardiovascular',
        'Diabetes', 'Gastrointestinal', 'Mental Health', 'Vitamins',
        'Topical', 'Eye/Ear', 'Emergency'
    ];

    const localMedicineBrands = [
        'GSK', 'Pfizer', 'Bayer', 'Novartis', 'Cipla', 'Grünenthal',
        'Boehringer Ingelheim', 'Sanofi', 'Roche', 'Johnson & Johnson',
        'Merck', 'AstraZeneca', 'Abbott', 'Teva', 'Mylan'
    ];

    const localCommonMedicines = [
        { name: 'Paracetamol 500mg', category: 'Pain Relief', brand: 'GSK' },
        { name: 'Ibuprofen 400mg', category: 'Pain Relief', brand: 'Pfizer' },
        { name: 'Aspirin 300mg', category: 'Pain Relief', brand: 'Bayer' },
        { name: 'Amoxicillin 500mg', category: 'Antibiotics', brand: 'Cipla' },
        { name: 'Azithromycin 250mg', category: 'Antibiotics', brand: 'Pfizer' },
        { name: 'Ciprofloxacin 500mg', category: 'Antibiotics', brand: 'Bayer' },
        { name: 'Salbutamol 100mcg', category: 'Respiratory', brand: 'GSK' },
        { name: 'Prednisolone 5mg', category: 'Respiratory', brand: 'Pfizer' },
        { name: 'Amlodipine 5mg', category: 'Cardiovascular', brand: 'Pfizer' },
        { name: 'Metformin 500mg', category: 'Diabetes', brand: 'Teva' }
    ];
    const pagination = props.medicines?.meta || null;

    // Use shared medicines hook
    const { medicines: hookMedicines, stats, addMedicine, updateMedicine, deleteMedicine, updateStock, isLoaded } = useMedicines(serverMedicines);

    // State declarations - moved before useEffect to prevent initialization errors
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
    const [selectedId, setSelectedId] = React.useState(null);

    // Medicine selection states
    const [medicineSearch, setMedicineSearch] = React.useState('');
    const [showMedicineDropdown, setShowMedicineDropdown] = React.useState(false);
    const [selectedMedicineTemplate, setSelectedMedicineTemplate] = React.useState(null);

    // Debug: Log medicines to see what we have
    React.useEffect(() => {
        console.log('Medicines loaded:', hookMedicines.length, hookMedicines);
    }, [hookMedicines]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (showMedicineDropdown && !event.target.closest('.medicine-dropdown-container')) {
                setShowMedicineDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMedicineDropdown]);
    const [selectedItem, setSelectedItem] = React.useState(null);

    const medicines = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = [...hookMedicines];

        // Text search filter
        if (q) {
            list = list.filter(
                m =>
                    (m.name || '').toLowerCase().includes(q) ||
                    (m.brand || '').toLowerCase().includes(q) ||
                    (m.batch_number || '').toLowerCase().includes(q)
            );
        }

        // Stock level filter
        if (stockFilter === 'low') {
            list = list.filter(m => m.stock <= (m.reorder_level || 10) && m.stock > 0);
        } else if (stockFilter === 'out') {
            list = list.filter(m => m.stock === 0);
        }

        // Sort
        list.sort((a, b) => {
            const av = (a[sortKey] ?? '').toString();
            const bv = (b[sortKey] ?? '').toString();
            if (sortDir === 'asc') return av.localeCompare(bv, undefined, { numeric: true });
            return bv.localeCompare(av, undefined, { numeric: true });
        });

        return list.slice(0, perPage);
    }, [hookMedicines, query, stockFilter, perPage, sortKey, sortDir]);

    const stockAdjustForm = useForm({
        adjustment_type: 'add', // add, subtract, set
        quantity: 0,
        reason: '',
    });

    const createForm = useForm({
        name: '',
        brand: '',
        category: '',
        batch_number: '',
        expiry_date: '',
        cost: '',
        price: '',
        stock: 0,
        min_stock: 10,
        supplier: '',
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

    const handleCreate = e => {
        e.preventDefault();

        // Clear previous errors
        createForm.clearErrors();

        // Custom validation
        const errors = {};

        // Validate medicine name
        if (!createForm.data.name || createForm.data.name.trim().length === 0) {
            errors.name = 'Medicine name is required';
        } else if (createForm.data.name.trim().length < 3) {
            errors.name = 'Medicine name must be at least 3 characters';
        } else if (createForm.data.name.trim().length > 100) {
            errors.name = 'Medicine name must not exceed 100 characters';
        }

        // Validate selling price
        if (!createForm.data.price || createForm.data.price === '') {
            errors.price = 'Selling price is required';
        } else {
            const price = parseFloat(createForm.data.price);
            if (isNaN(price) || price < 0) {
                errors.price = 'Selling price must be a positive number';
            } else if (price === 0) {
                errors.price = 'Selling price cannot be zero';
            } else if (price > 1000000) {
                errors.price = 'Selling price seems unreasonably high';
            }
        }

        // Validate cost price
        if (createForm.data.cost && createForm.data.cost !== '') {
            const cost = parseFloat(createForm.data.cost);
            const price = parseFloat(createForm.data.price);
            if (isNaN(cost) || cost < 0) {
                errors.cost = 'Cost price must be a positive number';
            } else if (!isNaN(price) && cost > price) {
                errors.cost = 'Cost price should not exceed selling price';
            }
        }

        // Validate stock quantity
        if (!createForm.data.stock && createForm.data.stock !== 0) {
            errors.stock = 'Stock quantity is required';
        } else {
            const stock = parseInt(createForm.data.stock);
            if (isNaN(stock) || stock < 0) {
                errors.stock = 'Stock quantity must be a positive number';
            } else if (stock > 1000000) {
                errors.stock = 'Stock quantity seems unreasonably high';
            }
        }

        // Validate reorder level
        if (createForm.data.min_stock && createForm.data.min_stock !== '') {
            const minStock = parseInt(createForm.data.min_stock);
            if (isNaN(minStock) || minStock < 0) {
                errors.min_stock = 'Reorder level must be a positive number';
            }
        }

        // Validate expiry date
        if (createForm.data.expiry_date) {
            const expiryDate = new Date(createForm.data.expiry_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (expiryDate < today) {
                errors.expiry_date = 'Expiry date cannot be in the past';
            }
            
            // Warning for medicines expiring within 30 days
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            if (expiryDate < thirtyDaysFromNow && expiryDate >= today) {
                errors.expiry_date = 'Warning: Medicine expires within 30 days';
            }
        }

        // Validate batch number format (optional but if provided, should be valid)
        if (createForm.data.batch_number && createForm.data.batch_number.trim().length > 0) {
            if (createForm.data.batch_number.trim().length < 3) {
                errors.batch_number = 'Batch number must be at least 3 characters';
            } else if (createForm.data.batch_number.trim().length > 50) {
                errors.batch_number = 'Batch number must not exceed 50 characters';
            }
        }

        // Validate supplier name
        if (createForm.data.supplier && createForm.data.supplier.trim().length > 0) {
            if (createForm.data.supplier.trim().length < 2) {
                errors.supplier = 'Supplier name must be at least 2 characters';
            } else if (createForm.data.supplier.trim().length > 100) {
                errors.supplier = 'Supplier name must not exceed 100 characters';
            }
        }

        // Validate description
        if (createForm.data.description && createForm.data.description.trim().length > 500) {
            errors.description = 'Description must not exceed 500 characters';
        }

        // Check for duplicate medicine name
        const duplicateMedicine = hookMedicines.find(
            m => m.name.toLowerCase().trim() === createForm.data.name.toLowerCase().trim()
        );
        if (duplicateMedicine) {
            errors.name = 'A medicine with this name already exists';
        }

        // If there are validation errors, set them and return
        if (Object.keys(errors).length > 0) {
            Object.keys(errors).forEach(key => {
                createForm.setError(key, errors[key]);
            });
            return;
        }

        // Use shared hook to add medicine
        const newMedicine = addMedicine({
            name: createForm.data.name.trim(),
            brand: createForm.data.brand,
            category: createForm.data.category,
            price: parseFloat(createForm.data.price) || 0,
            cost: parseFloat(createForm.data.cost) || 0,
            stock: parseInt(createForm.data.stock) || 0,
            min_stock: parseInt(createForm.data.min_stock) || 10,
            expiry_date: createForm.data.expiry_date,
            batch_number: createForm.data.batch_number?.trim(),
            supplier: createForm.data.supplier?.trim(),
            description: createForm.data.description?.trim(),
        });

        // Close modal and reset form
        setIsCreateOpen(false);
        createForm.reset();

        console.log('New medicine added:', newMedicine);
    };

    // Handle medicine template selection
    const handleMedicineSelect = (medicine) => {
        setSelectedMedicineTemplate(medicine);
        createForm.setData({
            ...createForm.data,
            name: medicine.name,
            brand: medicine.brand || '',
            category: medicine.category || '',
        });
        setMedicineSearch(medicine.name);
        setShowMedicineDropdown(false);
    };

    // Handle custom medicine name input
    const handleMedicineNameChange = (value) => {
        setMedicineSearch(value);
        createForm.setData('name', value);
        setShowMedicineDropdown(value.length > 0);
        setSelectedMedicineTemplate(null);
    };

    // Reset medicine selection when modal closes
    const handleCreateModalClose = () => {
        setIsCreateOpen(false);
        setMedicineSearch('');
        setShowMedicineDropdown(false);
        setSelectedMedicineTemplate(null);
        createForm.reset();
    };

    const handleDelete = () => {
        if (!selectedId) return;

        // Use shared hook to delete medicine
        deleteMedicine(selectedId);

        // Close modal
        setIsDeleteOpen(false);

        console.log('Medicine deleted:', selectedId);
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

    const handleEdit = e => {
        e.preventDefault();
        if (!selectedItem) return;

        // Clear previous errors
        editForm.clearErrors();

        // Custom validation
        const errors = {};

        // Validate medicine name
        if (!editForm.data.name || editForm.data.name.trim().length === 0) {
            errors.name = 'Medicine name is required';
        } else if (editForm.data.name.trim().length < 3) {
            errors.name = 'Medicine name must be at least 3 characters';
        } else if (editForm.data.name.trim().length > 100) {
            errors.name = 'Medicine name must not exceed 100 characters';
        }

        // Validate selling price
        if (!editForm.data.price || editForm.data.price === '') {
            errors.price = 'Selling price is required';
        } else {
            const price = parseFloat(editForm.data.price);
            if (isNaN(price) || price < 0) {
                errors.price = 'Selling price must be a positive number';
            } else if (price === 0) {
                errors.price = 'Selling price cannot be zero';
            } else if (price > 1000000) {
                errors.price = 'Selling price seems unreasonably high';
            }
        }

        // Validate cost price
        if (editForm.data.cost && editForm.data.cost !== '') {
            const cost = parseFloat(editForm.data.cost);
            const price = parseFloat(editForm.data.price);
            if (isNaN(cost) || cost < 0) {
                errors.cost = 'Cost price must be a positive number';
            } else if (!isNaN(price) && cost > price) {
                errors.cost = 'Cost price should not exceed selling price';
            }
        }

        // Validate stock quantity
        if (!editForm.data.stock && editForm.data.stock !== 0) {
            errors.stock = 'Stock quantity is required';
        } else {
            const stock = parseInt(editForm.data.stock);
            if (isNaN(stock) || stock < 0) {
                errors.stock = 'Stock quantity must be a positive number';
            } else if (stock > 1000000) {
                errors.stock = 'Stock quantity seems unreasonably high';
            }
        }

        // Validate reorder level
        if (editForm.data.min_stock && editForm.data.min_stock !== '') {
            const minStock = parseInt(editForm.data.min_stock);
            if (isNaN(minStock) || minStock < 0) {
                errors.min_stock = 'Reorder level must be a positive number';
            }
        }

        // Validate expiry date
        if (editForm.data.expiry_date) {
            const expiryDate = new Date(editForm.data.expiry_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (expiryDate < today) {
                errors.expiry_date = 'Expiry date cannot be in the past';
            }
            
            // Warning for medicines expiring within 30 days
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            if (expiryDate < thirtyDaysFromNow && expiryDate >= today) {
                errors.expiry_date = 'Warning: Medicine expires within 30 days';
            }
        }

        // Validate batch number format
        if (editForm.data.batch_number && editForm.data.batch_number.trim().length > 0) {
            if (editForm.data.batch_number.trim().length < 3) {
                errors.batch_number = 'Batch number must be at least 3 characters';
            } else if (editForm.data.batch_number.trim().length > 50) {
                errors.batch_number = 'Batch number must not exceed 50 characters';
            }
        }

        // Validate supplier name
        if (editForm.data.supplier && editForm.data.supplier.trim().length > 0) {
            if (editForm.data.supplier.trim().length < 2) {
                errors.supplier = 'Supplier name must be at least 2 characters';
            } else if (editForm.data.supplier.trim().length > 100) {
                errors.supplier = 'Supplier name must not exceed 100 characters';
            }
        }

        // Validate description
        if (editForm.data.description && editForm.data.description.trim().length > 500) {
            errors.description = 'Description must not exceed 500 characters';
        }

        // Check for duplicate medicine name (excluding current item)
        const duplicateMedicine = hookMedicines.find(
            m => m.id !== selectedItem.id && 
                 m.name.toLowerCase().trim() === editForm.data.name.toLowerCase().trim()
        );
        if (duplicateMedicine) {
            errors.name = 'A medicine with this name already exists';
        }

        // If there are validation errors, set them and return
        if (Object.keys(errors).length > 0) {
            Object.keys(errors).forEach(key => {
                editForm.setError(key, errors[key]);
            });
            return;
        }

        // Use shared hook to update medicine
        updateMedicine(selectedItem.id, {
            name: editForm.data.name.trim(),
            brand: editForm.data.brand,
            category: editForm.data.category,
            price: parseFloat(editForm.data.price) || selectedItem.price,
            cost: parseFloat(editForm.data.cost) || selectedItem.cost,
            stock: parseInt(editForm.data.stock) || selectedItem.stock,
            min_stock: parseInt(editForm.data.min_stock) || selectedItem.min_stock,
            expiry_date: editForm.data.expiry_date || selectedItem.expiry_date,
            batch_number: editForm.data.batch_number?.trim() || selectedItem.batch_number,
            supplier: editForm.data.supplier?.trim() || selectedItem.supplier,
            description: editForm.data.description?.trim() || selectedItem.description,
        });

        // Close modal
        setIsEditOpen(false);

        console.log('Medicine updated:', selectedItem.id);
    };

    const exportCSV = () => {
        const headers = ['Name', 'Brand', 'SKU', 'Stock', 'Selling Price'];
        const rows = hookMedicines.map(m => [
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

    const [isLoading, setIsLoading] = React.useState(false);
    const [darkMode, setDarkMode] = React.useState(false);
    const [scannerOpen, setScannerOpen] = React.useState(false);

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
                className={`min-h-screen transition-all duration-500 ${darkMode
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
                    {/* Modern Header Section */}
                    <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 mb-6 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
                        {/* Top Row: Title and Primary Actions */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-green-500 to-emerald-600'} flex items-center justify-center shadow-lg`}>
                                    <i className="bi bi-capsule-pill text-2xl text-white"></i>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Medicine Inventory
                                    </h1>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                        Manage your medicine stock, track inventory levels, and monitor expiry dates
                                    </p>
                                </div>
                            </div>

                            {/* Primary Action Button */}
                            <button
                                onClick={() => {
                                    clearSelection();
                                    setIsCreateOpen(true);
                                }}
                                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${darkMode
                                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                                    : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20'
                                    } hover:scale-105`}
                            >
                                <i className="bi bi-plus-lg"></i>
                                <span>Add Medicine</span>
                            </button>
                        </div>

                        {/* Second Row: Search and Filter Controls */}
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            {/* Left: Search and Filters */}
                            <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                {/* Search Bar */}
                                <div className="relative flex-1 max-w-md">
                                    <input
                                        type="search"
                                        placeholder="Search name, brand or SKU..."
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-600/50 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-500'} shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all`}
                                    />
                                    <i className={`bi bi-search absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                                </div>

                                {/* Stock Filter */}
                                <select
                                    value={stockFilter}
                                    onChange={e => setStockFilter(e.target.value)}
                                    className={`px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-600/50 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all`}
                                >
                                    <option value="all">All Stock Levels</option>
                                    <option value="low">Low Stock Only</option>
                                    <option value="out">Out of Stock Only</option>
                                </select>
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex items-center gap-2">
                                {/* Dark Mode Toggle */}
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`p-2.5 rounded-xl transition-all duration-300 ${darkMode
                                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                        }`}
                                    title="Toggle dark mode"
                                >
                                    <i className={`bi ${darkMode ? 'bi-sun-fill' : 'bi-moon-fill'} text-lg`}></i>
                                </button>

                                {/* Export Button */}
                                <button
                                    onClick={exportCSV}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${darkMode
                                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                        }`}
                                    title="Export to CSV"
                                >
                                    <i className="bi bi-download"></i>
                                    <span className="hidden sm:inline">Export CSV</span>
                                </button>

                                {/* Scan Button */}
                                <button
                                    onClick={() => setScannerOpen(true)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${darkMode
                                        ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30'
                                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                                        }`}
                                    title="Scan barcode or QR"
                                >
                                    <i className="bi bi-upc-scan"></i>
                                    <span className="hidden sm:inline">Scan</span>
                                </button>
                            </div>
                        </div>

                        {/* Third Row: Status Indicators */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200/20">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                <i className="bi bi-check-circle-fill text-sm"></i>
                                <span className="text-sm font-semibold">Inventory Active</span>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-gray-700/50 text-gray-300 border border-gray-600/50' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                                <i className="bi bi-box-seam text-sm"></i>
                                <span className="text-sm font-semibold">Total: {stats.total} items</span>
                            </div>
                            {isLoading && (
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                    <span className="text-sm font-semibold">Syncing...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Statistics Dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Medicines Card */}
                        <div className={`group backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/30' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className={`bi bi-capsule text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}></i>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Total Medicines</p>
                                    </div>
                                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-blue-200' : 'text-blue-500'}`}>Items in inventory</p>
                                    <div className={`mt-3 text-xs ${darkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                                        <span className="font-medium">{stats.categories}</span> categories
                                    </div>
                                </div>
                                <div className={`w-14 h-14 rounded-xl ${darkMode ? 'bg-blue-500/30' : 'bg-blue-500'} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <i className="bi bi-capsule text-xl text-white"></i>
                                </div>
                            </div>
                        </div>

                        {/* Available Stock Card */}
                        <div className={`group backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/30' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className={`bi bi-check-circle text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}></i>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-600'}`}>Available Stock</p>
                                    </div>
                                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.total - stats.lowStock - stats.outOfStock}
                                    </p>
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-green-200' : 'text-green-500'}`}>Items in good stock</p>
                                    <div className={`mt-3 text-xs ${darkMode ? 'text-green-200' : 'text-green-600'}`}>
                                        <span className="font-medium">{((stats.total - stats.lowStock - stats.outOfStock) / stats.total * 100).toFixed(1)}%</span> availability
                                    </div>
                                </div>
                                <div className={`w-14 h-14 rounded-xl ${darkMode ? 'bg-green-500/30' : 'bg-green-500'} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <i className="bi bi-check-circle text-xl text-white"></i>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Alert Card */}
                        <div className={`group backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-400/30' : 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
                            onClick={() => setStockFilter('low')}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className={`bi bi-exclamation-triangle text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}></i>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>Low Stock Alert</p>
                                    </div>
                                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.lowStock}
                                    </p>
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-yellow-200' : 'text-yellow-500'}`}>Items need reorder</p>
                                    <div className={`mt-3 text-xs ${darkMode ? 'text-yellow-200' : 'text-yellow-600'}`}>
                                        Click to <span className="font-medium">view items</span>
                                    </div>
                                </div>
                                <div className={`w-14 h-14 rounded-xl ${darkMode ? 'bg-yellow-500/30' : 'bg-yellow-500'} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <i className="bi bi-exclamation-triangle text-xl text-white"></i>
                                </div>
                            </div>
                        </div>

                        {/* Out of Stock Critical Card */}
                        <div className={`group backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-400/30' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
                            onClick={() => setStockFilter('out')}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className={`bi bi-x-circle text-sm ${darkMode ? 'text-red-300' : 'text-red-600'}`}></i>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-600'}`}>Out of Stock</p>
                                    </div>
                                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.outOfStock}
                                    </p>
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-red-200' : 'text-red-500'}`}>Urgent restocking needed</p>
                                    <div className={`mt-3 text-xs ${darkMode ? 'text-red-200' : 'text-red-600'}`}>
                                        Click to <span className="font-medium">view items</span>
                                    </div>
                                </div>
                                <div className={`w-14 h-14 rounded-xl ${darkMode ? 'bg-red-500/30' : 'bg-red-500'} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <i className="bi bi-x-circle text-xl text-white"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={`backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-400/30' : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-600'}`}>Out of Stock</p>
                                <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {stats.outOfStock}
                                </p>
                                <p className={`text-xs mt-1 ${darkMode ? 'text-red-200' : 'text-red-500'}`}>Urgent action</p>
                            </div>
                            <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-red-500/30' : 'bg-red-500'} flex items-center justify-center shadow-lg`}>
                                <i className="bi bi-x-circle text-2xl text-white"></i>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Medicine Table Section */}
                <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl overflow-hidden`}>
                    {/* Table Header with Controls */}
                    <div className={`p-6 border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Left: Title and Count */}
                            <div className="flex items-center gap-4">
                                <div>
                                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Medicine Inventory
                                    </h2>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                        Showing{' '}
                                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {Math.min(medicines.length, perPage)}
                                        </span>{' '}
                                        of{' '}
                                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {medicines.length}
                                        </span>{' '}
                                        medicines
                                        {stockFilter !== 'all' && (
                                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${stockFilter === 'low'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {stockFilter === 'low' ? 'Low Stock Filter' : 'Out of Stock Filter'}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Table Controls */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                {/* Items per page */}
                                <div className="flex items-center gap-2">
                                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Show:
                                    </label>
                                    <select
                                        value={perPage}
                                        onChange={e => setPerPage(Number(e.target.value))}
                                        className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-600/50 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all`}
                                    >
                                        <option value={5}>5 items</option>
                                        <option value={10}>10 items</option>
                                        <option value={25}>25 items</option>
                                        <option value={50}>50 items</option>
                                    </select>
                                </div>

                                {/* Quick Filter Buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setStockFilter('all')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${stockFilter === 'all'
                                                ? darkMode
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-green-500 text-white shadow-sm'
                                                : darkMode
                                                    ? 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setStockFilter('low')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${stockFilter === 'low'
                                                ? 'bg-yellow-500 text-white shadow-sm'
                                                : darkMode
                                                    ? 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                            }`}
                                    >
                                        Low Stock
                                    </button>
                                    <button
                                        onClick={() => setStockFilter('out')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${stockFilter === 'out'
                                                ? 'bg-red-500 text-white shadow-sm'
                                                : darkMode
                                                    ? 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                            }`}
                                    >
                                        Out of Stock
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {hookMedicines.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-40 h-40 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4">
                                <i className="bi bi-box-seam text-3xl"></i>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700">No medicines yet</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Start by adding a new medicine to your inventory.
                            </p>
                            <div className="mt-4">
                                <PrimaryButton color="green" onClick={() => setIsCreateOpen(true)}>
                                    Add first medicine
                                </PrimaryButton>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-50/80'} sticky top-0 backdrop-blur-sm`}>
                                    <tr>
                                        <th
                                            className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase cursor-pointer hover:bg-gray-100/50 transition`}
                                            onClick={() => toggleSort('name')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-capsule-pill text-sm"></i>
                                                Name
                                                {sortKey === 'name' && (
                                                    <i
                                                        className={`bi ${sortDir === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down'} text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                                                    ></i>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase cursor-pointer hover:bg-gray-100/50 transition`}
                                            onClick={() => toggleSort('brand')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-tag text-sm"></i>
                                                Brand
                                                {sortKey === 'brand' && (
                                                    <i
                                                        className={`bi ${sortDir === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down'} text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                                                    ></i>
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase cursor-pointer hover:bg-gray-100/50 transition`}
                                            onClick={() => toggleSort('stock')}
                                        >
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-boxes text-sm"></i>
                                                Stock
                                                {sortKey === 'stock' && (
                                                    <i
                                                        className={`bi ${sortDir === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down'} text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                                                    ></i>
                                                )}
                                            </div>
                                        </th>
                                        <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-cash-coin text-sm"></i>
                                                Price
                                            </div>
                                        </th>
                                        <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-calendar-event text-sm"></i>
                                                Expiry
                                            </div>
                                        </th>
                                        <th className={`px-6 py-4 text-right text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                                            <div className="flex items-center justify-end gap-2">
                                                <i className="bi bi-gear text-sm"></i>
                                                Actions
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                                    {!isLoaded ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                    <span className="ml-2">Loading medicines...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : medicines.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <i className="bi bi-capsule text-4xl text-gray-300 mb-4"></i>
                                                    <p className="text-lg font-medium mb-2">No medicines found</p>
                                                    <p className="text-sm">
                                                        {query ? 'Try adjusting your search criteria.' : 'Add your first medicine to get started.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : medicines.map(m => {
                                        const isLowStock = m.stock > 0 && m.stock <= (m.reorder_level || 10);
                                        const isOutOfStock = m.stock === 0;
                                        const isExpired = m.expiry_date && new Date(m.expiry_date) < new Date();
                                        const isExpiringSoon = m.expiry_date && new Date(m.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && !isExpired;

                                        return (
                                            <tr key={m.id} className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-green-50/50'} transition-all duration-200 ${isOutOfStock ? (darkMode ? 'bg-red-900/20' : 'bg-red-50/30') : ''}`}>
                                                {/* Medicine Name & SKU */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center flex-shrink-0`}>
                                                            <i className={`bi bi-capsule-pill ${darkMode ? 'text-green-400' : 'text-green-600'} text-lg`}></i>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                                                                {m.name}
                                                            </div>
                                                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5 flex items-center gap-2`}>
                                                                <span className="flex items-center gap-1">
                                                                    <i className="bi bi-upc-scan text-xs"></i>
                                                                    {m.sku ?? 'No SKU'}
                                                                </span>
                                                                {m.batch_number && (
                                                                    <span className="flex items-center gap-1">
                                                                        <i className="bi bi-hash text-xs"></i>
                                                                        {m.batch_number}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Brand */}
                                                <td className="px-6 py-4">
                                                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                                                        {m.brand ?? '-'}
                                                    </div>
                                                    {m.category && (
                                                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
                                                            {m.category}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Stock with Status Badge */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg shadow-sm ${isOutOfStock
                                                            ? 'bg-red-100 text-red-700 border border-red-200'
                                                            : isLowStock
                                                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                                : 'bg-green-100 text-green-700 border border-green-200'
                                                            }`}>
                                                            <i className={`bi ${isOutOfStock ? 'bi-x-circle-fill' : isLowStock ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}></i>
                                                            {m.stock}
                                                        </span>
                                                    </div>
                                                    {m.reorder_level && (
                                                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                                                            Reorder: {m.reorder_level}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Clean Price Display */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {/* Selling Price - Larger and Prominent */}
                                                        <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            UGX {Number(m.selling_price || 0).toLocaleString()}
                                                        </div>
                                                        
                                                        {/* Cost Price (if user has permission) - Smaller */}
                                                        {props.canViewCosts && m.cost_price && (
                                                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                Cost: UGX {Number(m.cost_price).toLocaleString()}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Smart Profit Indicator with Warnings */}
                                                        {props.canViewCosts && m.cost_price && m.selling_price && m.cost_price > 0 && (
                                                            (() => {
                                                                const markup = (((m.selling_price - m.cost_price) / m.cost_price) * 100);
                                                                const isHighMarkup = markup > 60;
                                                                const isVeryHighMarkup = markup > 100;
                                                                
                                                                return (
                                                                    <div className={`text-xs font-medium ${
                                                                        isVeryHighMarkup 
                                                                            ? 'text-red-600' 
                                                                            : isHighMarkup 
                                                                            ? 'text-orange-600' 
                                                                            : darkMode ? 'text-green-400' : 'text-green-600'
                                                                    }`}>
                                                                        {isVeryHighMarkup && '⚠️ '}
                                                                        {isHighMarkup && !isVeryHighMarkup && '⚡ '}
                                                                        +{markup.toFixed(0)}%
                                                                        {isVeryHighMarkup && ' (Too High)'}
                                                                        {isHighMarkup && !isVeryHighMarkup && ' (High)'}
                                                                    </div>
                                                                );
                                                            })()
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Expiry Date with Status */}
                                                <td className="px-6 py-4">
                                                    {m.expiry_date ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${isExpired
                                                                ? 'bg-red-100 text-red-700 border border-red-200'
                                                                : isExpiringSoon
                                                                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                                                    : darkMode ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'
                                                                }`}>
                                                                <i className={`bi ${isExpired ? 'bi-x-circle-fill' : isExpiringSoon ? 'bi-exclamation-circle-fill' : 'bi-calendar-check'}`}></i>
                                                                {new Date(m.expiry_date).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No expiry</span>
                                                    )}
                                                </td>
                                                {/* Action Buttons */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openView(m)}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${darkMode
                                                                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-400/30'
                                                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                                                }`}
                                                            title="View details"
                                                        >
                                                            <i className="bi bi-eye"></i>
                                                            View
                                                        </button>
                                                        {props.canManage && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedItem(m);
                                                                        setIsStockAdjustOpen(true);
                                                                        stockAdjustForm.reset();
                                                                    }}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${darkMode
                                                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-400/30'
                                                                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                                                        }`}
                                                                    title="Adjust stock"
                                                                >
                                                                    <i className="bi bi-box-seam"></i>
                                                                    Stock
                                                                </button>
                                                                <button
                                                                    onClick={() => openEdit(m)}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${darkMode
                                                                        ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-400/30'
                                                                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                                                                        }`}
                                                                    title="Edit medicine"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => openDelete(m.id, m)}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${darkMode
                                                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-400/30'
                                                                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                                                        }`}
                                                                    title="Delete medicine"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                    Delete
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
                    )}
                </div>

                {/* Professional Add Medicine Modal */}
                <Modal show={isCreateOpen} onClose={handleCreateModalClose} maxWidth="2xl">
                    <div className="relative bg-white overflow-hidden">
                        {/* Decorative Background Pattern */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 opacity-50"></div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

                        {/* Modal Header */}
                        <div className="relative px-6 py-5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 border-b-4 border-green-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/30">
                                            <i className="bi bi-capsule-pill text-2xl text-white"></i>
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                                            <i className="bi bi-plus text-[10px] text-white font-bold"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">Add New Medicine</h2>
                                        <p className="text-xs text-green-50 mt-1 font-medium">
                                            <i className="bi bi-info-circle mr-1"></i>
                                            Complete the form below to add medicine to your inventory
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:rotate-90 border border-white/20"
                                    onClick={handleCreateModalClose}
                                    aria-label="Close"
                                >
                                    <i className="bi bi-x-lg text-xl"></i>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="relative p-6 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
                            {/* Section 1: Medicine Information */}
                            <div className="relative bg-white rounded-2xl p-5 shadow-lg border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg">
                                    <span className="text-xs font-bold text-white">STEP 1</span>
                                </div>
                                <div className="flex items-center gap-3 mb-5 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                        <i className="bi bi-capsule text-white text-lg"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Medicine Information</h3>
                                        <p className="text-xs text-gray-500">Basic details about the medicine</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Medicine Name with Smart Search */}
                                    <div className="relative medicine-dropdown-container">
                                        <label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                                            <i className="bi bi-asterisk text-red-500 text-xs"></i>
                                            Medicine Name
                                            <span className="ml-auto text-xs font-normal text-gray-500">(Required)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <i className="bi bi-search text-gray-400 text-lg"></i>
                                            </div>
                                            <input
                                                id="name"
                                                type="text"
                                                className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 font-medium"
                                                value={medicineSearch}
                                                onChange={e => handleMedicineNameChange(e.target.value)}
                                                placeholder="Search from database or type custom name..."
                                                onFocus={() => setShowMedicineDropdown(true)}
                                                required
                                            />
                                        </div>

                                {/* Medicine Dropdown */}
                                {showMedicineDropdown && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-72 overflow-auto animate-fadeIn">
                                        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b-2 border-blue-200">
                                            <p className="text-xs font-semibold text-blue-700">
                                                <i className="bi bi-lightbulb mr-1"></i>
                                                Select from common medicines or continue typing
                                            </p>
                                        </div>
                                        {localCommonMedicines.filter(m =>
                                            !medicineSearch || m.name?.toLowerCase().includes(medicineSearch.toLowerCase()) ||
                                            m.brand?.toLowerCase().includes(medicineSearch.toLowerCase()) ||
                                            m.category?.toLowerCase().includes(medicineSearch.toLowerCase())
                                        ).slice(0, 10).map((medicine, index) => (
                                            <div
                                                key={index}
                                                className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-150 group"
                                                onClick={() => handleMedicineSelect(medicine)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                                                            <i className="bi bi-capsule text-blue-600"></i>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{medicine.name}</div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                                <span className="flex items-center gap-1">
                                                                    <i className="bi bi-building"></i>
                                                                    {medicine.brand}
                                                                </span>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <i className="bi bi-tag"></i>
                                                                    {medicine.category}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-semibold group-hover:bg-blue-200 transition-colors">
                                                        {medicine.category}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {localCommonMedicines.filter(m =>
                                            !medicineSearch || m.name?.toLowerCase().includes(medicineSearch.toLowerCase()) ||
                                            m.brand?.toLowerCase().includes(medicineSearch.toLowerCase()) ||
                                            m.category?.toLowerCase().includes(medicineSearch.toLowerCase())
                                        ).length === 0 && (
                                                <div className="px-4 py-8 text-gray-500 text-center">
                                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                                        <i className="bi bi-search text-3xl text-gray-400"></i>
                                                    </div>
                                                    <p className="font-semibold text-gray-700">No medicines found</p>
                                                    <p className="text-xs mt-1">Continue typing to add a custom medicine</p>
                                                </div>
                                            )}
                                    </div>
                                )}

                                {/* Selected Medicine Preview */}
                                {selectedMedicineTemplate && (
                                    <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm animate-fadeIn">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center shadow-md">
                                                <i className="bi bi-check-circle-fill text-white text-lg"></i>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded">SELECTED</span>
                                                </div>
                                                <div className="font-bold text-green-900 mt-1">{selectedMedicineTemplate.name}</div>
                                                <div className="text-sm text-green-700 flex items-center gap-2 mt-0.5">
                                                    <span>{selectedMedicineTemplate.brand}</span>
                                                    <span>•</span>
                                                    <span>{selectedMedicineTemplate.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {createForm.errors.name && (
                                    <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                                        <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                                            <i className="bi bi-exclamation-triangle-fill"></i>
                                            {createForm.errors.name}
                                        </p>
                                    </div>
                                )}
                            </div>

                                    {/* Brand */}
                                    <div>
                                        <label htmlFor="brand" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                                            <i className="bi bi-building text-blue-500"></i>
                                            Brand
                                            <span className="ml-auto text-xs font-normal text-gray-500">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <i className="bi bi-building text-gray-400"></i>
                                            </div>
                                            <select
                                                id="brand"
                                                className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200 text-gray-900 font-medium appearance-none bg-white cursor-pointer"
                                                value={createForm.data.brand}
                                                onChange={e => createForm.setData('brand', e.target.value)}
                                            >
                                                <option value="">Select Brand</option>
                                                {localMedicineBrands.map(brand => (
                                                    <option key={brand} value={brand}>{brand}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                                <i className="bi bi-chevron-down text-gray-400"></i>
                                            </div>
                                        </div>
                                        {createForm.errors.brand && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <i className="bi bi-exclamation-circle-fill"></i>
                                                {createForm.errors.brand}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label htmlFor="category" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                                            <i className="bi bi-tag text-purple-500"></i>
                                            Category
                                            <span className="ml-auto text-xs font-normal text-gray-500">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <i className="bi bi-tag text-gray-400"></i>
                                            </div>
                                            <select
                                                id="category"
                                                className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl transition-all duration-200 text-gray-900 font-medium appearance-none bg-white cursor-pointer"
                                                value={createForm.data.category}
                                                onChange={e => createForm.setData('category', e.target.value)}
                                            >
                                                <option value="">Select Category</option>
                                                {localMedicineCategories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                                <i className="bi bi-chevron-down text-gray-400"></i>
                                            </div>
                                        </div>
                                        {createForm.errors.category && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                                <i className="bi bi-exclamation-circle-fill"></i>
                                                {createForm.errors.category}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Pricing & Stock */}
                            <div className="relative bg-white rounded-2xl p-5 shadow-lg border-2 border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-xl">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg">
                                    <span className="text-xs font-bold text-white">STEP 2</span>
                                </div>
                                <div className="flex items-center gap-3 mb-5 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                        <i className="bi bi-cash-coin text-white text-lg"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Pricing & Stock</h3>
                                        <p className="text-xs text-gray-500">Set prices and inventory levels</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Cost Price */}
                                    <div>
                                        <InputLabel htmlFor="cost" value="Cost Price (₦)" className="text-sm font-semibold text-gray-700" />
                                        <TextInput
                                            id="cost"
                                            type="number"
                                            step="0.01"
                                            className="mt-2 block w-full"
                                            value={createForm.data.cost}
                                            onChange={e => createForm.setData('cost', e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <InputError className="mt-2" message={createForm.errors.cost} />
                                    </div>

                                    {/* Selling Price */}
                                    <div>
                                        <InputLabel htmlFor="price" value="Selling Price (₦) *" className="text-sm font-semibold text-gray-700" />
                                        <TextInput
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            className="mt-2 block w-full"
                                            value={createForm.data.price}
                                            onChange={e => createForm.setData('price', e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                        <InputError className="mt-2" message={createForm.errors.price} />
                                    </div>

                                    {/* Stock Quantity */}
                                    <div>
                                        <InputLabel htmlFor="stock" value="Stock Quantity *" className="text-sm font-semibold text-gray-700" />
                                        <TextInput
                                            id="stock"
                                            type="number"
                                            className="mt-2 block w-full"
                                            value={createForm.data.stock}
                                            onChange={e => createForm.setData('stock', e.target.value)}
                                            placeholder="0"
                                            required
                                        />
                                        <InputError className="mt-2" message={createForm.errors.stock} />
                                    </div>

                                    {/* Reorder Level */}
                                    <div>
                                        <InputLabel htmlFor="min_stock" value="Reorder Level" className="text-sm font-semibold text-gray-700" />
                                        <TextInput
                                            id="min_stock"
                                            type="number"
                                            className="mt-2 block w-full"
                                            value={createForm.data.min_stock}
                                            onChange={e => createForm.setData('min_stock', e.target.value)}
                                            placeholder="10"
                                        />
                                        <InputError className="mt-2" message={createForm.errors.min_stock} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Additional Details */}
                            <div className="relative bg-white rounded-2xl p-5 shadow-lg border-2 border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-xl">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-lg">
                                    <span className="text-xs font-bold text-white">STEP 3</span>
                                </div>
                                <div className="flex items-center gap-3 mb-5 mt-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <i className="bi bi-info-circle text-white text-lg"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Additional Details</h3>
                                        <p className="text-xs text-gray-500">Optional information and notes</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Batch Number */}
                                    <div>
                                        <InputLabel htmlFor="batch_number" value="Batch Number" className="text-sm font-semibold text-gray-700" />
                                        <TextInput
                                            id="batch_number"
                                            className="mt-2 block w-full"
                                            value={createForm.data.batch_number}
                                            onChange={e => createForm.setData('batch_number', e.target.value)}
                                            placeholder="e.g., BATCH-2024-001"
                                        />
                                        <InputError className="mt-2" message={createForm.errors.batch_number} />
                                    </div>

                                    {/* Expiry Date */}
                                    <div>
                                        <InputLabel htmlFor="expiry_date" value="Expiry Date" className="text-sm font-semibold text-gray-700" />
                                        <TextInput
                                            id="expiry_date"
                                            type="date"
                                            className="mt-2 block w-full"
                                            value={createForm.data.expiry_date}
                                            onChange={e => createForm.setData('expiry_date', e.target.value)}
                                        />
                                        <InputError className="mt-2" message={createForm.errors.expiry_date} />
                                    </div>

                                    {/* Supplier */}
                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="supplier" value="Supplier" className="text-sm font-semibold text-gray-700" />
                                        <TextInput
                                            id="supplier"
                                            className="mt-2 block w-full"
                                            value={createForm.data.supplier}
                                            onChange={e => createForm.setData('supplier', e.target.value)}
                                            placeholder="Supplier name"
                                        />
                                        <InputError className="mt-2" message={createForm.errors.supplier} />
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="description" value="Description" className="text-sm font-semibold text-gray-700" />
                                        <textarea
                                            id="description"
                                            className="mt-2 block w-full border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg"
                                            rows="3"
                                            value={createForm.data.description}
                                            onChange={e => createForm.setData('description', e.target.value)}
                                            placeholder="Additional notes or description..."
                                        />
                                        <InputError className="mt-2" message={createForm.errors.description} />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <i className="bi bi-shield-check text-green-600"></i>
                                    <span className="font-medium">All data is encrypted and secure</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCreateModalClose}
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
                                                Adding Medicine...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-plus-circle mr-2"></i>
                                                Add Medicine
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </Modal>





                {/* Delete Confirm Modal */}
                <Modal show={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
                    <div className="p-6 max-w-md">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-700">
                                <i className="bi bi-trash"></i>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900">Delete medicine</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Are you sure you want to permanently delete
                                    <span className="font-medium text-gray-800"> {selectedItem?.name ?? ''}</span>?
                                </p>
                                {selectedItem?.sku && (
                                    <p className="text-xs text-gray-400 mt-1">SKU: {selectedItem.sku}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton type="button" onClick={() => setIsDeleteOpen(false)}>
                                Cancel
                            </SecondaryButton>
                            <DangerButton onClick={handleDelete}>Yes, delete</DangerButton>
                        </div>
                    </div>
                </Modal>

                {/* View Modal */}
                {/* Professional View Medicine Modal */}
                <Modal
                    show={isViewOpen}
                    onClose={() => {
                        setIsViewOpen(false);
                        clearSelection();
                    }}
                    maxWidth="4xl"
                >
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                        {/* Professional Header with Gradient */}
                        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 relative overflow-hidden">
                            {/* Decorative Background Elements */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
                            </div>

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                        <i className="bi bi-eye text-3xl text-white"></i>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Medicine Details</h2>
                                        <p className="text-blue-100 text-sm mt-1">Complete information and specifications</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsViewOpen(false);
                                        clearSelection();
                                    }}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                                    aria-label="Close"
                                >
                                    <i className="bi bi-x-lg text-xl"></i>
                                </button>
                            </div>
                        </div>

                        {selectedItem ? (
                            <div className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
                                {/* Medicine Name Banner */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedItem.name}</h3>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {selectedItem.brand && (
                                                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                                                        <i className="bi bi-building mr-1"></i>
                                                        {selectedItem.brand}
                                                    </span>
                                                )}
                                                {selectedItem.category && (
                                                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold">
                                                        <i className="bi bi-tag mr-1"></i>
                                                        {selectedItem.category}
                                                    </span>
                                                )}
                                                {selectedItem.sku && (
                                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono">
                                                        SKU: {selectedItem.sku}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Stock Status Badge */}
                                        <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                                            selectedItem.stock === 0
                                                ? 'bg-red-100 text-red-700 border border-red-200'
                                                : selectedItem.stock <= (selectedItem.reorder_level || 10)
                                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                : 'bg-green-100 text-green-700 border border-green-200'
                                        }`}>
                                            {selectedItem.stock === 0 ? '⚠️ Out of Stock' : selectedItem.stock <= (selectedItem.reorder_level || 10) ? '⚡ Low Stock' : '✓ In Stock'}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Stock Information Card */}
                                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                                    <i className="bi bi-box-seam text-green-600"></i>
                                                </div>
                                                <h4 className="text-lg font-semibold text-gray-900">Stock Information</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                                                        <p className={`text-3xl font-bold ${
                                                            selectedItem.stock <= (selectedItem.reorder_level || 10)
                                                                ? 'text-red-600'
                                                                : 'text-green-600'
                                                        }`}>
                                                            {selectedItem.stock}
                                                        </p>
                                                    </div>
                                                    <div className="w-16 h-16 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
                                                        <i className="bi bi-box text-2xl text-white"></i>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">Reorder Level</p>
                                                        <p className="text-lg font-semibold text-gray-900">{selectedItem.reorder_level || 10}</p>
                                                    </div>
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500 mb-1">Unit Type</p>
                                                        <p className="text-lg font-semibold text-gray-900">{selectedItem.unit || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Enhanced Pricing Information Card */}
                                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <i className="bi bi-currency-exchange text-2xl text-blue-600"></i>
                                                <h4 className="text-lg font-black text-gray-900">Pricing Information</h4>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Cost Price */}
                                                {props.canViewCosts && selectedItem.cost_price && (
                                                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                                                        <div className="text-sm text-gray-500 mb-2">Cost Price</div>
                                                        <div className="text-3xl font-bold text-gray-900">
                                                            UGX {Number(selectedItem.cost_price).toLocaleString()}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Selling Price */}
                                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                                    <div className="text-sm text-gray-500 mb-2">Selling Price</div>
                                                    <div className="text-3xl font-bold text-blue-600">
                                                        UGX {Number(selectedItem.selling_price || 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Simple Profit Info */}
                                            {props.canViewCosts && selectedItem.cost_price && selectedItem.selling_price && selectedItem.cost_price > 0 && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            Profit: UGX {(Number(selectedItem.selling_price) - Number(selectedItem.cost_price)).toLocaleString()} per unit
                                                        </span>
                                                        <span className="text-green-600 font-semibold">
                                                            {(((selectedItem.selling_price - selectedItem.cost_price) / selectedItem.cost_price) * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Product Identification Card */}
                                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                    <i className="bi bi-upc-scan text-purple-600"></i>
                                                </div>
                                                <h4 className="text-lg font-semibold text-gray-900">Product Identification</h4>
                                            </div>
                                            <div className="space-y-3">
                                                {selectedItem.batch_number && (
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500 font-medium mb-1">Batch Number</p>
                                                        <p className="text-base font-semibold text-gray-900 font-mono">{selectedItem.batch_number}</p>
                                                    </div>
                                                )}
                                                {selectedItem.barcode && (
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-xs text-gray-500 font-medium mb-1">Barcode</p>
                                                        <p className="text-base font-semibold text-gray-900 font-mono">{selectedItem.barcode}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expiry Information Card */}
                                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                                    <i className="bi bi-calendar-event text-red-600"></i>
                                                </div>
                                                <h4 className="text-lg font-semibold text-gray-900">Expiry Information</h4>
                                            </div>
                                            {selectedItem.expiry_date ? (
                                                <div className={`p-4 rounded-lg border-2 ${
                                                    new Date(selectedItem.expiry_date) < new Date()
                                                        ? 'bg-red-50 border-red-300'
                                                        : new Date(selectedItem.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                                        ? 'bg-orange-50 border-orange-300'
                                                        : 'bg-green-50 border-green-300'
                                                }`}>
                                                    <p className={`text-xs font-medium mb-2 ${
                                                        new Date(selectedItem.expiry_date) < new Date()
                                                            ? 'text-red-600'
                                                            : new Date(selectedItem.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                                            ? 'text-orange-600'
                                                            : 'text-green-600'
                                                    }`}>
                                                        {new Date(selectedItem.expiry_date) < new Date()
                                                            ? '⚠️ EXPIRED'
                                                            : new Date(selectedItem.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                                            ? '⚡ EXPIRING SOON'
                                                            : '✓ VALID'}
                                                    </p>
                                                    <p className={`text-2xl font-bold ${
                                                        new Date(selectedItem.expiry_date) < new Date()
                                                            ? 'text-red-700'
                                                            : new Date(selectedItem.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                                            ? 'text-orange-700'
                                                            : 'text-green-700'
                                                    }`}>
                                                        {new Date(selectedItem.expiry_date).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-2">
                                                        {Math.ceil((new Date(selectedItem.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                                    <p className="text-gray-500">No expiry date set</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Additional Information Card */}
                                        {(selectedItem.description || selectedItem.supplier || selectedItem.requires_prescription) && (
                                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                        <i className="bi bi-info-circle text-indigo-600"></i>
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>
                                                </div>
                                                <div className="space-y-3">
                                                    {selectedItem.requires_prescription && (
                                                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                            <div className="flex items-center gap-2">
                                                                <i className="bi bi-shield-check text-amber-600"></i>
                                                                <p className="text-sm font-semibold text-amber-700">Requires Prescription</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedItem.supplier && (
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                            <p className="text-xs text-gray-500 font-medium mb-1">Supplier</p>
                                                            <p className="text-base font-semibold text-gray-900">{selectedItem.supplier.name || selectedItem.supplier}</p>
                                                        </div>
                                                    )}
                                                    {selectedItem.description && (
                                                        <div className="p-3 bg-gray-50 rounded-lg">
                                                            <p className="text-xs text-gray-500 font-medium mb-2">Description</p>
                                                            <p className="text-sm text-gray-700 leading-relaxed">{selectedItem.description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Timestamps Footer */}
                                <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        {selectedItem.created_at && (
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-calendar-plus"></i>
                                                <span>Created: {new Date(selectedItem.created_at).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedItem.updated_at && (
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-clock-history"></i>
                                                <span>Last Updated: {new Date(selectedItem.updated_at).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i className="bi bi-inbox text-gray-400 text-2xl"></i>
                                </div>
                                <p className="text-gray-500 font-medium">No medicine selected</p>
                            </div>
                        )}

                        {/* Professional Footer Actions */}
                        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                <i className="bi bi-info-circle mr-1"></i>
                                Read-only view
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setIsViewOpen(false);
                                        if (selectedItem) {
                                            openEdit(selectedItem);
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition-all duration-200 flex items-center gap-2"
                                >
                                    <i className="bi bi-pencil"></i>
                                    <span>Edit Medicine</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsViewOpen(false);
                                        clearSelection();
                                    }}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Edit Modal */}
                <Modal show={isEditOpen} onClose={() => setIsEditOpen(false)}>
                    <div className="p-6 max-w-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <i className="bi bi-pencil"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Edit Medicine</h3>
                                    <p className="text-xs text-gray-500">Update details and save changes.</p>
                                </div>
                            </div>
                            <button
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => setIsEditOpen(false)}
                                aria-label="Close"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleEdit} className="space-y-4">
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
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
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

                            <div className="mt-6 flex justify-end gap-3">
                                <SecondaryButton type="button" onClick={() => setIsEditOpen(false)}>
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton disabled={editForm.processing}>Update</PrimaryButton>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* Stock Adjustment Modal */}
                <Modal show={isStockAdjustOpen} onClose={() => setIsStockAdjustOpen(false)}>
                    <div className="p-6 max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                    <i className="bi bi-plus-minus"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Adjust Stock</h3>
                                    <p className="text-xs text-gray-500">
                                        {selectedItem?.name} - Current: {selectedItem?.stock}
                                    </p>
                                </div>
                            </div>
                            <button
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => setIsStockAdjustOpen(false)}
                                aria-label="Close"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!selectedItem) return;

                                let newStock = selectedItem.stock;
                                if (stockAdjustForm.data.adjustment_type === 'add') {
                                    newStock += Number(stockAdjustForm.data.quantity);
                                } else if (stockAdjustForm.data.adjustment_type === 'subtract') {
                                    newStock -= Number(stockAdjustForm.data.quantity);
                                } else if (stockAdjustForm.data.adjustment_type === 'set') {
                                    newStock = Number(stockAdjustForm.data.quantity);
                                }

                                // Update via edit form
                                editForm.setData({
                                    ...selectedItem,
                                    stock: Math.max(0, newStock)
                                });

                                editForm.put(route('medicines.update', selectedItem.id), {
                                    onSuccess: () => {
                                        setIsStockAdjustOpen(false);
                                        // toast.success('Stock adjusted successfully!');
                                    },
                                    onError: () => {
                                        // toast.error('Failed to adjust stock.');
                                    }
                                });
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <InputLabel htmlFor="adjustment_type" value="Adjustment Type" />
                                <select
                                    id="adjustment_type"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={stockAdjustForm.data.adjustment_type}
                                    onChange={e => stockAdjustForm.setData('adjustment_type', e.target.value)}
                                >
                                    <option value="add">Add Stock</option>
                                    <option value="subtract">Remove Stock</option>
                                    <option value="set">Set Exact Amount</option>
                                </select>
                            </div>

                            <div>
                                <InputLabel htmlFor="quantity" value="Quantity" />
                                <TextInput
                                    id="quantity"
                                    type="number"
                                    min="0"
                                    className="mt-1 block w-full"
                                    value={stockAdjustForm.data.quantity}
                                    onChange={e => stockAdjustForm.setData('quantity', Number(e.target.value))}
                                    required
                                />
                                {selectedItem && stockAdjustForm.data.quantity > 0 && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        New stock will be: {
                                            stockAdjustForm.data.adjustment_type === 'add'
                                                ? selectedItem.stock + Number(stockAdjustForm.data.quantity)
                                                : stockAdjustForm.data.adjustment_type === 'subtract'
                                                    ? Math.max(0, selectedItem.stock - Number(stockAdjustForm.data.quantity))
                                                    : Number(stockAdjustForm.data.quantity)
                                        }
                                    </p>
                                )}
                            </div>

                            <div>
                                <InputLabel htmlFor="reason" value="Reason (Optional)" />
                                <textarea
                                    id="reason"
                                    rows="2"
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    value={stockAdjustForm.data.reason}
                                    onChange={e => stockAdjustForm.setData('reason', e.target.value)}
                                    placeholder="e.g., Received new shipment, Damaged goods, etc."
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <SecondaryButton type="button" onClick={() => setIsStockAdjustOpen(false)}>
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton disabled={editForm.processing || !stockAdjustForm.data.quantity}>
                                    Adjust Stock
                                </PrimaryButton>
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
                                    const item = hookMedicines.find(m => m.id === parsed.id);
                                    if (item) {
                                        openView(item);
                                        setScannerOpen(false);
                                        return;
                                    }
                                }
                            }
                        } catch { }
                        // Fallback: filter by code in SKU/batch/name
                        setQuery(String(code));
                    }}
                />
            </div>
        </AuthenticatedLayout>
    );
}
