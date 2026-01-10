<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class RecurringTask extends Model
{
    protected $fillable = [
        'name',
        'estimated_time',
        'description',
        'frequency_unit',
        'frequency_interval',
        'default_duration_minutes',
        'notes',
        'active',
    ];

    protected $casts = [
        'estimated_time' => 'integer',
        'frequency_interval' => 'integer',
        'default_duration_minutes' => 'integer',
        'active' => 'boolean',
    ];

    // Get primary universe through universe_items
    // Using an accessor so it works with eager loading
    public function getUniverseAttribute()
    {
        if (!$this->relationLoaded('universeItems')) {
            $this->load('universeItems.universe');
        }
        
        $universeItem = $this->universeItems->where('is_primary', true)->first();
        return $universeItem ? $universeItem->universe : null;
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function nextDeadline(Carbon $from)
    {
        $interval = (int) $this->frequency_interval;
        // Use copy() to avoid mutating the original Carbon object
        $fromCopy = $from->copy();
        return match ($this->frequency_unit) {
            'day' => $fromCopy->addDays($interval),
            'week' => $fromCopy->addWeeks($interval),
            'month' => $fromCopy->addMonths($interval),
            default => $fromCopy,
        };
    }

    // Universe items relationship (polymorphic)
    public function universeItems()
    {
        return $this->morphMany(UniverseItem::class, 'item', 'item_type', 'item_id');
    }
}

