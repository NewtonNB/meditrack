<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;

test('reset password link can be requested via API', function () {
    Notification::fake();

    $user = User::factory()->create();

    $response = $this->postJson('/api/auth/forgot-password', ['email' => $user->email]);

    $response->assertStatus(200)
             ->assertJsonStructure(['status', 'message']);

    Notification::assertSentTo($user, ResetPassword::class);
});

test('password can be reset with valid token via API', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->postJson('/api/auth/forgot-password', ['email' => $user->email]);

    Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $notification->token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['status', 'message']);

        return true;
    });
});
