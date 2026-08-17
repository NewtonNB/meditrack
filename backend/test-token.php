<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

$user = User::where('email', 'admin@mediTrack.com')->first();
if (!$user) {
    echo "User not found\n";
    exit(1);
}

$tokenResult = $user->createToken('test-api-token');
$plainText = $tokenResult->plainTextToken;
echo "Created token plainText: $plainText\n";

// Parse token
if (strpos($plainText, '|') !== false) {
    [$id, $token] = explode('|', $plainText, 2);
} else {
    $token = $plainText;
}

$model = PersonalAccessToken::findToken($plainText);
if ($model) {
    echo "Token successfully found in DB! User: " . $model->tokenable->email . "\n";
} else {
    echo "ERROR: Token NOT found in DB!\n";
}
