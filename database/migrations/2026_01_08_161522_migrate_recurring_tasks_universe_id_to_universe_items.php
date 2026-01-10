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
        // Copy existing recurring_tasks.universe_id to universe_items
        $recurringTasks = \App\Models\RecurringTask::whereNotNull('universe_id')->get();
        
        foreach ($recurringTasks as $rt) {
            \App\Models\UniverseItem::create([
                'universe_id' => $rt->universe_id,
                'item_type' => 'recurring_task',
                'item_id' => $rt->id,
                'is_primary' => true, // Mark existing as primary
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove universe_items for recurring_tasks
        \App\Models\UniverseItem::where('item_type', 'recurring_task')->delete();
    }
};
