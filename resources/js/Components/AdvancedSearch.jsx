import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { MagnifyingGlassIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

const AdvancedSearch = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: '',
    dateRange: '',
    priceRange: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
        },
        body: JSON.stringify({
          query,
          filters,
          limit: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    setIsOpen(false);
    setQuery('');
    
    // Navigate to the result
    if (result.route) {
      router.visit(result.route);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const getResultIcon = (type) => {
    const icons = {
      medicine: '💊',
      customer: '👤',
      supplier: '🏢',
      sale: '💰',
      purchase: '📦',
    };
    return icons[type] || '📄';
  };

  const getResultTypeColor = (type) => {
    const colors = {
      medicine: 'bg-green-100 text-green-800',
      customer: 'bg-blue-100 text-blue-800',
      supplier: 'bg-purple-100 text-purple-800',
      sale: 'bg-yellow-100 text-yellow-800',
      purchase: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search medicines, customers, sales..."
            className="w-full pl-10 pr-20 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            onFocus={() => query.length >= 2 && setIsOpen(true)}
          />
          
          {/* Action Buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                onClick={clearSearch}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear search"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400" />
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 rounded-full transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400'
              }`}
              title="Advanced filters"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
            </button>
          </div>
          
          {/* Loading Indicator */}
          {loading && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="medicine">Medicines</option>
                  <option value="customer">Customers</option>
                  <option value="supplier">Suppliers</option>
                  <option value="sale">Sales</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="general">General</option>
                  <option value="prescription">Prescription</option>
                  <option value="otc">Over-the-Counter</option>
                  <option value="supplements">Supplements</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any Price</option>
                  <option value="0-10000">UGX 0 - 10,000</option>
                  <option value="10000-50000">UGX 10,000 - 50,000</option>
                  <option value="50000-100000">UGX 50,000 - 100,000</option>
                  <option value="100000+">UGX 100,000+</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setFilters({ type: 'all', category: '', dateRange: '', priceRange: '' });
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
              Found {results.length} results
            </div>
            
            {results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleResultClick(result)}
                className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-md transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-lg">{getResultIcon(result.type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {result.title}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getResultTypeColor(result.type)}`}>
                        {result.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {result.description}
                    </p>
                    
                    {result.metadata && (
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        {result.metadata.price && (
                          <span>Price: UGX {Number(result.metadata.price).toLocaleString()}</span>
                        )}
                        {result.metadata.stock && (
                          <span>Stock: {String(result?.metadata?.stock || 'N/A')}</span>
                        )}
                        {result.metadata.date && (
                          <span>{String(result?.metadata?.date || 'No date')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            
            <div className="px-3 py-2 border-t border-gray-100 mt-2">
              <button
                onClick={() => {
                  router.visit(`/search?q=${encodeURIComponent(query)}`);
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                View all results for "{query}"
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 p-4">
          <div className="text-center text-gray-500">
            <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No results found for "{query}"</p>
            <p className="text-xs mt-1">Try adjusting your search terms or filters</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;