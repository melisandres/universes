<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, delete any orphan logs (logs without loggable_type or loggable_id)
        DB::table('logs')
            ->whereNull('loggable_type')
            ->orWhereNull('loggable_id')
            ->delete();
        
        // Keep loggable_type and loggable_id nullable to allow standalone logs
        // (No change needed - they should remain nullable)
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Make loggable_type and loggable_id nullable again
        Schema::table('logs', function (Blueprint $table) {
            $table->string('loggable_type')->nullable()->change();
            $table->unsignedBigInteger('loggable_id')->nullable()->change();
        });
    }
};
