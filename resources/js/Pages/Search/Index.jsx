import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  Search,
  Filter,
  Package,
  Users,
  ShoppingCart,
  Truck,
  FileText,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export default function SearchIndex({ filterOptions, statistics }) {
  const { props } = usePage();
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});

  const searchTabs = [
    { key: 'all', label: 'All Results', icon: Search },
    { key: 'medicines', label: 'Medicines', icon: Package },
    { key: 'customers', label: 'Customers', icon: Users },
    { key: 'sales', label: 'Sales', icon: ShoppingCart },
    { key: 'suppliers', label: 'Suppliers', icon: Truck },
    { key: 'purchases', label: 'Purchases', icon: FileText },
  ];

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  const performSearch = async (searchQuery = query) => {
    if (!searchQuery || searchQuery.length < 2) return;

    setLoading(true);
    try {
      const types =
        activeTab === 'all'
          ? ['medicines', 'customers', 'sales', 'suppliers', 'purchases']
          : [activeTab];

      const response = await fetch('/api/search/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({
          query: searchQuery,
          types,
          limit: 20,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = e => {
    e.preventDefault();
    performSearch();
    // Update URL without page reload
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('q', query);
    window.history.pushState({}, '', newUrl);
  };

  const handleTabChange = tab => {
    setActiveTab(tab);
    if (query) {
      performSearch();
    }
  };

  const getTotalResults = () => {
    return Object.values(results).reduce((total, items) => total + (items?.length || 0), 0);
  };

  const formatCurrency = amount => {
    return `UGX ${Number(amount).toLocaleString()}`;
  };

  const formatDate = date => {
    return new Date(date).toLocaleDateString();
  };

  const renderMedicineResults = medicines => (
    <div className="space-y-4">
      {medicines.map(medicine => (
        <Card key={medicine.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{medicine.name}</h3>
                <p className="text-gray-600">{medicine.generic_name}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Category: {medicine.category}</span>
                  <span>Stock: {medicine.stock}</span>
                  <span>Price: {formatCurrency(medicine.price)}</span>
                </div>
                {medicine.description && (
                  <p className="text-sm text-gray-600 mt-2">{medicine.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    medicine.stock > 50
                      ? 'default'
                      : medicine.stock > 0
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {medicine.stock > 50
                    ? 'In Stock'
                    : medicine.stock > 0
                      ? 'Low Stock'
                      : 'Out of Stock'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.get(route('medicines.index'), { search: medicine.name })}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCustomerResults = customers => (
    <div className="space-y-4">
      {customers.map(customer => (
        <Card key={customer.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{customer.name}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {customer.email && <span>📧 {customer.email}</span>}
                  {customer.phone && <span>📞 {customer.phone}</span>}
                </div>
                {customer.address && (
                  <p className="text-sm text-gray-600 mt-2">📍 {customer.address}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Joined: {formatDate(customer.created_at)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.get(route('customers.index'), { search: customer.name })}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSalesResults = sales => (
    <div className="space-y-4">
      {sales.map(sale => (
        <Card key={sale.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">Sale #{sale.transaction_id}</h3>
                <p className="text-gray-600">Customer: {sale.customer?.name || 'Walk-in'}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>💰 {formatCurrency(sale.total_amount)}</span>
                  <span>📅 {formatDate(sale.created_at)}</span>
                  <span>💳 {sale.payment_method}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Items: {sale.items?.length || 0}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.get(route('sales.show', sale.id))}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSupplierResults = suppliers => (
    <div className="space-y-4">
      {suppliers.map(supplier => (
        <Card key={supplier.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{supplier.name}</h3>
                <p className="text-gray-600">Contact: {supplier.contact_person}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {supplier.email && <span>📧 {supplier.email}</span>}
                  {supplier.phone && <span>📞 {supplier.phone}</span>}
                </div>
                {supplier.address && (
                  <p className="text-sm text-gray-600 mt-2">📍 {supplier.address}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.get(route('suppliers.index'), { search: supplier.name })}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPurchaseResults = purchases => (
    <div className="space-y-4">
      {purchases.map(purchase => (
        <Card key={purchase.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  Purchase #{purchase.purchase_number}
                </h3>
                <p className="text-gray-600">Supplier: {purchase.supplier?.name}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>💰 {formatCurrency(purchase.total_amount)}</span>
                  <span>📅 {formatDate(purchase.purchase_date)}</span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={purchase.status === 'received' ? 'default' : 'secondary'}>
                    {purchase.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.get(route('purchases.show', purchase.id))}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <AuthenticatedLayout
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">Global Search</h2>
        </div>
      }
    >
      <Head title="Search" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Search Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Medicines</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.total_medicines}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Customers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {statistics.total_customers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sales</p>
                    <p className="text-2xl font-bold text-purple-600">{statistics.total_sales}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Suppliers</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {statistics.total_suppliers}
                    </p>
                  </div>
                  <Truck className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Form */}
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search medicines, customers, sales, suppliers, purchases..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Search Tabs */}
          {query && (
            <Card>
              <CardContent className="p-0">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    {searchTabs.map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                          activeTab === tab.key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <tab.icon className="w-4 h-4 mr-2" />
                        {tab.label}
                        {results[tab.key] && (
                          <Badge variant="secondary" className="ml-2">
                            {results[tab.key].length}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {query && (
            <div className="space-y-6">
              {getTotalResults() === 0 && !loading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or filters</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {(activeTab === 'all' || activeTab === 'medicines') && results.medicines && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Package className="w-5 h-5 mr-2" />
                        Medicines ({results.medicines.length})
                      </h3>
                      {renderMedicineResults(results.medicines)}
                    </div>
                  )}

                  {(activeTab === 'all' || activeTab === 'customers') && results.customers && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Customers ({results.customers.length})
                      </h3>
                      {renderCustomerResults(results.customers)}
                    </div>
                  )}

                  {(activeTab === 'all' || activeTab === 'sales') && results.sales && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Sales ({results.sales.length})
                      </h3>
                      {renderSalesResults(results.sales)}
                    </div>
                  )}

                  {(activeTab === 'all' || activeTab === 'suppliers') && results.suppliers && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Truck className="w-5 h-5 mr-2" />
                        Suppliers ({results.suppliers.length})
                      </h3>
                      {renderSupplierResults(results.suppliers)}
                    </div>
                  )}

                  {(activeTab === 'all' || activeTab === 'purchases') && results.purchases && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Purchases ({results.purchases.length})
                      </h3>
                      {renderPurchaseResults(results.purchases)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
