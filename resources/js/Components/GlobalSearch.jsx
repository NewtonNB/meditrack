import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
  Search,
  X,
  Filter,
  Loader2,
  Package,
  Users,
  ShoppingCart,
  Truck,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';

export default function GlobalSearch({
  className = '',
  placeholder = 'Search medicines, customers, sales...',
  inputClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['medicines', 'customers', 'sales']);
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const inputRef = useRef(null);

  const searchTypes = [
    { key: 'medicines', label: 'Medicines', icon: Package, color: 'bg-blue-100 text-blue-800' },
    { key: 'customers', label: 'Customers', icon: Users, color: 'bg-green-100 text-green-800' },
    { key: 'sales', label: 'Sales', icon: ShoppingCart, color: 'bg-purple-100 text-purple-800' },
    { key: 'suppliers', label: 'Suppliers', icon: Truck, color: 'bg-orange-100 text-orange-800' },
    {
      key: 'purchases',
      label: 'Purchases',
      icon: FileText,
      color: 'bg-indigo-100 text-indigo-800',
    },
  ];

  useEffect(() => {
    const handleClickOutside = event => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults({});
      setHighlightedIndex(-1);
    }
  }, [query, selectedTypes]);

  const performSearch = async () => {
    if (query.length < 2) return;

    setLoading(true);
    try {
      const response = await fetch('/api/search/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({
          query,
          types: selectedTypes,
          limit: 5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = type => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleResultClick = (type, item) => {
    setIsOpen(false);
    setQuery('');

    // Navigate to appropriate page based on type
    switch (type) {
      case 'medicines':
        router.get(route('medicines.index'), { search: item.name });
        break;
      case 'customers':
        router.get(route('customers.index'), { search: item.name });
        break;
      case 'sales':
        router.get(route('sales.show', item.id));
        break;
      case 'suppliers':
        router.get(route('suppliers.index'), { search: item.name });
        break;
      case 'purchases':
        router.get(route('purchases.show', item.id));
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults({});
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Flatten results for keyboard navigation
  const flatResults = React.useMemo(() => {
    const list = [];
    Object.entries(results).forEach(([type, items]) => {
      if (items && items.length) {
        items.forEach(item => list.push({ type, item }));
      }
    });
    return list;
  }, [results]);

  const onKeyDown = e => {
    if (!isOpen && e.key !== 'Escape') {
      setIsOpen(true);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const next = (prev + 1) % Math.max(1, flatResults.length);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const next = (prev - 1 + Math.max(1, flatResults.length)) % Math.max(1, flatResults.length);
        return next;
      });
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < flatResults.length) {
        const { type, item } = flatResults[highlightedIndex];
        handleResultClick(type, item);
      } else if (query.length >= 2) {
        router.get(route('search.index'), { q: query });
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getItemTitle = (type, item) => {
    switch (type) {
      case 'medicines':
        return item.name;
      case 'customers':
        return item.name;
      case 'sales':
        return `Sale #${item.transaction_id}`;
      case 'suppliers':
        return item.name;
      case 'purchases':
        return `Purchase #${item.purchase_number}`;
      default:
        return 'Unknown';
    }
  };

  const getItemSubtitle = (type, item) => {
    switch (type) {
      case 'medicines':
        return `${item.generic_name} - Stock: ${item.stock}`;
      case 'customers':
        return item.email || item.phone;
      case 'sales':
        return `UGX ${Number(item.total_amount).toLocaleString()} - ${new Date(item.created_at).toLocaleDateString()}`;
      case 'suppliers':
        return item.contact_person || item.email;
      case 'purchases':
        return `${item.supplier?.name} - $${item.total_amount}`;
      default:
        return '';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={onKeyDown}
          ref={inputRef}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${inputClassName}`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {query && (
            <button onClick={clearSearch} className="p-1 mr-1 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 mr-1 rounded ${showFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Type Filters */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="text-sm font-medium text-gray-700 mb-2">Search in:</div>
          <div className="flex flex-wrap gap-2">
            {searchTypes.map(type => (
              <button
                key={type.key}
                onClick={() => handleTypeToggle(type.key)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTypes.includes(type.key)
                    ? type.color
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <type.icon className="w-3 h-3 mr-1" />
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {isOpen && query.length >= 2 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-96 overflow-y-auto"
        >
          {Object.keys(results).length === 0 && !loading ? (
            <div className="p-4 text-center text-gray-500">No results found for "{query}"</div>
          ) : (
            <div className="py-2">
              {Object.entries(results).map(([type, items]) => {
                if (!items || items.length === 0) return null;

                const typeConfig = searchTypes.find(t => t.key === type);
                if (!typeConfig) return null;

                return (
                  <div key={type} className="mb-2 last:mb-0">
                    <div className="px-3 py-2 bg-gray-50 border-b">
                      <div className="flex items-center">
                        <typeConfig.icon className="w-4 h-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {typeConfig.label}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {items.length}
                        </Badge>
                      </div>
                    </div>
                    {items.map((item, index) => {
                      const globalIndex = flatResults.findIndex(r => r.item?.id === item.id && r.type === type);
                      const isHighlighted = highlightedIndex === globalIndex;
                      return (
                      <button
                        key={`${type}-${item.id}`}
                        onClick={() => handleResultClick(type, item)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between group ${isHighlighted ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {getItemTitle(type, item)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {getItemSubtitle(type, item)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* View All Results */}
          {Object.keys(results).length > 0 && (
            <div className="border-t border-gray-200 p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.get(route('search.index'), { q: query });
                  setIsOpen(false);
                }}
                className="w-full justify-center"
              >
                View all results for "{query}"
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
