<?php
/**
 * Simple Database Explorer for database.sqlite
 * Run this script to see what's in your database
 */

// Database connection
$db = new PDO('sqlite:database/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== PHARMACY MANAGEMENT SYSTEM DATABASE EXPLORER ===\n\n";

try {
    // Get all tables
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
    
    echo "📊 TOTAL TABLES: " . count($tables) . "\n\n";
    
    foreach ($tables as $table) {
        echo "🗂️  TABLE: $table\n";
        
        // Get row count
        try {
            $count = $db->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
            echo "   📈 Records: $count\n";
        } catch (Exception $e) {
            echo "   ❌ Error counting records\n";
        }
        
        // Get table structure
        try {
            $columns = $db->query("PRAGMA table_info(`$table`)")->fetchAll(PDO::FETCH_ASSOC);
            echo "   📋 Columns: ";
            $columnNames = array_map(function($col) { return $col['name']; }, $columns);
            echo implode(', ', array_slice($columnNames, 0, 5));
            if (count($columnNames) > 5) {
                echo " ... (+" . (count($columnNames) - 5) . " more)";
            }
            echo "\n";
        } catch (Exception $e) {
            echo "   ❌ Error reading structure\n";
        }
        
        // Show sample data for key tables
        if (in_array($table, ['users', 'medicines', 'sales', 'customers']) && $count > 0) {
            try {
                $sample = $db->query("SELECT * FROM `$table` LIMIT 1")->fetch(PDO::FETCH_ASSOC);
                if ($sample) {
                    echo "   📄 Sample Record:\n";
                    foreach (array_slice($sample, 0, 3) as $key => $value) {
                        $displayValue = strlen($value) > 30 ? substr($value, 0, 30) . '...' : $value;
                        echo "      $key: $displayValue\n";
                    }
                }
            } catch (Exception $e) {
                echo "   ❌ Error reading sample data\n";
            }
        }
        
        echo "\n";
    }
    
    // Summary statistics
    echo "=== SUMMARY STATISTICS ===\n";
    
    $keyTables = [
        'users' => 'System Users',
        'medicines' => 'Medicine Inventory', 
        'sales' => 'Sales Transactions',
        'stock_movements' => 'Stock Movements',
        'customers' => 'Customer Records',
        'suppliers' => 'Supplier Contacts'
    ];
    
    foreach ($keyTables as $table => $description) {
        if (in_array($table, $tables)) {
            try {
                $count = $db->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
                echo sprintf("%-20s: %6d records\n", $description, $count);
            } catch (Exception $e) {
                echo sprintf("%-20s: %6s\n", $description, "Error");
            }
        }
    }
    
    // Database file info
    $dbFile = 'database/database.sqlite';
    if (file_exists($dbFile)) {
        $size = filesize($dbFile);
        $sizeFormatted = $size > 1024*1024 ? round($size/(1024*1024), 2) . ' MB' : round($size/1024, 2) . ' KB';
        echo "\n📁 Database File Size: $sizeFormatted\n";
        echo "📅 Last Modified: " . date('Y-m-d H:i:s', filemtime($dbFile)) . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== HOW TO ACCESS YOUR DATA ===\n";
echo "1. 🖥️  System Monitor: /system-monitor (Pharmacy Admin+)\n";
echo "2. 🗄️  Database Browser: /database-browser (Super Admin only)\n";
echo "3. 📊 Individual Pages: /users, /medicines, /sales, etc.\n";
echo "4. 🔧 DB Browser Tool: Download 'DB Browser for SQLite'\n";

echo "\n✅ Database exploration complete!\n";
?>