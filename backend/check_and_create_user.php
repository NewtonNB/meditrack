<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "==========================================\n";
echo "  MediTrack User Check & Creation\n";
echo "==========================================\n\n";

// Check if users exist
$users = User::all();
echo "📊 Total users in database: " . count($users) . "\n";

if (count($users) > 0) {
    echo "\n✅ Existing users:\n";
    foreach ($users as $user) {
        echo "   - {$user->email} (Role: {$user->role})\n";
    }
} else {
    echo "\n⚠️  No users found. Creating admin user...\n";
    
    try {
        $user = User::create([
            'name' => 'System Admin',
            'email' => 'admin@meditrack.com',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'pharmacy_id' => null,
        ]);
        
        echo "\n✅ Admin user created successfully!\n";
        echo "   Email: admin@meditrack.com\n";
        echo "   Password: admin123\n";
        
    } catch (Exception $e) {
        echo "\n❌ Error: " . $e->getMessage() . "\n";
    }
}

echo "\n==========================================\n";
echo "✨ Setup complete! Try logging in now.\n";
echo "==========================================\n";
?>
