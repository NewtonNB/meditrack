<?php

use App\Models\Medicine;
use App\Models\Supplier;
use App\Models\User;
use App\Services\AutomationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'role' => 'pharmacy_admin'
    ]);
    
    $this->supplier = Supplier::factory()->create();
    $this->automationService = app(AutomationService::class);
    
    $this->actingAs($this->user);
});

describe('Reorder Suggestions', function () {
    
    it('identifies medicines that need reordering', function () {
        // Create medicine with low stock
        Medicine::factory()->create([
            'name' => 'Low Stock Medicine',
            'stock' => 5,
            'reorder_level' => 20,
            'supplier_id' => $this->supplier->id
        ]);
        
        // Create medicine with adequate stock
        Medicine::factory()->create([
            'name' => 'Adequate Stock Medicine',
            'stock' => 50,
            'reorder_level' => 20,
            'supplier_id' => $this->supplier->id
        ]);
        
        $suggestions = $this->automationService->getReorderSuggestions();
        
        expect($suggestions)->toHaveCount(1);
        expect($suggestions->first()['medicine_name'])->toBe('Low Stock Medicine');
    });
    
    it('calculates urgency scores correctly', function () {
        // Create critical stock medicine
        $criticalMedicine = Medicine::factory()->create([
            'stock' => 2,
            'reorder_level' => 20,
            'supplier_id' => $this->supplier->id
        ]);
        
        $suggestions = $this->automationService->getReorderSuggestions();
        $suggestion = $suggestions->first();
        
        expect($suggestion['urgency_level'])->toBeIn(['high', 'critical']);
        expect($suggestion['urgency_score'])->toBeGreaterThan(50);
    });
    
    it('suggests appropriate quantities for reordering', function () {
        Medicine::factory()->create([
            'stock' => 5,
            'reorder_level' => 20,
            'cost_price' => 10.00,
            'supplier_id' => $this->supplier->id
        ]);
        
        $suggestions = $this->automationService->getReorderSuggestions();
        $suggestion = $suggestions->first();
        
        expect($suggestion['suggested_quantity'])->toBeGreaterThan(0);
        expect($suggestion['estimated_cost'])->toBeGreaterThan(0);
    });
});

describe('Expiry Reminders', function () {
    
    it('identifies medicines expiring soon', function () {
        // Create medicine expiring in 10 days
        Medicine::factory()->create([
            'name' => 'Expiring Soon',
            'expiry_date' => Carbon::now()->addDays(10),
            'stock' => 50,
            'selling_price' => 15.00,
            'supplier_id' => $this->supplier->id
        ]);
        
        // Create medicine with distant expiry
        Medicine::factory()->create([
            'name' => 'Long Expiry',
            'expiry_date' => Carbon::now()->addYear(),
            'stock' => 30,
            'supplier_id' => $this->supplier->id
        ]);
        
        $reminders = $this->automationService->getExpiryReminders();
        
        expect($reminders)->toHaveCount(1);
        expect($reminders->first()['medicine_name'])->toBe('Expiring Soon');
    });
    
    it('calculates potential losses from expiry', function () {
        Medicine::factory()->create([
            'expiry_date' => Carbon::now()->addDays(5),
            'stock' => 100,
            'selling_price' => 20.00,
            'supplier_id' => $this->supplier->id
        ]);
        
        $reminders = $this->automationService->getExpiryReminders();
        $reminder = $reminders->first();
        
        expect($reminder['estimated_loss'])->toBe(2000.00); // 100 * 20.00
        expect($reminder['urgency_level'])->toBe('critical');
    });
    
    it('suggests appropriate discount percentages', function () {
        Medicine::factory()->create([
            'expiry_date' => Carbon::now()->addDays(3), // Very soon
            'stock' => 50,
            'supplier_id' => $this->supplier->id
        ]);
        
        $reminders = $this->automationService->getExpiryReminders();
        $reminder = $reminders->first();
        
        expect($reminder['discount_percentage'])->toBeGreaterThan(30);
        expect($reminder['urgency_level'])->toBe('critical');
    });
});

describe('Dashboard Summary', function () {
    
    it('provides comprehensive automation summary', function () {
        // Create test data
        Medicine::factory()->create([
            'stock' => 5,
            'reorder_level' => 20,
            'supplier_id' => $this->supplier->id
        ]);
        
        Medicine::factory()->create([
            'expiry_date' => Carbon::now()->addDays(15),
            'stock' => 30,
            'selling_price' => 10.00,
            'supplier_id' => $this->supplier->id
        ]);
        
        $summary = $this->automationService->getDashboardSummary();
        
        expect($summary)->toHaveKeys([
            'reorder_suggestions',
            'expiry_reminders',
            'quick_actions'
        ]);
        
        expect($summary['reorder_suggestions']['total'])->toBeGreaterThan(0);
        expect($summary['expiry_reminders']['total'])->toBeGreaterThan(0);
    });
    
    it('generates quick actions for urgent items', function () {
        // Create critical reorder situation
        Medicine::factory()->create([
            'stock' => 1,
            'reorder_level' => 20,
            'supplier_id' => $this->supplier->id
        ]);
        
        $summary = $this->automationService->getDashboardSummary();
        
        expect($summary['quick_actions'])->not()->toBeEmpty();
        expect($summary['quick_actions'][0]['priority'])->toBeIn(['high', 'critical']);
    });
});

describe('Automation API Endpoints', function () {
    
    it('returns automation data via API', function () {
        $response = $this->getJson(route('automation.data'));
        
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'reorder_suggestions' => [
                        'total',
                        'critical',
                        'high',
                        'estimated_cost'
                    ],
                    'expiry_reminders' => [
                        'total',
                        'critical',
                        'high',
                        'potential_loss'
                    ],
                    'quick_actions'
                ]);
    });
    
    it('can mark reorder suggestions as actioned', function () {
        $medicine = Medicine::factory()->create([
            'stock' => 5,
            'reorder_level' => 20,
            'supplier_id' => $this->supplier->id
        ]);
        
        $response = $this->postJson(route('automation.reorder.action', $medicine), [
            'action' => 'ordered'
        ]);
        
        $response->assertStatus(200)
                ->assertJson(['success' => true]);
    });
    
    it('can mark expiry reminders as handled', function () {
        $medicine = Medicine::factory()->create([
            'expiry_date' => Carbon::now()->addDays(10),
            'stock' => 30,
            'supplier_id' => $this->supplier->id
        ]);
        
        $response = $this->postJson(route('automation.expiry.action', $medicine), [
            'action' => 'discounted'
        ]);
        
        $response->assertStatus(200)
                ->assertJson(['success' => true]);
    });
});

describe('Performance and Caching', function () {
    
    it('caches automation results for performance', function () {
        // First call should hit the database
        $start = microtime(true);
        $suggestions1 = $this->automationService->getReorderSuggestions();
        $time1 = microtime(true) - $start;
        
        // Second call should be faster (cached)
        $start = microtime(true);
        $suggestions2 = $this->automationService->getReorderSuggestions();
        $time2 = microtime(true) - $start;
        
        expect($suggestions1)->toEqual($suggestions2);
        expect($time2)->toBeLessThan($time1);
    });
    
    it('handles large datasets efficiently', function () {
        // Create many medicines
        Medicine::factory()->count(100)->create([
            'supplier_id' => $this->supplier->id
        ]);
        
        $start = microtime(true);
        $suggestions = $this->automationService->getReorderSuggestions();
        $executionTime = microtime(true) - $start;
        
        // Should complete within reasonable time (1 second)
        expect($executionTime)->toBeLessThan(1.0);
    });
});