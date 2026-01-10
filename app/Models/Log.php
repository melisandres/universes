<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Log extends Model
{
    protected $fillable = [
        'loggable_type',
        'loggable_id',
        'minutes',
        'notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function loggable()
    {
        return $this->morphTo();
    }

    // Convenience accessors for backward compatibility
    public function getTaskAttribute()
    {
        if ($this->loggable_type === 'App\Models\Task') {
            return $this->loggable;
        }
        return null;
    }

    public function getIdeaAttribute()
    {
        if ($this->loggable_type === 'App\Models\Idea') {
            return $this->loggable;
        }
        return null;
    }
}
