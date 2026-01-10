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
        // SQLite doesn't support dropping columns with foreign keys easily
        // We need to recreate the table without the universe_id column
        if (Schema::hasColumn('recurring_tasks', 'universe_id')) {
            Schema::table('recurring_tasks', function (Blueprint $table) {
                // For SQLite, we need to recreate the table
                // First, create a new table without universe_id
                DB::statement('
                    CREATE TABLE recurring_tasks_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                        name VARCHAR NOT NULL,
                        frequency_unit VARCHAR NOT NULL,
                        frequency_interval INTEGER NOT NULL DEFAULT 1,
                        active TINYINT(1) NOT NULL DEFAULT 1,
                        default_duration_minutes INTEGER,
                        notes TEXT,
                        created_at DATETIME,
                        updated_at DATETIME
                    )
                ');
                
                // Copy data
                DB::statement('
                    INSERT INTO recurring_tasks_new 
                    (id, name, frequency_unit, frequency_interval, active, default_duration_minutes, notes, created_at, updated_at)
                    SELECT id, name, frequency_unit, frequency_interval, active, default_duration_minutes, notes, created_at, updated_at
                    FROM recurring_tasks
                ');
                
                // Drop old table
                DB::statement('DROP TABLE recurring_tasks');
                
                // Rename new table
                DB::statement('ALTER TABLE recurring_tasks_new RENAME TO recurring_tasks');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recurring_tasks', function (Blueprint $table) {
            $table->foreignId('universe_id')->nullable()->constrained()->nullOnDelete();
        });
    }
};
