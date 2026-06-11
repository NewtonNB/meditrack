<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "Creating admin user...\n";

try {
    $user = User::create([
        'name' => 'System Admin',
        'email' => 'admin@meditrack.com',
        'password' => bcrypt('admin123'),
        'role' => 'super_admin',
        'pharmacy_id' => null,
    ]);
    
    $user->assignRole('super_admin');
    
    echo "✅ Admin user created successfully!\n";
    echo "Email: admin@meditrack.com\n";
    echo "Password: admin123\n";
    echo "\n";
    echo "⚠️  Please change this password after first login!\n";
    
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
        echo "⚠️  Admin user already exists with email: admin@meditrack.com\n";
    } else {
        echo "❌ Error creating admin user: " . $e->getMessage() . "\n";
    }
}
?>