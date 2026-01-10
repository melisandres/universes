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
        Schema::create('universe_items', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('universe_id')
                  ->constrained()
                  ->cascadeOnDelete();
            
            $table->string('item_type'); // 'task', 'recurring_task', 'idea', 'later_project', etc.
            $table->unsignedBigInteger('item_id');
            $table->boolean('is_primary')->nullable();
            
            $table->timestamps();
            
            // Index for polymorphic relationship lookups
            $table->index(['item_type', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('universe_items');
    }
};
