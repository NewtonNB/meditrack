<?php

namespace App\Http\Controllers;

use App\Services\SearchService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    protected $searchService;

    public function __construct(SearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    public function index(): Response
    {
        return Inertia::render('Search/Index', [
            'filterOptions' => $this->searchService->getFilterOptions(),
            'statistics' => $this->searchService->getSearchStatistics(),
        ]);
    }

    public function globalSearch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:255'],
            'types' => ['array'],
            'types.*' => ['string', 'in:medicines,customers,sales,suppliers,purchases'],
            'limit' => ['integer', 'min:1', 'max:50'],
        ]);

        $query = $validated['query'];
        $types = $validated['types'] ?? ['medicines', 'customers', 'sales'];
        $limit = $validated['limit'] ?? 10;

        $results = $this->searchService->globalSearch($query, $types, $limit);

        return response()->json([
            'results' => $results,
            'query' => $query,
            'total_results' => collect($results)->sum(fn($items) => count($items)),
        ]);
    }

    public function searchMedicines(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:255'],
            'limit' => ['integer', 'min:1', 'max:100'],
            'filters' => ['array'],
            'filters.category' => ['nullable', 'string'],
            'filters.manufacturer' => ['nullable', 'string'],
            'filters.stock_status' => ['nullable', 'string', 'in:low_stock,out_of_stock,in_stock'],
            'filters.price_min' => ['nullable', 'numeric', 'min:0'],
            'filters.price_max' => ['nullable', 'numeric', 'min:0'],
            'filters.expiry_within_days' => ['nullable', 'integer', 'min:1'],
        ]);

        $results = $this->searchService->searchMedicines(
            $validated['query'],
            $validated['limit'] ?? 20,
            $validated['filters'] ?? []
        );

        return response()->json([
            'medicines' => $results,
            'total' => $results->count(),
        ]);
    }

    public function searchCustomers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:255'],
            'limit' => ['integer', 'min:1', 'max:100'],
            'filters' => ['array'],
            'filters.date_from' => ['nullable', 'date'],
            'filters.date_to' => ['nullable', 'date'],
            'filters.has_purchases' => ['nullable', 'string', 'in:yes,no'],
            'filters.loyalty_points_min' => ['nullable', 'integer', 'min:0'],
        ]);

        $results = $this->searchService->searchCustomers(
            $validated['query'],
            $validated['limit'] ?? 20,
            $validated['filters'] ?? []
        );

        return response()->json([
            'customers' => $results,
            'total' => $results->count(),
        ]);
    }

    public function searchSales(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:255'],
            'limit' => ['integer', 'min:1', 'max:100'],
            'filters' => ['array'],
            'filters.date_from' => ['nullable', 'date'],
            'filters.date_to' => ['nullable', 'date'],
            'filters.customer_id' => ['nullable', 'exists:customers,id'],
            'filters.payment_method' => ['nullable', 'string'],
            'filters.total_min' => ['nullable', 'numeric', 'min:0'],
            'filters.total_max' => ['nullable', 'numeric', 'min:0'],
        ]);

        $results = $this->searchService->searchSales(
            $validated['query'],
            $validated['limit'] ?? 20,
            $validated['filters'] ?? []
        );

        return response()->json([
            'sales' => $results,
            'total' => $results->count(),
        ]);
    }

    public function searchSuppliers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:255'],
            'limit' => ['integer', 'min:1', 'max:100'],
            'filters' => ['array'],
            'filters.has_purchases' => ['nullable', 'string', 'in:yes,no'],
        ]);

        $results = $this->searchService->searchSuppliers(
            $validated['query'],
            $validated['limit'] ?? 20,
            $validated['filters'] ?? []
        );

        return response()->json([
            'suppliers' => $results,
            'total' => $results->count(),
        ]);
    }

    public function searchPurchases(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:255'],
            'limit' => ['integer', 'min:1', 'max:100'],
            'filters' => ['array'],
            'filters.status' => ['nullable', 'string'],
            'filters.supplier_id' => ['nullable', 'exists:suppliers,id'],
            'filters.date_from' => ['nullable', 'date'],
            'filters.date_to' => ['nullable', 'date'],
        ]);

        $results = $this->searchService->searchPurchases(
            $validated['query'],
            $validated['limit'] ?? 20,
            $validated['filters'] ?? []
        );

        return response()->json([
            'purchases' => $results,
            'total' => $results->count(),
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:1', 'max:255'],
            'limit' => ['integer', 'min:1', 'max:10'],
        ]);

        $suggestions = $this->searchService->getSearchSuggestions(
            $validated['query'],
            $validated['limit'] ?? 5
        );

        return response()->json([
            'suggestions' => $suggestions,
        ]);
    }

    public function filterOptions(): JsonResponse
    {
        return response()->json($this->searchService->getFilterOptions());
    }

    public function statistics(): JsonResponse
    {
        return response()->json($this->searchService->getSearchStatistics());
    }
}