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
        // Update existing item_type values from short names to full class names
        DB::table('universe_items')
            ->where('item_type', 'task')
            ->update(['item_type' => 'App\Models\Task']);
            
        DB::table('universe_items')
            ->where('item_type', 'recurring_task')
            ->update(['item_type' => 'App\Models\RecurringTask']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to short names
        DB::table('universe_items')
            ->where('item_type', 'App\Models\Task')
            ->update(['item_type' => 'task']);
            
        DB::table('universe_items')
            ->where('item_type', 'App\Models\RecurringTask')
            ->update(['item_type' => 'recurring_task']);
    }
};
