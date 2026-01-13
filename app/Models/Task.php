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
    // This computes status based on current state, not just database value
    public function getComputedStatus(): string
    {
        if ($this->completed_at !== null) {
            return 'completed';
        }
        if ($this->skipped_at !== null) {
            return 'skipped';
        }
        
        // If database status is "late", trust it (it was set by updateOverdueStatuses)
        // Check this FIRST before checking deadline
        // Try multiple ways to get the status value
        $statusValue = $this->getAttribute('status') ?? $this->status ?? null;
        if ($statusValue === 'late') {
            return 'late';
        }
        
        // Check deadline to determine if task is late
        // A task is late if deadline is in the past and not today
        if ($this->deadline_at) {
            // Ensure deadline_at is a Carbon instance
            $deadline = $this->deadline_at instanceof \Carbon\Carbon 
                ? $this->deadline_at 
                : \Carbon\Carbon::parse($this->deadline_at);
            
            if ($deadline->isPast() && !$deadline->isToday()) {
                return 'late';
            }
        }
        
        // Return the stored status or default to 'open'
        return $this->status ?: 'open';
    }

    /**
     * Update task statuses based on deadlines
     * This should be called periodically or when loading tasks to ensure
     * the database status field reflects the current deadline state
     */
    public static function updateOverdueStatuses()
    {
        $today = now()->copy()->startOfDay();
        
        // Update tasks that should be marked as late
        // Deadline is in the past (before today) and task is not completed/skipped
        static::whereNull('completed_at')
            ->whereNull('skipped_at')
            ->whereNotNull('deadline_at')
            ->where('deadline_at', '<', $today)
            ->where(function ($query) {
                $query->where('status', '!=', 'late')
                      ->orWhereNull('status');
            })
            ->update(['status' => 'late']);
        
        // Update tasks that were marked as late but deadline is now today or in the future
        static::whereNull('completed_at')
            ->whereNull('skipped_at')
            ->where('status', 'late')
            ->where(function ($query) use ($today) {
                $query->whereNull('deadline_at')
                      ->orWhere('deadline_at', '>=', $today);
            })
            ->update(['status' => 'open']);
    }

    /**
     * Format estimated time for display
     * Returns formatted string like "2h 30m" or "45m" or "1.5h"
     */
    public function getFormattedEstimatedTime(): ?string
    {
        if ($this->estimated_time === null) {
            return null;
        }

        $minutes = $this->estimated_time;
        
        // If less than 60 minutes, show as minutes
        if ($minutes < 60) {
            return "{$minutes}m";
        }
        
        // If divisible by 60, show as hours
        if ($minutes % 60 === 0) {
            $hours = $minutes / 60;
            return "{$hours}h";
        }
        
        // Otherwise show as hours and minutes
        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;
        return "{$hours}h {$remainingMinutes}m";
    }
}
