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
        // Copy existing tasks.universe_id to universe_items
        $tasks = \App\Models\Task::whereNotNull('universe_id')->get();
        
        foreach ($tasks as $task) {
            \App\Models\UniverseItem::create([
                'universe_id' => $task->universe_id,
                'item_type' => 'task',
                'item_id' => $task->id,
                'is_primary' => true, // Mark existing as primary
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove universe_items for tasks
        \App\Models\UniverseItem::where('item_type', 'task')->delete();
    }
};
