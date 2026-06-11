<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\Purchase;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\Builder;

class SearchService
{
    public function globalSearch(string $query, array $types = ['medicines', 'customers', 'sales'], int $limit = 10)
    {
        $results = [];

        if (in_array('medicines', $types)) {
            $results['medicines'] = $this->searchMedicines($query, $limit);
        }

        if (in_array('customers', $types)) {
            $results['customers'] = $this->searchCustomers($query, $limit);
        }

        if (in_array('sales', $types)) {
            $results['sales'] = $this->searchSales($query, $limit);
        }

        if (in_array('suppliers', $types)) {
            $results['suppliers'] = $this->searchSuppliers($query, $limit);
        }

        if (in_array('purchases', $types)) {
            $results['purchases'] = $this->searchPurchases($query, $limit);
        }

        return $results;
    }

    public function searchMedicines(string $query, int $limit = 20, array $filters = [])
    {
        $searchQuery = Medicine::query()
            ->where(function (Builder $q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('brand', 'LIKE', "%{$query}%")
                  ->orWhere('batch_number', 'LIKE', "%{$query}%");
            });

        // Apply filters
        if (isset($filters['brand']) && $filters['brand']) {
            $searchQuery->where('brand', $filters['brand']);
        }

        if (isset($filters['stock_status'])) {
            switch ($filters['stock_status']) {
                case 'low_stock':
                    $searchQuery->where('stock', '<=', 50);
                    break;
                case 'out_of_stock':
                    $searchQuery->where('stock', '<=', 0);
                    break;
                case 'in_stock':
                    $searchQuery->where('stock', '>', 50);
                    break;
            }
        }

        if (isset($filters['price_min']) && $filters['price_min']) {
            $searchQuery->where('price', '>=', $filters['price_min']);
        }

        if (isset($filters['price_max']) && $filters['price_max']) {
            $searchQuery->where('price', '<=', $filters['price_max']);
        }

        if (isset($filters['expiry_within_days']) && $filters['expiry_within_days']) {
            $searchQuery->whereHas('batches', function (Builder $q) use ($filters) {
                $q->where('expiry_date', '<=', now()->addDays($filters['expiry_within_days']));
            });
        }

        return $searchQuery->orderBy('name')->limit($limit)->get();
    }

    public function searchCustomers(string $query, int $limit = 20, array $filters = [])
    {
        $searchQuery = Customer::query()
            ->where(function (Builder $q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('email', 'LIKE', "%{$query}%")
                  ->orWhere('phone', 'LIKE', "%{$query}%")
                  ->orWhere('address', 'LIKE', "%{$query}%");
            });

        // Apply filters
        if (isset($filters['date_from']) && $filters['date_from']) {
            $searchQuery->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to']) && $filters['date_to']) {
            $searchQuery->where('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['has_purchases']) && $filters['has_purchases']) {
            if ($filters['has_purchases'] === 'yes') {
                $searchQuery->has('sales');
            } else {
                $searchQuery->doesntHave('sales');
            }
        }

        if (isset($filters['loyalty_points_min']) && $filters['loyalty_points_min']) {
            $searchQuery->whereHas('loyalty', function (Builder $q) use ($filters) {
                $q->where('points_balance', '>=', $filters['loyalty_points_min']);
            });
        }

        return $searchQuery->orderBy('name')->limit($limit)->get();
    }

    public function searchSales(string $query, int $limit = 20, array $filters = [])
    {
        $searchQuery = Sale::with(['customer', 'medicine'])
            ->where(function (Builder $q) use ($query) {
                $q->where('id', 'LIKE', "%{$query}%")
                  ->orWhereHas('customer', function (Builder $cq) use ($query) {
                      $cq->where('name', 'LIKE', "%{$query}%");
                  })
                  ->orWhereHas('medicine', function (Builder $mq) use ($query) {
                      $mq->where('name', 'LIKE', "%{$query}%");
                  });
            });

        // Apply filters
        if (isset($filters['date_from']) && $filters['date_from']) {
            $searchQuery->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to']) && $filters['date_to']) {
            $searchQuery->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['customer_id']) && $filters['customer_id']) {
            $searchQuery->where('customer_id', $filters['customer_id']);
        }

        if (isset($filters['total_min']) && $filters['total_min']) {
            $searchQuery->where('total_price', '>=', $filters['total_min']);
        }

        if (isset($filters['total_max']) && $filters['total_max']) {
            $searchQuery->where('total_price', '<=', $filters['total_max']);
        }

        return $searchQuery->orderBy('sold_at', 'desc')->limit($limit)->get();
    }

    public function searchSuppliers(string $query, int $limit = 20, array $filters = [])
    {
        $searchQuery = Supplier::query()
            ->where(function (Builder $q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('contact_person', 'LIKE', "%{$query}%")
                  ->orWhere('email', 'LIKE', "%{$query}%")
                  ->orWhere('phone', 'LIKE', "%{$query}%")
                  ->orWhere('address', 'LIKE', "%{$query}%");
            });

        // Apply filters
        if (isset($filters['has_purchases']) && $filters['has_purchases']) {
            if ($filters['has_purchases'] === 'yes') {
                $searchQuery->has('purchases');
            } else {
                $searchQuery->doesntHave('purchases');
            }
        }

        return $searchQuery->orderBy('name')->limit($limit)->get();
    }

    public function searchPurchases(string $query, int $limit = 20, array $filters = [])
    {
        $searchQuery = Purchase::with(['supplier', 'items.medicine'])
            ->where(function (Builder $q) use ($query) {
                $q->where('purchase_number', 'LIKE', "%{$query}%")
                  ->orWhere('invoice_number', 'LIKE', "%{$query}%")
                  ->orWhereHas('supplier', function (Builder $sq) use ($query) {
                      $sq->where('name', 'LIKE', "%{$query}%");
                  })
                  ->orWhereHas('items.medicine', function (Builder $mq) use ($query) {
                      $mq->where('name', 'LIKE', "%{$query}%");
                  });
            });

        // Apply filters
        if (isset($filters['status']) && $filters['status']) {
            $searchQuery->where('status', $filters['status']);
        }

        if (isset($filters['supplier_id']) && $filters['supplier_id']) {
            $searchQuery->where('supplier_id', $filters['supplier_id']);
        }

        if (isset($filters['date_from']) && $filters['date_from']) {
            $searchQuery->whereDate('purchase_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to']) && $filters['date_to']) {
            $searchQuery->whereDate('purchase_date', '<=', $filters['date_to']);
        }

        return $searchQuery->orderBy('purchase_date', 'desc')->limit($limit)->get();
    }

    public function getSearchSuggestions(string $query, int $limit = 5)
    {
        $suggestions = [];

        // Medicine suggestions
        $medicines = Medicine::where('name', 'LIKE', "%{$query}%")
                           ->orWhere('generic_name', 'LIKE', "%{$query}%")
                           ->limit($limit)
                           ->pluck('name')
                           ->toArray();

        // Customer suggestions
        $customers = Customer::where('name', 'LIKE', "%{$query}%")
                           ->limit($limit)
                           ->pluck('name')
                           ->toArray();

        // Combine and return unique suggestions
        $suggestions = array_unique(array_merge($medicines, $customers));
        
        return array_slice($suggestions, 0, $limit);
    }

    public function getFilterOptions()
    {
        return [
            'medicine_brands' => Medicine::whereNotNull('brand')->distinct()->pluck('brand')->filter()->sort()->values(),
            'purchase_statuses' => Purchase::distinct()->pluck('status')->filter()->sort()->values(),
            'suppliers' => Supplier::orderBy('name')->pluck('name', 'id'),
        ];
    }

    public function getSearchStatistics()
    {
        return [
            'total_medicines' => Medicine::count(),
            'total_customers' => Customer::count(),
            'total_sales' => Sale::count(),
            'total_suppliers' => Supplier::count(),
            'total_purchases' => Purchase::count(),
            'low_stock_medicines' => Medicine::where('stock', '<=', 50)->count(),
            'recent_sales' => Sale::whereDate('created_at', today())->count(),
            'pending_purchases' => Purchase::where('status', 'pending')->count(),
        ];
    }
}