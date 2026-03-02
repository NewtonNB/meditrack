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
import { useRealTimeUpdates } from '@/Hooks/useRealTimeUpdates';
import PageHeader from '@/Components/PageHeader';
import Card from '@/Components/Card';
import { useSuppliers } from '@/Hooks/useSuppliers';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Suppliers() {
  const { props } = usePage();
  const serverSuppliers = props.suppliers?.data || [];
  
  // Local state for suppliers
  const [suppliers, setSuppliers] = React.useState(serverSuppliers);
  
  // Calculate stats
  const stats = React.useMemo(() => {
    const total = suppliers.length;
    const thisMonth = suppliers.filter(s => {
      const created = new Date(s.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    
    return {
      total,
      active: total,
      thisMonth,
      avgPerMonth: Math.round(total / 12)
    };
  }, [suppliers]);
  
  // Update suppliers when server data changes
  React.useEffect(() => {
    if (serverSuppliers.length > 0) {
      setSuppliers(serverSuppliers);
    }
  }, [serverSuppliers]);

  const [query, setQuery] = React.useState('');
  const [perPage, setPerPage] = React.useState(10);
  const [page, setPage] = React.useState(1);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedItem, setSelectedItem] = React.useState(null);

  const createForm = useForm({
    name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    address: '',
    gender: '',
    notes: '',
  });
  
  const editForm = useForm({
    name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    address: '',
    gender: '',
    notes: '',
  });

  const handleCreate = e => {
    e.preventDefault();
    
    createForm.post(route('suppliers.store'), {
      onSuccess: () => {
        setIsCreateOpen(false);
        createForm.reset();
      },
      onError: (errors) => {
        console.error('Create Supplier errors:', errors);
      }
    });
  };

  const openDelete = (id, item = null) => {
    setSelectedId(id);
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };
  const handleDelete = () => {
    if (!selectedId) return;
    
    router.delete(route('suppliers.destroy', selectedId), {
      preserveScroll: true,
      onSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedId(null);
        setSelectedItem(null);
      },
      onError: (errors) => {
        console.error('Delete supplier errors:', errors);
      }
    });
  };

  const openView = item => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };
  const openEdit = item => {
    setSelectedItem(item);
    editForm.setData({
      name: item.name || '',
      phone: item.phone || '',
      email: item.email || '',
      date_of_birth: item.date_of_birth || '',
      address: item.address || '',
      gender: item.gender || '',
      notes: item.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleEdit = e => {
    e.preventDefault();
    if (!selectedItem) return;
    
    editForm.put(route('suppliers.update', selectedItem.id), {
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedItem(null);
        editForm.reset();
      },
      onError: (errors) => {
        console.error('Edit supplier errors:', errors);
      }
    });
  };

  const exportCSV = list => {
    const headers = ['Name', 'Phone', 'Email', 'Created'];
    const rows = list.map(c => [c.name, c.phone, c.email, c.created_at ?? '']);
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
    a.download = 'Suppliers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = suppliers.filter(c => {
      if (!q) return true;
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    });
    return list;
  }, [suppliers, query]);

  const paged = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  // Use real-time updates hook
  useRealTimeUpdates({
    pageName: 'Suppliers',
    dataKeys: ['Suppliers'],
    onUpdate: (eventType, data) => {
      console.log(`Suppliers page updated due to: ${eventType}`, JSON.stringify(data));
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

  return (
    <AuthenticatedLayout
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Suppliers</h2>}
    >
      <Head>
        <title>Suppliers</title>
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
          <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-200/30'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute top-3/4 right-1/4 w-96 h-96 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-200/30'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
          <div className={`absolute top-1/2 left-1/2 w-80 h-80 ${darkMode ? 'bg-purple-500/10' : 'bg-purple-200/30'} rounded-full blur-3xl animate-pulse delay-500`}></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6">
        {/* Modern Header */}
        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 mb-8 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-accent-400 to-primary-500' : 'bg-gradient-to-br from-accent-400 to-primary-500'} flex items-center justify-center shadow-lg`}>
                <i className="bi bi-building text-2xl text-white"></i>
              </div>
              <div>
                <h1 className={`text-4xl font-black ${darkMode ? 'bg-gradient-to-r from-accent-400 to-primary-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent'}`}>
                  Supplier Management
                </h1>
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                  Manage Supplier records, track relationships, and maintain contact information
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                    <i className="bi bi-check-circle-fill"></i>
                    <span className="text-sm font-medium">Database Active</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <span className="text-sm">Total: {stats.total} Suppliers</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search name, phone or email..."
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className={`w-64 pr-10 pl-3 py-2 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-600/50 text-gray-200 placeholder-gray-400' : 'bg-white/50 border-gray-200/50 text-gray-800'} shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200`}
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
                onClick={() => exportCSV(filtered)}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  darkMode 
                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                <i className="bi bi-download mr-2"></i>Export CSV
              </button>
              
              {/* Add Supplier Button */}
              <button
                onClick={() => {
                  createForm.reset();
                  setIsCreateOpen(true);
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  darkMode 
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <i className="bi bi-person-plus mr-2"></i>Add Supplier
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Suppliers */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-accent-500/20 to-accent-600/20 border-accent-400/30' : 'bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Total Suppliers</p>
                <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-blue-200' : 'text-blue-500'}`}>Registered</p>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-blue-500/30' : 'bg-blue-500'} flex items-center justify-center shadow-lg`}>
                <i className="bi bi-people text-2xl text-white"></i>
              </div>
            </div>
          </div>

          {/* Active This Month */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/30' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-green-300' : 'text-green-600'}`}>Active This Month</p>
                <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.newThisMonth}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-green-200' : 'text-green-500'}`}>New Suppliers</p>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-green-500/30' : 'bg-green-500'} flex items-center justify-center shadow-lg`}>
                <i className="bi bi-person-check text-2xl text-white"></i>
              </div>
            </div>
          </div>

          {/* With Email */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-primary-400/30' : 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>With Email</p>
                <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.withEmail}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-purple-200' : 'text-purple-500'}`}>Email contacts</p>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-purple-500/30' : 'bg-purple-500'} flex items-center justify-center shadow-lg`}>
                <i className="bi bi-envelope text-2xl text-white"></i>
              </div>
            </div>
          </div>

          {/* With Phone */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-400/30' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>With Phone</p>
                <p className={`text-3xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.withPhone}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-orange-200' : 'text-orange-500'}`}>Phone contacts</p>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-orange-500/30' : 'bg-orange-500'} flex items-center justify-center shadow-lg`}>
                <i className="bi bi-telephone text-2xl text-white"></i>
              </div>
            </div>
          </div>
        </div>

        <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl overflow-hidden`}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-medium text-gray-800">
                {filtered.length === 0
                  ? 0
                  : Math.min(perPage, filtered.length - (page - 1) * perPage)}
              </span>{' '}
              of <span className="font-medium text-gray-800">{filtered.length}</span> Suppliers
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500">Per page</label>
              <select
                value={perPage}
                onChange={e => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="text-sm border rounded px-2 py-1"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-50/80'} sticky top-0 backdrop-blur-sm`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-person text-sm"></i>
                      <span>Supplier</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-telephone text-sm"></i>
                      <span>Phone</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-envelope text-sm"></i>
                      <span>Email</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-calendar-event text-sm"></i>
                      <span>Joined</span>
                    </div>
                  </th>
                  <th className={`px-6 py-4 text-right text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                    <div className="flex items-center justify-end gap-2">
                      <i className="bi bi-gear text-sm"></i>
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-800/50' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <i className="bi bi-people text-4xl text-gray-300 mb-4"></i>
                        <p className="text-lg font-medium mb-2">No Suppliers found</p>
                        <p className="text-sm">
                          {query ? 'Try adjusting your search criteria.' : 'Add your first Supplier to get started.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paged.map(cust => {
                  const initials = cust.name ? cust.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
                  const hasEmail = cust.email && cust.email.trim();
                  const hasPhone = cust.phone && cust.phone.trim();
                  
                  return (
                  <tr key={cust.id} className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/50'} transition-all duration-200`}>
                    {/* Supplier Name with Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-sm font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                            {cust.name}
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                            ID: #{cust.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4">
                      {hasPhone ? (
                        <div className="flex items-center gap-2">
                          <i className={`bi bi-telephone-fill text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}></i>
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>{cust.phone}</span>
                        </div>
                      ) : (
                        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No phone</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      {hasEmail ? (
                        <div className="flex items-center gap-2">
                          <i className={`bi bi-envelope-fill text-sm ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}></i>
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{cust.email}</span>
                        </div>
                      ) : (
                        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No email</span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                        <i className="bi bi-calendar-check"></i>
                        {cust.created_at ? new Date(cust.created_at).toLocaleDateString() : '-'}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.visit(`/purchases?supplier=${cust.id}`)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                            darkMode 
                              ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-400/30' 
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                          }`}
                          title="View purchase orders"
                        >
                          <i className="bi bi-cart3"></i>
                          Orders
                        </button>
                        <button
                          onClick={() => openView(cust)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                            darkMode 
                              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-400/30' 
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                          title="View details"
                        >
                          <i className="bi bi-eye"></i>
                          View
                        </button>
                        <button
                          onClick={() => openEdit(cust)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                            darkMode 
                              ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-400/30' 
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                          title="Edit Supplier"
                        >
                          <i className="bi bi-pencil"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(cust.id, cust)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                            darkMode 
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-400/30' 
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          }`}
                          title="Delete Supplier"
                        >
                          <i className="bi bi-trash"></i>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Simple pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} / {Math.max(1, Math.ceil(filtered.length / perPage))}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50"
                onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / perPage), p + 1))}
                disabled={page >= Math.ceil(filtered.length / perPage)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Create Modal */}
        <Modal show={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
          <div className="p-6 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <i className="bi bi-person-plus"></i>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Add Supplier</h3>
                  <p className="text-xs text-gray-500">Create a new Supplier record.</p>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <InputLabel htmlFor="name" value="Name" />
                <TextInput
                  id="name"
                  className="mt-1 block w-full"
                  value={createForm.data.name}
                  onChange={e => createForm.setData('name', e.target.value)}
                />
                <InputError className="mt-2" message={createForm.errors.name} />
              </div>
              <div>
                <InputLabel htmlFor="phone" value="Phone" />
                <TextInput
                  id="phone"
                  className="mt-1 block w-full"
                  value={createForm.data.phone}
                  onChange={e => createForm.setData('phone', e.target.value)}
                />
                <InputError className="mt-2" message={createForm.errors.phone} />
              </div>
              <div>
                <InputLabel htmlFor="email" value="Email" />
                <TextInput
                  id="email"
                  type="email"
                  className="mt-1 block w-full"
                  value={createForm.data.email}
                  onChange={e => createForm.setData('email', e.target.value)}
                />
                <InputError className="mt-2" message={createForm.errors.email} />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <SecondaryButton type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton disabled={createForm.processing}>Save</PrimaryButton>
              </div>
            </form>
          </div>
        </Modal>

        {/* View Modal */}
        <Modal
          show={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setSelectedItem(null);
          }}
        >
          <div className="p-6 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <i className="bi bi-person-lines-fill"></i>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Supplier Details</h3>
                  <p className="text-xs text-gray-500">Read-only view of the Supplier.</p>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setIsViewOpen(false);
                  setSelectedItem(null);
                }}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {selectedItem ? (
              <div className="space-y-3 text-gray-700">
                <div>
                  <div className="text-xs text-gray-500">Name</div>
                  <div className="font-medium text-gray-800">{selectedItem.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="font-medium text-gray-800">{selectedItem.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="font-medium text-gray-800">{selectedItem.email}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {selectedItem.created_at
                    ? `Joined ${new Date(selectedItem.created_at).toLocaleDateString()}`
                    : ''}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No Supplier selected.</div>
            )}

            <div className="mt-6 flex justify-end">
              <SecondaryButton
                type="button"
                onClick={() => {
                  setIsViewOpen(false);
                  setSelectedItem(null);
                }}
              >
                Close
              </SecondaryButton>
            </div>
          </div>
        </Modal>

        {/* Enhanced Edit Supplier Modal */}
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
                      <i className="bi bi-person-gear text-3xl text-white"></i>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                      <i className="bi bi-pencil-fill text-xs text-white"></i>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white drop-shadow-lg">Edit Supplier</h2>
                    <p className="text-sm text-blue-50 mt-1 font-medium flex items-center gap-2">
                      <i className="bi bi-info-circle"></i>
                      Update Supplier information and details
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

            {selectedItem && (
              <form onSubmit={handleEdit} noValidate className="relative p-6 space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* Personal Information Section */}
                <div className="relative bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl p-6 shadow-lg border-2 border-accent-200 hover:border-accent-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-person-circle text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Personal Information</h4>
                      <p className="text-xs text-gray-600">Basic Supplier details</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="edit_name" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-asterisk text-red-500 text-xs"></i>
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          id="edit_name"
                          type="text"
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200 text-gray-900 font-medium"
                          value={editForm.data.name}
                          onChange={e => editForm.setData('name', e.target.value)}
                          placeholder="Enter Supplier's full name"
                          required
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-person text-gray-400"></i>
                        </div>
                      </div>
                      {editForm.errors.name && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="edit_phone" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-telephone text-blue-500"></i>
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          id="edit_phone"
                          type="tel"
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-200 text-gray-900 font-medium"
                          value={editForm.data.phone}
                          onChange={e => editForm.setData('phone', e.target.value)}
                          placeholder="0700123456"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-telephone text-gray-400"></i>
                        </div>
                      </div>
                      {editForm.errors.phone && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border-2 border-green-200 hover:border-green-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <i className="bi bi-envelope-at text-white text-xl"></i>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Contact Information</h4>
                      <p className="text-xs text-gray-600">Email and address details</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="edit_email" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-envelope text-green-500"></i>
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          id="edit_email"
                          type="email"
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl transition-all duration-200 text-gray-900 font-medium"
                          value={editForm.data.email}
                          onChange={e => editForm.setData('email', e.target.value)}
                          placeholder="Supplier@example.com"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-envelope text-gray-400"></i>
                        </div>
                      </div>
                      {editForm.errors.email && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="edit_address" className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                        <i className="bi bi-geo-alt text-green-500"></i>
                        Address
                      </label>
                      <div className="relative">
                        <textarea
                          id="edit_address"
                          rows="3"
                          className="block w-full pl-12 pr-4 py-3 border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 rounded-xl transition-all duration-200 text-gray-900 resize-none"
                          value={editForm.data.address}
                          onChange={e => editForm.setData('address', e.target.value)}
                          placeholder="Enter Supplier's address..."
                        />
                        <div className="absolute top-3 left-0 flex items-center pl-4 pointer-events-none">
                          <i className="bi bi-geo-alt text-gray-400"></i>
                        </div>
                      </div>
                      {editForm.errors.address && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-200">
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
                    {editForm.processing ? (
                      <>
                        <i className="bi bi-arrow-clockwise animate-spin"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i>
                        Update Supplier
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
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
                <h3 className="text-lg font-medium text-gray-900">Delete Supplier</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-medium text-gray-800">{selectedItem?.name ?? ''}</span>?
                </p>
                {selectedItem?.email && (
                  <p className="text-xs text-gray-400 mt-1">Email: {selectedItem.email}</p>
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
