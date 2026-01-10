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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('universe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recurring_task_id')->nullable()->constrained()->nullOnDelete();

            $table->string('name');
            $table->timestamp('deadline_at')->nullable();

            $table->timestamp('completed_at')->nullable();
            $table->timestamp('skipped_at')->nullable();

            $table->string('status')->default('open'); // open, completed, skipped, late

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
