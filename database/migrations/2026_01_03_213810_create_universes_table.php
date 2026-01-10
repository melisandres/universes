<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('universes', function (Blueprint $table) {
            $table->id();
    
            $table->string('name');
    
            // Self-referencing parent
            $table->unsignedBigInteger('parent_id')->nullable();
    
            // Attention / lifecycle status
            $table->string('status')->default('not_started');
    
            $table->timestamps();
        });

        // Add foreign key constraint separately for self-referencing table
        Schema::table('universes', function (Blueprint $table) {
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('universes')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('universes');
    }
};
