<?php

use App\Models\User;

test('new users can register via API register endpoint', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertStatus(201)
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

    $this->assertDatabaseHas('users', [
        'email' => 'test@example.com',
    ]);
});
