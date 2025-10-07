<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Drop the existing enum column
            $table->dropColumn('payment_method');
        });

        Schema::table('sales', function (Blueprint $table) {
            // Recreate the column with new enum values
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer', 'transfer', 'check'])->default('cash')->after('customer_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Drop the column
            $table->dropColumn('payment_method');
        });

        Schema::table('sales', function (Blueprint $table) {
            // Recreate with original enum values
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer'])->default('cash')->after('customer_phone');
        });
    }
};
