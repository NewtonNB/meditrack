<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('password can be updated via API', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertStatus(200)
             ->assertJson(['message' => 'Password changed.']);

    $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
});

test('correct password must be provided to update password via API', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/profile/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertStatus(422);
});
