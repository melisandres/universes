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
        Schema::table('logs', function (Blueprint $table) {
            // Drop the old foreign key constraint
            $table->dropForeign(['task_id']);
            
            // Add polymorphic columns
            $table->string('loggable_type')->nullable()->after('id');
            $table->unsignedBigInteger('loggable_id')->nullable()->after('loggable_type');
        });
        
        // Migrate existing task_id data to polymorphic columns
        DB::table('logs')
            ->whereNotNull('task_id')
            ->update([
                'loggable_type' => 'App\Models\Task',
                'loggable_id' => DB::raw('task_id'),
            ]);
        
        Schema::table('logs', function (Blueprint $table) {
            // Drop the old task_id column
            $table->dropColumn('task_id');
            
            // Add index for polymorphic relationship
            $table->index(['loggable_type', 'loggable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('logs', function (Blueprint $table) {
            // Drop polymorphic columns and index
            $table->dropIndex(['loggable_type', 'loggable_id']);
            $table->dropColumn(['loggable_type', 'loggable_id']);
            
            // Restore task_id column
            $table->foreignId('task_id')->nullable()->constrained()->nullOnDelete();
        });
    }
};
