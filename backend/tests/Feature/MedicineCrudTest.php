<?php

use App\Models\Medicine;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    \Illuminate\Support\Facades\Cache::flush();

    // Seed roles and permissions so hasPermissionTo() works in tests
    (new \Database\Seeders\RolesAndPermissionsSeeder())->run();

    $this->user = User::factory()->create([
        'name'  => 'Test User',
        'email' => 'test@example.com',
        'role'  => 'pharmacy_admin',
    ]);

    // Assign the pharmacy_admin role so permissions middleware works
    $this->user->assignRole('pharmacy_admin');

    $this->supplier = Supplier::factory()->create([
        'name'  => 'Test Supplier',
        'email' => 'supplier@example.com',
        'phone' => '1234567890',
    ]);

    $this->actingAs($this->user);
});

describe('Medicine CRUD Operations', function () {

    it('can list medicines via API', function () {
        Medicine::factory()->count(3)->create(['supplier_id' => $this->supplier->id]);

        $response = $this->getJson('/api/medicines');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data']);
    });

    it('can create a new medicine via API', function () {
        $medicineData = [
            'name'            => 'Test Medicine',
            'code'            => 'TEST001',
            'brand'           => 'Test Brand',
            'batch_number'    => 'BATCH001',
            'expiry_date'     => now()->addYear()->format('Y-m-d'),
            'cost_price'      => 10.50,
            'selling_price'   => 15.75,
            'stock'           => 100,
            'supplier_id'     => $this->supplier->id,
            'reorder_level'   => 20,
            'category'        => 'general',
            'is_prescription' => false,
        ];

        $response = $this->postJson('/api/medicines', $medicineData);

        $response->assertStatus(201)
                 ->assertJsonStructure(['message', 'medicine']);

        $this->assertDatabaseHas('medicines', [
            'name'        => 'Test Medicine',
            'supplier_id' => $this->supplier->id,
        ]);
    });

    it('validates required fields when creating medicine via API', function () {
        $response = $this->postJson('/api/medicines', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['name', 'cost_price', 'selling_price', 'stock']);
    });

    it('can update an existing medicine via API', function () {
        $medicine = Medicine::factory()->create([
            'supplier_id' => $this->supplier->id,
            'name'        => 'Original Name',
        ]);

        $updateData = [
            'name'          => 'Updated Medicine Name',
            'cost_price'    => 12.00,
            'selling_price' => 18.00,
            'stock'         => 150,
            'supplier_id'   => $this->supplier->id,
            'reorder_level' => 25,
        ];

        $response = $this->putJson("/api/medicines/{$medicine->id}", $updateData);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'medicine']);

        $this->assertDatabaseHas('medicines', [
            'id'   => $medicine->id,
            'name' => 'Updated Medicine Name',
        ]);
    });

    it('can delete a medicine via API', function () {
        $medicine = Medicine::factory()->create(['supplier_id' => $this->supplier->id]);

        $response = $this->deleteJson("/api/medicines/{$medicine->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure(['message']);

        $this->assertDatabaseMissing('medicines', ['id' => $medicine->id]);
    });

    it('can search medicines by name via API', function () {
        Medicine::factory()->create(['name' => 'Paracetamol 500mg', 'supplier_id' => $this->supplier->id]);
        Medicine::factory()->create(['name' => 'Ibuprofen 400mg',   'supplier_id' => $this->supplier->id]);

        $response = $this->getJson('/api/medicines?search=Paracetamol');

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(count($data))->toBe(1);
        expect($data[0]['name'])->toBe('Paracetamol 500mg');
    });

    it('can filter medicines by supplier via API', function () {
        $anotherSupplier = Supplier::factory()->create();

        Medicine::factory()->create(['supplier_id' => $this->supplier->id,     'name' => 'Med S1']);
        Medicine::factory()->create(['supplier_id' => $anotherSupplier->id, 'name' => 'Med S2']);

        $response = $this->getJson("/api/medicines?supplier_id={$this->supplier->id}");

        $response->assertStatus(200);
        $data = $response->json('data');
        expect(count($data))->toBe(1);
        expect($data[0]['name'])->toBe('Med S1');
    });

    it('calculates low stock medicines correctly', function () {
        Medicine::factory()->create(['supplier_id' => $this->supplier->id, 'stock' => 5,  'reorder_level' => 10, 'name' => 'Low Stock']);
        Medicine::factory()->create(['supplier_id' => $this->supplier->id, 'stock' => 50, 'reorder_level' => 10, 'name' => 'OK Stock']);

        $lowStockCount = Medicine::whereRaw('stock <= reorder_level')->count();

        expect($lowStockCount)->toBe(1);
    });

    it('can bulk delete medicines via API', function () {
        $medicines = Medicine::factory()->count(3)->create(['supplier_id' => $this->supplier->id]);

        $response = $this->postJson('/api/medicines/bulk-delete', [
            'ids' => $medicines->pluck('id')->toArray(),
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message']);

        foreach ($medicines as $medicine) {
            $this->assertDatabaseMissing('medicines', ['id' => $medicine->id]);
        }
    });
});

describe('Medicine Business Logic', function () {

    it('calculates profit margin correctly', function () {
        $medicine = Medicine::factory()->create([
            'supplier_id'   => $this->supplier->id,
            'cost_price'    => 10.00,
            'selling_price' => 15.00,
        ]);

        $profitMargin = (($medicine->selling_price - $medicine->cost_price) / $medicine->cost_price) * 100;

        expect($profitMargin)->toBe(50.0);
    });

    it('identifies medicines needing reorder', function () {
        Medicine::factory()->create(['supplier_id' => $this->supplier->id, 'stock' => 5,  'reorder_level' => 10, 'name' => 'Needs Reorder']);
        Medicine::factory()->create(['supplier_id' => $this->supplier->id, 'stock' => 20, 'reorder_level' => 10, 'name' => 'Stock OK']);

        $needsReorder = Medicine::whereRaw('stock <= reorder_level')->get();

        expect($needsReorder)->toHaveCount(1);
        expect($needsReorder->first()->name)->toBe('Needs Reorder');
    });

    it('tracks medicine stock movements', function () {
        $medicine = Medicine::factory()->create(['supplier_id' => $this->supplier->id, 'stock' => 100]);

        $medicine->update(['stock' => 95]);

        expect($medicine->fresh()->stock)->toBe(95);
    });
});

describe('Medicine API Endpoints', function () {

    it('returns medicines as JSON for API requests', function () {
        Medicine::factory()->count(2)->create(['supplier_id' => $this->supplier->id]);

        $response = $this->getJson('/api/medicines');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => ['id', 'name', 'stock', 'selling_price'],
                     ],
                 ]);
    });

    it('can search medicines via API query string', function () {
        Medicine::factory()->create(['name' => 'Aspirin 100mg', 'supplier_id' => $this->supplier->id]);

        $response = $this->getJson('/api/medicines?search=Aspirin');

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Aspirin 100mg']);
    });
});