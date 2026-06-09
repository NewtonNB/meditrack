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
import { useCustomers } from '@/Hooks/useCustomers';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function Customers() {
  const { props } = usePage();
  const serverCustomers = props.customers?.data || [];
  
  // Use shared customer hook
  const { customers, stats, addCustomer, updateCustomer, deleteCustomer, isLoaded } = useCustomers(serverCustomers);
  
  // Customers loaded from server
  React.useEffect(() => {
    // Data loaded successfully
  }, [customers]);

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
    
    createForm.post(route('customers.store'), {
      onSuccess: () => {
        setIsCreateOpen(false);
        createForm.reset();
      },
      onError: (errors) => {
        console.error('Create customer errors:', errors);
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
    
    // Use shared hook to delete customer
    deleteCustomer(selectedId);
    
    // Close modal
    setIsDeleteOpen(false);
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
    
    editForm.put(route('customers.update', selectedItem.id), {
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedItem(null);
        editForm.reset();
      },
      onError: (errors) => {
        console.error('Edit customer errors:', errors);
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
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = customers.filter(c => {
      if (!q) return true;
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    });
    return list;
  }, [customers, query]);

  const paged = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  // Use real-time updates hook
  useRealTimeUpdates({
    pageName: 'customers',
    dataKeys: ['customers'],
    onUpdate: (eventType, data) => {
      console.log(`Customers page updated due to: ${eventType}`, JSON.stringify(data));
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
      header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Customers</h2>}
    >
      <Head>
        <title>Customers</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div 
        className="min-h-screen bg-slate-50 transition-all duration-500"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="relative z-10 p-4 sm:p-6">
        {/* Modern Header */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <i className="bi bi-people-fill text-xl text-blue-600"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Customer Management
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage customer records, track relationships, and maintain contact information
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                    <i className="bi bi-check-circle-fill text-xs"></i>
                    <span className="text-xs font-medium">Database Active</span>
                  </div>
                  <div className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    <span className="text-xs font-medium">Total: {stats.total} customers</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              {/* Setup simple standard buttons and inputs */}
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search name, phone or email..."
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full md:w-64 pr-10 pl-4 py-2 rounded-md border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <i className="bi bi-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              </div>

              {/* Dark Mode Toggle - Hidden or stylized smaller since system prefers standard light */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="hidden"
              >
                Toggle Dark Mode
              </button>
              
              {/* Export Button */}
              <button
                onClick={() => exportCSV(filtered)}
                className="px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium flex items-center"
              >
                <i className="bi bi-download mr-2"></i>Export CSV
              </button>
              
              {/* Add Customer Button */}
              <button
                onClick={() => {
                  createForm.reset();
                  setIsCreateOpen(true);
                }}
                className="px-4 py-2 rounded-md bg-blue-600 border border-transparent text-white hover:bg-blue-700 transition-colors text-sm font-medium flex items-center shadow-sm"
              >
                <i className="bi bi-person-plus mr-2"></i>Add Customer
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Customers */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Customers</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
              <p className="text-xs text-slate-400 mt-0.5">Registered</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
              <i className="bi bi-people text-xl text-blue-600"></i>
            </div>
          </div>

          {/* Active This Month */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Active This Month</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.newThisMonth}</p>
              <p className="text-xs text-slate-400 mt-0.5">New customers</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
              <i className="bi bi-person-check text-xl text-green-600"></i>
            </div>
          </div>

          {/* With Email */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">With Email</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.withEmail}</p>
              <p className="text-xs text-slate-400 mt-0.5">Email contacts</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
              <i className="bi bi-envelope text-xl text-purple-600"></i>
            </div>
          </div>

          {/* With Phone */}
          <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">With Phone</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.withPhone}</p>
              <p className="text-xs text-slate-400 mt-0.5">Phone contacts</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
              <i className="bi bi-telephone text-xl text-orange-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-medium text-gray-800">
                {filtered.length === 0
                  ? 0
                  : Math.min(perPage, filtered.length - (page - 1) * perPage)}
              </span>{' '}
              of <span className="font-medium text-gray-800">{filtered.length}</span> customers
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
            <table className="min-w-full divide-y divide-slate-200 mt-4">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className={`px-6 py-4 text-left text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} uppercase`}>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-person text-sm"></i>
                      <span>Customer</span>
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
              <tbody className="bg-white divide-y divide-slate-200">
                {!isLoaded ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 font-medium">Loading customers...</span>
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <i className="bi bi-people text-4xl text-gray-300 mb-4"></i>
                        <p className="text-lg font-medium mb-2">No customers found</p>
                        <p className="text-sm">
                          {query ? 'Try adjusting your search criteria.' : 'Add your first customer to get started.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paged.map(cust => {
                  const initials = cust.name ? cust.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
                  const hasEmail = cust.email && cust.email.trim();
                  const hasPhone = cust.phone && cust.phone.trim();
                  
                  return (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                    {/* Customer Name with Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
                          <span className="text-xs font-bold text-blue-600">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {cust.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            ID: #{cust.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasPhone ? (
                        <div className="flex items-center gap-2 text-slate-700 text-sm">
                          <i className="bi bi-telephone text-slate-400"></i>
                          <span>{cust.phone}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">No phone</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasEmail ? (
                        <div className="flex items-center gap-2 text-slate-700 text-sm">
                          <i className="bi bi-envelope text-slate-400"></i>
                          <span>{cust.email}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">No email</span>
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
                          onClick={() => openView(cust)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                          title="View details"
                        >
                          <i className="bi bi-eye"></i>
                          View
                        </button>
                        <button
                          onClick={() => openEdit(cust)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                          title="Edit customer"
                        >
                          <i className="bi bi-pencil"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(cust.id, cust)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded hover:bg-red-50 text-red-600 border border-red-200 transition-colors"
                          title="Delete customer"
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
                  <h3 className="text-lg font-medium text-gray-900">Add Customer</h3>
                  <p className="text-xs text-gray-500">Create a new customer record.</p>
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
                  <h3 className="text-lg font-medium text-gray-900">Customer Details</h3>
                  <p className="text-xs text-gray-500">Read-only view of the customer.</p>
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
              <div className="text-sm text-gray-500">No customer selected.</div>
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

        {/* Enhanced Edit Customer Modal */}
        <Modal show={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidth="3xl">
          <div className="relative bg-white overflow-hidden rounded-xl">
            {/* Modal Header */}
            <div className="relative px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Edit Customer</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Update customer information and details
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                onClick={() => setIsEditOpen(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {selectedItem && (
              <form onSubmit={handleEdit} noValidate className="relative p-6 space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* Personal Information Section */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                      <i className="bi bi-person text-blue-600 text-lg"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Personal Information</h4>
                      <p className="text-xs text-gray-500">Basic customer details</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit_name" className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="edit_name"
                          type="text"
                          className="block w-full px-3 py-2 border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md text-sm text-slate-900"
                          value={editForm.data.name}
                          onChange={e => editForm.setData('name', e.target.value)}
                          placeholder="Enter customer's full name"
                          required
                        />
                      </div>
                      {editForm.errors.name && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill"></i>
                          {editForm.errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="edit_phone" className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          id="edit_phone"
                          type="tel"
                          className="block w-full px-3 py-2 border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md text-sm text-slate-900"
                          value={editForm.data.phone}
                          onChange={e => editForm.setData('phone', e.target.value)}
                          placeholder="0700123456"
                        />
                      </div>
                      {editForm.errors.phone && (
                        <p className="mt-1 text-xs text-red-600">
                          {editForm.errors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                      <i className="bi bi-envelope text-blue-600 text-lg"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Contact Information</h4>
                      <p className="text-xs text-gray-500">Email and address details</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit_email" className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          id="edit_email"
                          type="email"
                          className="block w-full px-3 py-2 border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md text-sm text-slate-900"
                          value={editForm.data.email}
                          onChange={e => editForm.setData('email', e.target.value)}
                          placeholder="customer@example.com"
                        />
                      </div>
                      {editForm.errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                          {editForm.errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="edit_address" className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                        Address
                      </label>
                      <div className="relative">
                        <textarea
                          id="edit_address"
                          rows="3"
                          className="block w-full px-3 py-2 border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md text-sm text-slate-900 resize-none"
                          value={editForm.data.address}
                          onChange={e => editForm.setData('address', e.target.value)}
                          placeholder="Enter customer's address..."
                        />
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
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editForm.processing}
                    className="px-4 py-2 bg-blue-600 border border-transparent text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {editForm.processing ? 'Updating...' : 'Update Customer'}
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
                <h3 className="text-lg font-medium text-gray-900">Delete customer</h3>
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
