<?php

namespace App\Http\Controllers;

use App\Services\AutomationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AutomationController extends Controller
{
    protected $automationService;

    public function __construct(AutomationService $automationService)
    {
        $this->automationService = $automationService;
    }

    /**
     * Display the automation dashboard
     */
    public function dashboard(Request $request)
    {
        $summary = $this->automationService->getDashboardSummary();
        $recentSuggestions = $this->automationService->getReorderSuggestions()->take(5);

        $data = [
            'summary' => $summary,
            'recentSuggestions' => $recentSuggestions,
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Automation/Dashboard', $data);
    }

    /**
     * Display reorder suggestions
     */
    public function reorderSuggestions(Request $request)
    {
        $suggestions = $this->automationService->getReorderSuggestions();

        $data = [
            'data' => $suggestions,
            'summary' => [
                'total' => $suggestions->count(),
                'critical' => $suggestions->where('urgency_level', 'critical')->count(),
                'high' => $suggestions->where('urgency_level', 'high')->count(),
                'medium' => $suggestions->where('urgency_level', 'medium')->count(),
                'low' => $suggestions->where('urgency_level', 'low')->count(),
                'total_estimated_cost' => $suggestions->sum('estimated_cost'),
            ],
        ];

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json($data);
        }

        return Inertia::render('Automation/ReorderSuggestions', [
            'suggestions' => $suggestions,
            'summary' => $data['summary'],
        ]);
    }



    /**
     * Get automation data for dashboard widgets
     */
    public function getAutomationData(): \Illuminate\Http\JsonResponse
    {
        $user = auth()->user();
        $summary = $this->automationService->getDashboardSummary();
        
        // Filter data based on user permissions
        if ($user && !$user->hasPermissionTo('view_reports') && !in_array($user->role, ['pharmacy_admin', 'super_admin'])) {
            // For users without view_reports permission, provide limited data
            $summary = [
                'reorder_suggestions' => [
                    'total' => $summary['reorder_suggestions']['total'] ?? 0,
                    'critical' => $summary['reorder_suggestions']['critical'] ?? 0,
                    'high' => $summary['reorder_suggestions']['high'] ?? 0,
                    'estimated_cost' => 0, // Hide cost information
                ],
                'expiry_reminders' => [
                    'total' => $summary['expiry_reminders']['total'] ?? 0,
                    'critical' => $summary['expiry_reminders']['critical'] ?? 0,
                    'high' => $summary['expiry_reminders']['high'] ?? 0,
                    'potential_loss' => 0, // Hide financial information
                ],
                'quick_actions' => array_map(function($action) {
                    // Remove sensitive routes for limited users
                    if ($action['route'] === 'automation.reorder-suggestions') {
                        $action['route'] = 'medicines.index';
                        $action['action'] = 'View Medicines';
                    }
                    return $action;
                }, $summary['quick_actions'] ?? []),
            ];
        }
        
        return response()->json($summary);
    }

    /**
     * Mark a reorder suggestion as actioned
     */
    public function markReorderActioned(Request $request, int $medicineId): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'action' => 'required|string|in:ordered,ignored,postponed'
        ]);

        $success = $this->automationService->markReorderActioned($medicineId, $request->action);

        return response()->json([
            'success' => $success,
            'message' => 'Reorder suggestion updated successfully'
        ]);
    }

    /**
     * Mark an expiry reminder as handled
     */
    public function markExpiryHandled(Request $request, int $medicineId): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'action' => 'required|string|in:discounted,returned,disposed,ignored'
        ]);

        $success = $this->automationService->markExpiryHandled($medicineId, $request->action);

        return response()->json([
            'success' => $success,
            'message' => 'Expiry reminder updated successfully'
        ]);
    }



    /**
     * Get quick automation insights for dashboard
     */
    public function getQuickInsights(): \Illuminate\Http\JsonResponse
    {
        $reorderSuggestions = $this->automationService->getReorderSuggestions();

        $insights = [
            'critical_reorders' => $reorderSuggestions->where('urgency_level', 'critical')->count(),
            'total_reorder_cost' => $reorderSuggestions->sum('estimated_cost'),
            'top_urgent_medicine' => $reorderSuggestions->first(),
        ];

        return response()->json($insights);
    }

    /**
     * Generate purchase order from reorder suggestion
     */
    public function generatePurchaseOrder(Request $request, int $medicineId): \Illuminate\Http\JsonResponse
    {
        $suggestions = $this->automationService->getReorderSuggestions();
        $suggestion = $suggestions->firstWhere('id', $medicineId);

        if (!$suggestion) {
            return response()->json(['error' => 'Suggestion not found'], 404);
        }

        // Here you would integrate with your purchase order system
        // For now, we'll return the suggested purchase order data
        $purchaseOrder = [
            'medicine_id' => $suggestion['id'],
            'medicine_name' => $suggestion['medicine_name'],
            'supplier_id' => $suggestion['preferred_supplier']['id'] ?? null,
            'supplier_name' => $suggestion['preferred_supplier']['name'] ?? 'No preferred supplier',
            'quantity' => $suggestion['suggested_quantity'],
            'estimated_cost' => $suggestion['estimated_cost'],
            'urgency_level' => $suggestion['urgency_level'],
            'notes' => $suggestion['reason'],
        ];

        return response()->json([
            'success' => true,
            'purchase_order' => $purchaseOrder,
            'message' => 'Purchase order data generated successfully'
        ]);
    }
}