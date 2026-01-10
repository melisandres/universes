<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdeaPool extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    public function ideas()
    {
        return $this->belongsToMany(Idea::class, 'idea_pool_ideas')
                    ->withPivot('primary_pool')
                    ->withTimestamps();
    }

    public function primaryIdeas()
    {
        return $this->ideas()->wherePivot('primary_pool', true)->get();
    }

    public function secondaryIdeas()
    {
        return $this->ideas()->wherePivot('primary_pool', false)->get();
    }

    // Universe items relationship (polymorphic)
    public function universeItems()
    {
        return $this->morphMany(UniverseItem::class, 'item', 'item_type', 'item_id');
    }

    // Get primary universe through universe_items
    public function getUniverseAttribute()
    {
        if (!$this->relationLoaded('universeItems')) {
            $this->load('universeItems.universe');
        }
        
        $universeItem = $this->universeItems->where('is_primary', true)->first();
        return $universeItem ? $universeItem->universe : null;
    }
}
