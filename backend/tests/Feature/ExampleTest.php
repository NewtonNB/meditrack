<?php

it('returns a successful response for API health endpoint', function () {
    $response = $this->getJson('/api/health');

    $response->assertStatus(200)
             ->assertJson(['status' => 'ok']);
});
