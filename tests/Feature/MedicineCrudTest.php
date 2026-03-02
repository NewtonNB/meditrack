<?php

use App\Models\Medicine;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create a test user with proper permissions
    $this->user = User::factory()->create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'role' => 'pharmacy_admin'
    ]);
    
    // Create a test supplier
    $this->supplier = Supplier::factory()->create([
        'name' => 'Test Supplier',
        'email' => 'supplier@example.com',
        'phone' => '1234567890'
    ]);
    
    $this->actingAs($this->user);
});

describe('Medicine CRUD Operations', function () {
    
    it('can display medicines index page', function () {
        // Create some test medicines
        Medicine::factory()->count(3)->create([
            'supplier_id' => $this->supplier->id
        ]);
        
        $response = $this->get(route('medicines.index'));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Medicines/Index')
                ->has('medicines.data', 3)
        );
    });
    
    it('can create a new medicine', function () {
        $medicineData = [
            'name' => 'Test Medicine',
            'code' => 'TEST001',
            'brand' => 'Test Brand',
            'batch_number' => 'BATCH001',
            'expiry_date' => now()->addYear()->format('Y-m-d'),
            'cost_price' => 10.50,
            'selling_price' => 15.75,
            'stock' => 100,
            'supplier_id' => $this->supplier->id,
            'reorder_level' => 20,
            'category' => 'general',
            'is_prescription' => false
        ];
        
        $response = $this->post(route('medicines.store'), $medicineData);
        
        $response->assertRedirect();
        $this->assertDatabaseHas('medicines', [
            'name' => 'Test Medicine',
            'code' => 'TEST001',
            'supplier_id' => $this->supplier->id
        ]);
    });
    
    it('validates required fields when creating medicine', function () {
        $response = $this->post(route('medicines.store'), []);
        
        $response->assertSessionHasErrors(['name', 'code']);
    });
    
    it('can show a specific medicine', function () {
        $medicine = Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'name' => 'Show Test Medicine'
        ]);
        
        $response = $this->get(route('medicines.show', $medicine));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('Medicines/Show')
                ->where('medicine.name', 'Show Test Medicine')
        );
    });
    
    it('can update an existing medicine', function () {
        $medicine = Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'name' => 'Original Name'
        ]);
        
        $updateData = [
            'name' => 'Updated Medicine Name',
            'code' => $medicine->code,
            'brand' => $medicine->brand,
            'cost_price' => 12.00,
            'selling_price' => 18.00,
            'stock' => 150,
            'supplier_id' => $this->supplier->id,
            'reorder_level' => 25
        ];
        
        $response = $this->put(route('medicines.update', $medicine), $updateData);
        
        $response->assertRedirect();
        $this->assertDatabaseHas('medicines', [
            'id' => $medicine->id,
            'name' => 'Updated Medicine Name',
            'cost_price' => 12.00
        ]);
    });
    
    it('can delete a medicine', function () {
        $medicine = Medicine::factory()->create([
            'supplier_id' => $this->supplier->id
        ]);
        
        $response = $this->delete(route('medicines.destroy', $medicine));
        
        $response->assertRedirect();
        $this->assertDatabaseMissing('medicines', [
            'id' => $medicine->id
        ]);
    });
    
    it('can search medicines by name', function () {
        Medicine::factory()->create([
            'name' => 'Paracetamol 500mg',
            'supplier_id' => $this->supplier->id
        ]);
        
        Medicine::factory()->create([
            'name' => 'Ibuprofen 400mg',
            'supplier_id' => $this->supplier->id
        ]);
        
        $response = $this->get(route('medicines.index', ['search' => 'Paracetamol']));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->has('medicines.data', 1)
                ->where('medicines.data.0.name', 'Paracetamol 500mg')
        );
    });
    
    it('can filter medicines by supplier', function () {
        $anotherSupplier = Supplier::factory()->create();
        
        Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'name' => 'Medicine from Supplier 1'
        ]);
        
        Medicine::factory()->create([
            'supplier_id' => $anotherSupplier->id,
            'name' => 'Medicine from Supplier 2'
        ]);
        
        $response = $this->get(route('medicines.index', ['supplier_id' => $this->supplier->id]));
        
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->has('medicines.data', 1)
                ->where('medicines.data.0.supplier_id', $this->supplier->id)
        );
    });
    
    it('calculates low stock medicines correctly', function () {
        // Create medicine with stock below reorder level
        Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'stock' => 5,
            'reorder_level' => 10,
            'name' => 'Low Stock Medicine'
        ]);
        
        // Create medicine with adequate stock
        Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'stock' => 50,
            'reorder_level' => 10,
            'name' => 'Adequate Stock Medicine'
        ]);
        
        $lowStockCount = Medicine::whereRaw('stock <= reorder_level')->count();
        
        expect($lowStockCount)->toBe(1);
    });
    
    it('handles expiry date validation', function () {
        $pastDate = now()->subDays(30)->format('Y-m-d');
        
        $response = $this->post(route('medicines.store'), [
            'name' => 'Expired Medicine',
            'code' => 'EXP001',
            'expiry_date' => $pastDate,
            'cost_price' => 10.00,
            'selling_price' => 15.00,
            'stock' => 10,
            'supplier_id' => $this->supplier->id,
            'reorder_level' => 5
        ]);
        
        $response->assertSessionHasErrors(['expiry_date']);
    });
    
    it('can bulk update medicine prices', function () {
        $medicines = Medicine::factory()->count(3)->create([
            'supplier_id' => $this->supplier->id,
            'cost_price' => 10.00,
            'selling_price' => 15.00
        ]);
        
        $updateData = [
            'medicine_ids' => $medicines->pluck('id')->toArray(),
            'price_increase_percentage' => 10
        ];
        
        $response = $this->post(route('medicines.bulk-update-prices'), $updateData);
        
        $response->assertRedirect();
        
        foreach ($medicines as $medicine) {
            $this->assertDatabaseHas('medicines', [
                'id' => $medicine->id,
                'cost_price' => 11.00, // 10% increase
                'selling_price' => 16.50 // 10% increase
            ]);
        }
    });
});

describe('Medicine Business Logic', function () {
    
    it('calculates profit margin correctly', function () {
        $medicine = Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'cost_price' => 10.00,
            'selling_price' => 15.00
        ]);
        
        $profitMargin = (($medicine->selling_price - $medicine->cost_price) / $medicine->cost_price) * 100;
        
        expect($profitMargin)->toBe(50.0);
    });
    
    it('identifies medicines needing reorder', function () {
        Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'stock' => 5,
            'reorder_level' => 10,
            'name' => 'Needs Reorder'
        ]);
        
        Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'stock' => 20,
            'reorder_level' => 10,
            'name' => 'Stock OK'
        ]);
        
        $needsReorder = Medicine::whereRaw('stock <= reorder_level')->get();
        
        expect($needsReorder)->toHaveCount(1);
        expect($needsReorder->first()->name)->toBe('Needs Reorder');
    });
    
    it('tracks medicine stock movements', function () {
        $medicine = Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'stock' => 100
        ]);
        
        // Simulate a sale (stock reduction)
        $medicine->update(['stock' => 95]);
        
        expect($medicine->fresh()->stock)->toBe(95);
    });
});

describe('Medicine API Endpoints', function () {
    
    it('returns medicines as JSON for API requests', function () {
        Medicine::factory()->count(2)->create([
            'supplier_id' => $this->supplier->id
        ]);
        
        $response = $this->getJson('/api/medicines');
        
        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'code',
                            'stock',
                            'selling_price'
                        ]
                    ]
                ]);
    });
    
    it('can search medicines via API', function () {
        Medicine::factory()->create([
            'name' => 'Aspirin 100mg',
            'supplier_id' => $this->supplier->id
        ]);
        
        $response = $this->getJson('/api/medicines/search?q=Aspirin');
        
        $response->assertStatus(200)
                ->assertJsonFragment(['name' => 'Aspirin 100mg']);
    });
});