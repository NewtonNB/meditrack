<?php

use App\Models\User;

test('profile data can be retrieved via API', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->getJson('/api/profile');

    $response->assertStatus(200)
             ->assertJsonStructure([
                 'user' => [
                     'id',
                     'name',
                     'email',
                 ]
             ]);
});

test('profile information can be updated via API', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/profile', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response->assertStatus(200)
             ->assertJsonStructure(['message', 'user']);

    $user->refresh();

    $this->assertSame('Test User', $user->name);
    $this->assertSame('test@example.com', $user->email);
});

test('email verification status is unchanged when the email address is unchanged via API', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/profile', [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response->assertStatus(200);

    $this->assertNotNull($user->refresh()->email_verified_at);
});

test('user can delete their account via API', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->deleteJson('/api/profile', [
            'password' => 'password',
        ]);

    $response->assertStatus(200)
             ->assertJson(['message' => 'Account deleted.']);

    $this->assertNull($user->fresh());
});

test('correct password must be provided to delete account via API', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->deleteJson('/api/profile', [
            'password' => 'wrong-password',
        ]);

    $response->assertStatus(422);

    $this->assertNotNull($user->fresh());
});
