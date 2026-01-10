<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'name',
        'estimated_time',
        'description',
        'recurring_task_id',
        'deadline_at',
        'completed_at',
        'skipped_at',
        'snooze_until',
        'status',
    ];

    protected $casts = [
        'estimated_time' => 'integer',
        'deadline_at' => 'datetime',
        'completed_at' => 'datetime',
        'skipped_at' => 'datetime',
        'snooze_until' => 'datetime',
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

    public function recurringTask()
    {
        return $this->belongsTo(RecurringTask::class);
    }

    public function logs()
    {
        return $this->morphMany(Log::class, 'loggable');
    }

    public function isRecurring()
    {
        return $this->recurring_task_id !== null;
    }

    // Universe items relationship (polymorphic)
    public function universeItems()
    {
        return $this->morphMany(UniverseItem::class, 'item', 'item_type', 'item_id');
    }

    // Scopes
    public function scopeIncomplete($query)
    {
        return $query->whereNull('completed_at');
    }

    public function scopeNotSnoozed($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('snooze_until')
              ->orWhere('snooze_until', '<=', now());
        });
    }

    // Boot method to auto-update "late" status based on deadline
    protected static function boot()
    {
        parent::boot();

        // Update status to "late" if deadline has passed (on save/update)
        static::saving(function ($task) {
            // Only update if task is not completed or skipped
            if ($task->completed_at === null && $task->skipped_at === null) {
                if ($task->deadline_at && $task->deadline_at->isPast() && !$task->deadline_at->isToday()) {
                    $task->status = 'late';
                } elseif ($task->status === 'late' && $task->deadline_at && !$task->deadline_at->isPast()) {
                    // If deadline is in the future, change back to open
                    $task->status = 'open';
                }
            }
        });
    }

    // Helper method to get computed status (for display)
    public function getComputedStatus(): string
    {
        if ($this->completed_at !== null) {
            return 'completed';
        }
        if ($this->skipped_at !== null) {
            return 'skipped';
        }
        if ($this->deadline_at && $this->deadline_at->isPast() && !$this->deadline_at->isToday()) {
            return 'late';
        }
        return $this->status ?: 'open';
    }
}
