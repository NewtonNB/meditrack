import React, { useState } from 'react';
import { Head, usePage, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function DatabaseBrowser() {
  const { props } = usePage();
  
  // Permission checks - only super admins should access this
  const userRole = props.auth?.user?.role || 'cashier';
  const canAccessDatabase = userRole === 'super_admin';
  
  const [selectedTable, setSelectedTable] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    // Auto-refresh data every 30 seconds
    const interval = setInterval(() => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1000);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Available tables in the system
  const databaseTables = [
    { name: 'users', description: 'System users and authentication' },
    { name: 'medicines', description: 'Medicine inventory and details' },
    { name: 'sales', description: 'Sales transactions and records' },
    { name: 'stock_movements', description: 'Inventory movements and adjustments' },
    { name: 'customers', description: 'Customer information and profiles' },
    { name: 'suppliers', description: 'Supplier contacts and details' },
    { name: 'pharmacies', description: 'Pharmacy branches and locations' },
    { name: 'categories', description: 'Medicine categories and classifications' },
    { name: 'prescriptions', description: 'Medical prescriptions and orders' },
    { name: 'audit_logs', description: 'System activity and change tracking' },
    { name: 'sessions', description: 'User sessions and authentication tokens' },
    { name: 'migrations', description: 'Database schema version control' },
    { name: 'failed_jobs', description: 'Failed background job queue' },
    { name: 'password_resets', description: 'Password reset tokens' },
    { name: 'personal_access_tokens', description: 'API access tokens' }
  ];

  // Sample data for demonstration - in real app this would come from backend
  const sampleTableData = {
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'pharmacist', created_at: '2024-01-15' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'cashier', created_at: '2024-01-20' },
      { id: 3, name: 'Admin User', email: 'admin@example.com', role: 'super_admin', created_at: '2024-01-01' }
    ],
    medicines: [
      { id: 1, name: 'Paracetamol 500mg', brand: 'GSK', stock: 100, price: 2000, expiry_date: '2026-12-31' },
      { id: 2, name: 'Ibuprofen 400mg', brand: 'Pfizer', stock: 80, price: 2500, expiry_date: '2025-08-15' },
      { id: 3, name: 'Amoxicillin 250mg', brand: 'Cipla', stock: 50, price: 3000, expiry_date: '2025-06-30' }
    ],
    sales: [
      { id: 1, customer: 'John Doe', medicine_id: 1, quantity: 2, total: 4000, date: '2024-11-01' },
      { id: 2, customer: 'Jane Smith', medicine_id: 2, quantity: 1, total: 2500, date: '2024-11-01' },
      { id: 3, customer: 'Bob Wilson', medicine_id: 3, quantity: 3, total: 9000, date: '2024-10-31' }
    ]
  };

  const queryForm = useForm({
    query: '',
    table: ''
  });

  const handleTableSelect = (tableName) => {
    setSelectedTable(tableName);
    setQueryResults(sampleTableData[tableName] || []);
  };

  const executeQuery = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate query execution
    setTimeout(() => {
      // In real app, this would send the query to backend
      console.log('Executing query:', queryForm.data.query);
      
      // For demo, return sample data based on query
      if (queryForm.data.query.toLowerCase().includes('select')) {
        setQueryResults(sampleTableData[queryForm.data.table] || []);
      } else {
        setQueryResults([{ message: 'Query executed successfully', affected_rows: 1 }]);
      }
      
      setLoading(false);
      setIsQueryModalOpen(false);
    }, 1000);
  };

  const exportTableData = (tableName) => {
    const data = sampleTableData[tableName] || [];
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [headers, ...data.map(row => headers.map(header => row[header]))]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canAccessDatabase) {
    return (
      <AuthenticatedLayout
        header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Database Browser</h2>}
      >
        <Head title="Database Browser" />
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <i className="bi bi-shield-exclamation text-red-600 text-2xl mr-4"></i>
                <div>
                  <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
                  <p className="text-red-700 mt-2">
                    Database Browser access is restricted to Super Administrators only.
                    This is a high-security area that requires the highest level of permissions.
                  </p>
                  <p className="text-sm text-red-600 mt-2">Current role: {userRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Database Browser</h2>}
    >
      <Head title="Database Browser" />

      <div 
        className={`min-h-screen transition-all duration-500 ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900' 
            : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50'
        }`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Floating Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${darkMode ? 'bg-purple-500/10' : 'bg-purple-200/30'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute top-3/4 right-1/4 w-96 h-96 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-200/30'} rounded-full blur-3xl animate-pulse delay-1000`}></div>
          <div className={`absolute top-1/2 left-1/2 w-80 h-80 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-200/30'} rounded-full blur-3xl animate-pulse delay-500`}></div>
        </div>

        <div className="relative z-10 py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Modern Header */}
          <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 mb-8 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-purple-400 to-indigo-500' : 'bg-gradient-to-br from-purple-400 to-indigo-500'} flex items-center justify-center shadow-lg`}>
                  <i className="bi bi-database text-2xl text-white"></i>
                </div>
                <div>
                  <h1 className={`text-4xl font-black ${darkMode ? 'bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'}`}>
                    Database Browser
                  </h1>
                  <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-2`}>
                    Direct database access, query execution, and data management
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
                      <i className="bi bi-shield-exclamation"></i>
                      <span className="text-sm font-medium">Super Admin Only</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      <span className="text-sm">High Security Zone</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
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
                
                {/* Custom Query Button */}
                <button
                  onClick={() => setIsQueryModalOpen(true)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    darkMode 
                      ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  <i className="bi bi-code-slash mr-2"></i>Custom Query
                </button>
                
                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Connected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle text-yellow-600 mr-3"></i>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Caution: Direct Database Access</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  You have direct access to the database. Be extremely careful with queries that modify data (UPDATE, DELETE, DROP).
                  Always backup before making changes.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Modern Tables List */}
            <div className={`backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Database Tables</h3>
              <div className="space-y-3">
                {databaseTables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => handleTableSelect(table.name)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedTable === table.name
                        ? (darkMode ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700')
                        : (darkMode ? 'bg-gray-700/30 border-gray-600/30 hover:bg-gray-600/30 text-gray-300' : 'bg-gray-50/50 border-gray-200/50 hover:bg-gray-100/50 text-gray-700')
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-2">
                      <i className="bi bi-table text-sm"></i>
                      {table.name}
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{table.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modern Table Data */}
            <div className={`lg:col-span-2 backdrop-blur-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white/30'} rounded-2xl p-6 border ${darkMode ? 'border-gray-700/50' : 'border-white/50'} shadow-xl`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedTable ? `Table: ${selectedTable}` : 'Select a table to view data'}
                </h3>
                {selectedTable && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => exportTableData(selectedTable)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        darkMode 
                          ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <i className="bi bi-download mr-2"></i>Export
                    </button>
                    <button
                      onClick={() => handleTableSelect(selectedTable)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        darkMode 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      <i className="bi bi-arrow-clockwise mr-2"></i>Refresh
                    </button>
                  </div>
                )}
              </div>

              {queryResults ? (
                <div className="overflow-x-auto">
                  {queryResults.length > 0 ? (
                    <div className={`rounded-xl border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'} overflow-hidden`}>
                      <table className="min-w-full">
                        <thead className={`${darkMode ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20' : 'bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
                          <tr>
                            {Object.keys(queryResults[0]).map((header) => (
                              <th
                                key={header}
                                className={`px-6 py-4 text-left text-xs font-bold ${darkMode ? 'text-purple-400' : 'text-purple-700'} uppercase tracking-wider`}
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                          {queryResults.map((row, index) => (
                            <tr key={index} className={`transition-colors hover:${darkMode ? 'bg-gray-700/30' : 'bg-purple-50/50'}`}>
                              {Object.values(row).map((value, cellIndex) => (
                                <td key={cellIndex} className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <i className={`bi bi-inbox text-4xl ${darkMode ? 'text-gray-600' : 'text-gray-300'} mb-4`}></i>
                      <p className="text-lg font-medium mb-2">No data found</p>
                      <p className="text-sm">This table appears to be empty</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <i className={`bi bi-table text-6xl ${darkMode ? 'text-gray-600' : 'text-gray-300'} mb-6`}></i>
                  <p className="text-xl font-medium mb-2">Select a table to explore</p>
                  <p className="text-sm">Choose from the available database tables on the left</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

        {/* Custom Query Modal */}
        <Modal show={isQueryModalOpen} onClose={() => setIsQueryModalOpen(false)}>
          <div className="p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <i className="bi bi-code-slash"></i>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Execute Custom Query</h3>
                  <p className="text-xs text-gray-500">Run SQL queries directly on the database.</p>
                </div>
              </div>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setIsQueryModalOpen(false)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={executeQuery} className="space-y-4">
              <div>
                <InputLabel htmlFor="table" value="Target Table (Optional)" />
                <select
                  id="table"
                  className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                  value={queryForm.data.table}
                  onChange={e => queryForm.setData('table', e.target.value)}
                >
                  <option value="">Select table (optional)</option>
                  {databaseTables.map((table) => (
                    <option key={table.name} value={table.name}>
                      {table.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <InputLabel htmlFor="query" value="SQL Query" />
                <textarea
                  id="query"
                  rows="6"
                  className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm font-mono text-sm"
                  value={queryForm.data.query}
                  onChange={e => queryForm.setData('query', e.target.value)}
                  placeholder="SELECT * FROM users WHERE role = 'pharmacist';"
                  required
                />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <i className="bi bi-exclamation-triangle text-red-600 mr-2"></i>
                  <div className="text-sm text-red-700">
                    <strong>Warning:</strong> Be extremely careful with UPDATE, DELETE, and DROP statements.
                    These operations can permanently modify or destroy data.
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <SecondaryButton type="button" onClick={() => setIsQueryModalOpen(false)}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton disabled={loading}>
                  {loading ? (
                    <>
                      <i className="bi bi-hourglass-split mr-2 animate-spin"></i>
                      Executing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play mr-2"></i>
                      Execute Query
                    </>
                  )}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}