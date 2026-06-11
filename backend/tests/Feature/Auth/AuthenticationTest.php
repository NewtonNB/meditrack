<?php

use App\Models\User;

test('users can authenticate via API login endpoint', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertStatus(200)
             ->assertJsonStructure([
                 'message',
                 'token',
                 'user' => [
                     'id',
                     'name',
                     'email',
                     'role',
                 ]
             ]);
});

test('users cannot authenticate with invalid password via API', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422)
             ->assertJsonStructure([
                 'message',
                 'errors'
             ]);
});

test('users can logout via API logout endpoint', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
    ])->postJson('/api/auth/logout');

    $response->assertStatus(200)
             ->assertJson([
                 'message' => 'Logged out successfully.'
             ]);
});
