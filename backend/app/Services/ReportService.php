<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\Supplier;
use App\Models\Purchase;
use App\Models\Batch;
use Illuminate\Support\Collection;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf as PDF;
use Maatwebsite\Excel\Facades\Excel;

class ReportService
{
    public function generateSalesReport(array $filters = [])
    {
        $query = Sale::with(['customer', 'medicine']);

        // Apply filters
        if (isset($filters['date_from'])) {
            $query->whereDate('sold_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('sold_at', '<=', $filters['date_to']);
        }

        if (isset($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (isset($filters['medicine_id'])) {
            $query->where('medicine_id', $filters['medicine_id']);
        }

        $sales = $query->orderBy('sold_at', 'desc')->get();

        // Calculate summary statistics
        $summary = [
            'total_sales' => $sales->count(),
            'total_revenue' => $sales->sum('total_price'),
            'average_sale_amount' => $sales->avg('total_price'),
            'total_quantity_sold' => $sales->sum('quantity'),
            'date_range' => [
                'from' => $filters['date_from'] ?? $sales->min('sold_at'),
                'to' => $filters['date_to'] ?? $sales->max('sold_at'),
            ],
        ];

        // Top selling medicines
        $topMedicines = $sales->groupBy('medicine_id')
                             ->map(function ($group) {
                                 return [
                                     'medicine' => $group->first()->medicine,
                                     'quantity_sold' => $group->sum('quantity'),
                                     'revenue' => $group->sum('total_price'),
                                     'sales_count' => $group->count(),
                                 ];
                             })
                             ->sortByDesc('revenue')
                             ->take(10)
                             ->values();

        // Sales by customer
        $customerSales = $sales->groupBy('customer_id')
                              ->map(function ($group) {
                                  return [
                                      'customer' => $group->first()->customer,
                                      'total_purchases' => $group->sum('total_price'),
                                      'purchase_count' => $group->count(),
                                      'average_purchase' => $group->avg('total_price'),
                                  ];
                              })
                              ->sortByDesc('total_purchases')
                              ->take(10)
                              ->values();

        // Daily sales trend
        $dailySales = $sales->groupBy(function ($sale) {
                                return $sale->sold_at->format('Y-m-d');
                            })
                            ->map(function ($group, $date) {
                                return [
                                    'date' => $date,
                                    'sales_count' => $group->count(),
                                    'revenue' => $group->sum('total_price'),
                                    'quantity' => $group->sum('quantity'),
                                ];
                            })
                            ->sortBy('date')
                            ->values();

        return [
            'sales' => $sales,
            'summary' => $summary,
            'top_medicines' => $topMedicines,
            'customer_sales' => $customerSales,
            'daily_sales' => $dailySales,
            'generated_at' => now(),
        ];
    }

    public function generateExpiryReport(array $filters = [])
    {
        $daysAhead = $filters['days_ahead'] ?? 90;
        $expiryDate = now()->addDays($daysAhead);

        // For now, we'll use the medicine's expiry_date field directly
        // since batches might not be fully implemented
        $query = Medicine::query()
                        ->whereNotNull('expiry_date')
                        ->where('expiry_date', '<=', $expiryDate)
                        ->where('stock', '>', 0);

        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        $medicines = $query->get();

        // Group by expiry urgency
        $critical = collect(); // Expires in 7 days
        $warning = collect();  // Expires in 30 days
        $notice = collect();   // Expires in 90 days

        foreach ($medicines as $medicine) {
            $daysToExpiry = now()->diffInDays($medicine->expiry_date, false);
            
            // Create a mock batch object for compatibility
            $mockBatch = (object) [
                'batch_number' => $medicine->batch_number ?? 'N/A',
                'quantity' => $medicine->stock,
                'expiry_date' => $medicine->expiry_date,
            ];
            
            $item = [
                'medicine' => $medicine,
                'batch' => $mockBatch,
                'days_to_expiry' => $daysToExpiry,
                'value_at_risk' => $medicine->stock * $medicine->cost_price,
            ];

            if ($daysToExpiry <= 7) {
                $critical->push($item);
            } elseif ($daysToExpiry <= 30) {
                $warning->push($item);
            } else {
                $notice->push($item);
            }
        }

        $summary = [
            'total_medicines_expiring' => $medicines->count(),
            'total_batches_expiring' => $medicines->count(), // Using medicine count as batch count for now
            'critical_count' => $critical->count(),
            'warning_count' => $warning->count(),
            'notice_count' => $notice->count(),
            'total_value_at_risk' => $critical->sum('value_at_risk') + $warning->sum('value_at_risk') + $notice->sum('value_at_risk'),
            'critical_value_at_risk' => $critical->sum('value_at_risk'),
            'days_ahead' => $daysAhead,
        ];

        return [
            'critical' => $critical->sortBy('days_to_expiry'),
            'warning' => $warning->sortBy('days_to_expiry'),
            'notice' => $notice->sortBy('days_to_expiry'),
            'summary' => $summary,
            'generated_at' => now(),
        ];
    }

    public function generateStockReport(array $filters = [])
    {
        $query = Medicine::with(['supplier', 'batches']);

        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        if (isset($filters['stock_status'])) {
            switch ($filters['stock_status']) {
                case 'low_stock':
                    $query->whereRaw('stock <= reorder_level');
                    break;
                case 'out_of_stock':
                    $query->where('stock', '<=', 0);
                    break;
                case 'overstock':
                    $query->whereRaw('stock > (reorder_level * 3)');
                    break;
            }
        }

        $medicines = $query->orderBy('name')->get();

        // Categorize medicines by stock status
        $outOfStock = $medicines->where('stock', '<=', 0);
        $lowStock = $medicines->filter(function ($medicine) {
            return $medicine->stock > 0 && $medicine->stock <= $medicine->reorder_level;
        });
        $adequateStock = $medicines->filter(function ($medicine) {
            return $medicine->stock > $medicine->reorder_level && $medicine->stock <= ($medicine->reorder_level * 3);
        });
        $overStock = $medicines->filter(function ($medicine) {
            return $medicine->stock > ($medicine->reorder_level * 3);
        });

        // Calculate inventory value
        $totalInventoryValue = $medicines->sum(function ($medicine) {
            return $medicine->stock * $medicine->cost_price;
        });

        $summary = [
            'total_medicines' => $medicines->count(),
            'out_of_stock_count' => $outOfStock->count(),
            'low_stock_count' => $lowStock->count(),
            'adequate_stock_count' => $adequateStock->count(),
            'overstock_count' => $overStock->count(),
            'total_inventory_value' => $totalInventoryValue,
            'total_stock_units' => $medicines->sum('stock'),
            'average_stock_value' => $medicines->avg(function ($medicine) {
                return $medicine->stock * $medicine->cost_price;
            }),
        ];

        // Stock movement analysis (last 30 days)
        $stockMovements = \App\Models\StockMovement::with(['medicine'])
                                                  ->where('created_at', '>=', now()->subDays(30))
                                                  ->get()
                                                  ->groupBy('type')
                                                  ->map(function ($group, $type) {
                                                      return [
                                                          'type' => $type,
                                                          'count' => $group->count(),
                                                          'total_quantity' => $group->sum('quantity_change'),
                                                      ];
                                                  });

        return [
            'medicines' => $medicines,
            'out_of_stock' => $outOfStock,
            'low_stock' => $lowStock,
            'adequate_stock' => $adequateStock,
            'overstock' => $overStock,
            'summary' => $summary,
            'stock_movements' => $stockMovements,
            'generated_at' => now(),
        ];
    }

    public function exportSalesReportToPdf(array $filters = [])
    {
        $data = $this->generateSalesReport($filters);
        
        // For now, return the data structure that would be used for PDF generation
        // The actual PDF generation will be implemented when the package is properly installed
        $filename = 'sales-report-' . now()->format('Y-m-d-H-i-s') . '.pdf';
        
        return [
            'pdf' => null, // Would contain PDF object when package is available
            'filename' => $filename,
            'data' => $data,
            'view' => 'reports.sales-pdf',
        ];
    }

    public function exportExpiryReportToPdf(array $filters = [])
    {
        $data = $this->generateExpiryReport($filters);
        
        $filename = 'expiry-report-' . now()->format('Y-m-d-H-i-s') . '.pdf';
        
        return [
            'pdf' => null, // Would contain PDF object when package is available
            'filename' => $filename,
            'data' => $data,
            'view' => 'reports.expiry-pdf',
        ];
    }

    public function exportStockReportToPdf(array $filters = [])
    {
        $data = $this->generateStockReport($filters);
        
        $filename = 'stock-report-' . now()->format('Y-m-d-H-i-s') . '.pdf';
        
        return [
            'pdf' => null, // Would contain PDF object when package is available
            'filename' => $filename,
            'data' => $data,
            'view' => 'reports.stock-pdf',
        ];
    }

    public function exportSalesReportToExcel(array $filters = [])
    {
        $data = $this->generateSalesReport($filters);
        $filename = 'sales-report-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
        
        // For now, return the data structure that would be used for Excel generation
        return [
            'data' => $data,
            'filename' => $filename,
            'export_class' => \App\Exports\SalesReportExport::class,
        ];
    }

    public function exportExpiryReportToExcel(array $filters = [])
    {
        $data = $this->generateExpiryReport($filters);
        $filename = 'expiry-report-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
        
        return [
            'data' => $data,
            'filename' => $filename,
            'export_class' => \App\Exports\ExpiryReportExport::class,
        ];
    }

    public function exportStockReportToExcel(array $filters = [])
    {
        $data = $this->generateStockReport($filters);
        $filename = 'stock-report-' . now()->format('Y-m-d-H-i-s') . '.xlsx';
        
        return [
            'data' => $data,
            'filename' => $filename,
            'export_class' => \App\Exports\StockReportExport::class,
        ];
    }

    public function getReportStatistics()
    {
        return [
            'total_sales_this_month' => Sale::whereMonth('sold_at', now()->month)->count(),
            'medicines_expiring_soon' => Medicine::whereNotNull('expiry_date')
                                                ->where('expiry_date', '<=', now()->addDays(30))
                                                ->count(),
            'low_stock_medicines' => Medicine::whereRaw('stock <= reorder_level')->count(),
            'out_of_stock_medicines' => Medicine::where('stock', '<=', 0)->count(),
            'total_inventory_value' => Medicine::all()->sum(function ($medicine) {
                return $medicine->stock * $medicine->cost_price;
            }),
        ];
    }
}