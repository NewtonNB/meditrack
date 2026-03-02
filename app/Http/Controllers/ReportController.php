<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReportController extends Controller
{
    protected $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    public function index(): InertiaResponse
    {
        return Inertia::render('Reports/Index', [
            'statistics' => $this->reportService->getReportStatistics(),
        ]);
    }

    // Sales Reports
    public function salesReport(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'medicine_id' => ['nullable', 'exists:medicines,id'],
        ]);

        $data = $this->reportService->generateSalesReport($filters);

        return response()->json($data);
    }

    public function exportSalesPdf(Request $request): Response
    {
        $filters = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'medicine_id' => ['nullable', 'exists:medicines,id'],
        ]);

        $export = $this->reportService->exportSalesReportToPdf($filters);

        return $export['pdf']->download($export['filename']);
    }

    public function exportSalesExcel(Request $request)
    {
        $filters = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'medicine_id' => ['nullable', 'exists:medicines,id'],
        ]);

        return $this->reportService->exportSalesReportToExcel($filters);
    }

    // Expiry Reports
    public function expiryReport(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'days_ahead' => ['nullable', 'integer', 'min:1', 'max:365'],
            'category' => ['nullable', 'string'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
        ]);

        $data = $this->reportService->generateExpiryReport($filters);

        return response()->json($data);
    }

    public function exportExpiryPdf(Request $request): Response
    {
        $filters = $request->validate([
            'days_ahead' => ['nullable', 'integer', 'min:1', 'max:365'],
            'category' => ['nullable', 'string'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
        ]);

        $export = $this->reportService->exportExpiryReportToPdf($filters);

        return $export['pdf']->download($export['filename']);
    }

    public function exportExpiryExcel(Request $request)
    {
        $filters = $request->validate([
            'days_ahead' => ['nullable', 'integer', 'min:1', 'max:365'],
            'category' => ['nullable', 'string'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
        ]);

        return $this->reportService->exportExpiryReportToExcel($filters);
    }

    // Stock Reports
    public function stockReport(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'category' => ['nullable', 'string'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'stock_status' => ['nullable', 'string', 'in:low_stock,out_of_stock,overstock'],
        ]);

        $data = $this->reportService->generateStockReport($filters);

        return response()->json($data);
    }

    public function exportStockPdf(Request $request): Response
    {
        $filters = $request->validate([
            'category' => ['nullable', 'string'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'stock_status' => ['nullable', 'string', 'in:low_stock,out_of_stock,overstock'],
        ]);

        $export = $this->reportService->exportStockReportToPdf($filters);

        return $export['pdf']->download($export['filename']);
    }

    public function exportStockExcel(Request $request)
    {
        $filters = $request->validate([
            'category' => ['nullable', 'string'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'stock_status' => ['nullable', 'string', 'in:low_stock,out_of_stock,overstock'],
        ]);

        return $this->reportService->exportStockReportToExcel($filters);
    }

    // Combined Reports
    public function dashboardReport(): JsonResponse
    {
        $salesData = $this->reportService->generateSalesReport(['date_from' => now()->subDays(30)]);
        $expiryData = $this->reportService->generateExpiryReport(['days_ahead' => 30]);
        $stockData = $this->reportService->generateStockReport();

        return response()->json([
            'sales' => [
                'summary' => $salesData['summary'],
                'daily_sales' => $salesData['daily_sales']->take(7),
                'top_medicines' => $salesData['top_medicines']->take(5),
            ],
            'expiry' => [
                'summary' => $expiryData['summary'],
                'critical' => $expiryData['critical']->take(10),
            ],
            'stock' => [
                'summary' => $stockData['summary'],
                'low_stock' => $stockData['low_stock']->take(10),
                'out_of_stock' => $stockData['out_of_stock']->take(10),
            ],
            'generated_at' => now(),
        ]);
    }

    public function exportDashboardPdf(): Response
    {
        $salesData = $this->reportService->generateSalesReport(['date_from' => now()->subDays(30)]);
        $expiryData = $this->reportService->generateExpiryReport(['days_ahead' => 30]);
        $stockData = $this->reportService->generateStockReport();

        $data = [
            'sales' => $salesData,
            'expiry' => $expiryData,
            'stock' => $stockData,
            'generated_at' => now(),
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.dashboard-pdf', $data);
        $pdf->setPaper('A4', 'portrait');

        $filename = 'dashboard-report-' . now()->format('Y-m-d-H-i-s') . '.pdf';

        return $pdf->download($filename);
    }

    // Report Statistics
    public function statistics(): JsonResponse
    {
        return response()->json($this->reportService->getReportStatistics());
    }
}