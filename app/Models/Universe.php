<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Universe extends Model
{
    protected $fillable = [
        'name',
        'parent_id',
        'status',
    ];

    // Parent universe
    public function parent()
    {
        return $this->belongsTo(Universe::class, 'parent_id');
    }

    // Child universes
    public function children()
    {
        return $this->hasMany(Universe::class, 'parent_id');
    }

    // Tasks in this universe through universe_items
    public function tasks()
    {
        return $this->hasManyThrough(
            Task::class,
            UniverseItem::class,
            'universe_id', // Foreign key on universe_items table
            'id', // Foreign key on tasks table
            'id', // Local key on universes table
            'item_id' // Local key on universe_items table
        )->where('universe_items.item_type', 'App\Models\Task');
    }

    // Primary tasks (where is_primary = true)
    public function primaryTasks()
    {
        return $this->hasManyThrough(
            Task::class,
            UniverseItem::class,
            'universe_id',
            'id',
            'id',
            'item_id'
        )->where('universe_items.item_type', 'App\Models\Task')
         ->where('universe_items.is_primary', true);
    }

    // Secondary tasks (where is_primary = false)
    public function secondaryTasks()
    {
        return $this->hasManyThrough(
            Task::class,
            UniverseItem::class,
            'universe_id',
            'id',
            'id',
            'item_id'
        )->where('universe_items.item_type', 'App\Models\Task')
         ->where('universe_items.is_primary', false);
    }

    // Universe items (polymorphic relationship for tasks, ideas, etc.)
    public function universeItems()
    {
        return $this->hasMany(UniverseItem::class);
    }

    // Scopes for Today view
    public function scopeVisibleForToday($query)
    {
        return $query->whereIn('status', ['in_focus', 'next_small_steps', 'in_orbit']);
    }

    public function scopeInvisibleForToday($query)
    {
        return $query->whereNotIn('status', ['in_focus', 'next_small_steps', 'in_orbit']);
    }
}
