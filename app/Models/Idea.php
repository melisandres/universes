<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Idea extends Model
{
    protected $fillable = [
        'title',
        'body',
        'notes',
        'status',
    ];

    public function ideaPools()
    {
        return $this->belongsToMany(IdeaPool::class, 'idea_pool_ideas')
                    ->withPivot('primary_pool')
                    ->withTimestamps();
    }

    public function primaryPool()
    {
        return $this->ideaPools()->wherePivot('primary_pool', true)->first();
    }

    public function secondaryPools()
    {
        return $this->ideaPools()->wherePivot('primary_pool', false)->get();
    }

    // Universe items relationship (polymorphic)
    public function universeItems()
    {
        return $this->morphMany(UniverseItem::class, 'item', 'item_type', 'item_id');
    }

    public function logs()
    {
        return $this->morphMany(Log::class, 'loggable');
    }
}
