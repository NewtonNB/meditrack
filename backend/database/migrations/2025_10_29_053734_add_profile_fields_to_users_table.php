<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->text('address')->nullable()->after('phone');
            $table->text('bio')->nullable()->after('address');
            $table->date('date_of_birth')->nullable()->after('bio');
            $table->string('avatar')->nullable()->after('date_of_birth');
            $table->json('emergency_contact')->nullable()->after('avatar');
            $table->timestamp('last_login_at')->nullable()->after('emergency_contact');
            $table->integer('login_count')->default(0)->after('last_login_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'address', 
                'bio',
                'date_of_birth',
                'avatar',
                'emergency_contact',
                'last_login_at',
                'login_count'
            ]);
        });
    }
};