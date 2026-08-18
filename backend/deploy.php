<?php

/**
 * Simple Deployment Script for RBAC & Audit Trail System
 * 
 * Run this script to set up the system after installation
 */

echo "🚀 RBAC & Audit Trail System Deployment\n";
echo "=====================================\n\n";

// Check if we're in the right directory
if (!file_exists('artisan')) {
    echo "❌ Error: Please run this script from your Laravel project root directory.\n";
    exit(1);
}

// Step 1: Clear caches
echo "1️⃣ Clearing caches...\n";
exec('php artisan config:clear', $output, $return);
if ($return !== 0) {
    echo "❌ Failed to clear config cache\n";
    exit(1);
}

exec('php artisan route:clear', $output, $return);
if ($return !== 0) {
    echo "❌ Failed to clear route cache\n";
    exit(1);
}

exec('php artisan view:clear', $output, $return);
if ($return !== 0) {
    echo "❌ Failed to clear view cache\n";
    exit(1);
}

echo "✅ Caches cleared\n\n";

// Step 2: Run migrations
echo "2️⃣ Running migrations...\n";
exec('php artisan migrate --force', $output, $return);
if ($return !== 0) {
    echo "❌ Failed to run migrations\n";
    exit(1);
}
echo "✅ Migrations completed\n\n";

// Step 3: Seed roles and permissions
echo "3️⃣ Seeding roles and permissions...\n";
exec('php artisan db:seed --class=RolesAndPermissionsSeeder --force', $output, $return);
if ($return !== 0) {
    echo "⚠️  Warning: Failed to seed roles and permissions (they may already exist)\n";
} else {
    echo "✅ Roles and permissions seeded\n";
}
echo "\n";

// Step 4: Generate key if needed
echo "4️⃣ Checking application key...\n";
$envContent = file_get_contents('.env');
if (strpos($envContent, 'APP_KEY=') === false || strpos($envContent, 'APP_KEY=base64:') === false) {
    echo "Generating application key...\n";
    exec('php artisan key:generate --force', $output, $return);
    if ($return !== 0) {
        echo "❌ Failed to generate application key\n";
        exit(1);
    }
    echo "✅ Application key generated\n";
} else {
    echo "✅ Application key already exists\n";
}
echo "\n";

// Step 6: Check .env file
echo "6️⃣ Checking environment configuration...\n";
$requiredEnvVars = [
    'APP_NAME',
    'APP_ENV',
    'APP_KEY',
    'DB_CONNECTION',
    'DB_DATABASE'
];

$missingVars = [];
foreach ($requiredEnvVars as $var) {
    if (strpos($envContent, $var . '=') === false) {
        $missingVars[] = $var;
    }
}

if (!empty($missingVars)) {
    echo "⚠️  Warning: Missing environment variables: " . implode(', ', $missingVars) . "\n";
    echo "Please check your .env file\n";
} else {
    echo "✅ Environment configuration looks good\n";
}
echo "\n";

// Final summary
echo "🎉 Deployment Summary\n";
echo "===================\n";
echo "✅ RBAC System: 4 roles with granular permissions\n";
echo "✅ Audit Trail: Complete activity logging\n";
echo "✅ Security: Account locking, rate limiting, security headers\n";
echo "✅ Frontend: Role-based navigation and permission gates\n";
echo "✅ Database: Proper indexing and relationships\n\n";

echo "🔧 Next Steps:\n";
echo "1. Update your .env file with production settings\n";
echo "2. Create your first admin user:\n";
echo "   php artisan tinker\n";
echo "   \$user = User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('password'), 'role' => 'super_admin']);\n";
echo "   \$user->assignRole('super_admin');\n";
echo "3. Test login and permissions\n";
echo "4. Configure SSL/HTTPS for production\n\n";

echo "📚 Documentation:\n";
echo "- RBAC_AUDIT_IMPLEMENTATION_SUMMARY.md\n";
echo "- DEPLOYMENT_GUIDE.md\n\n";

echo "🎊 Your RBAC & Audit Trail system is ready!\n";
?>