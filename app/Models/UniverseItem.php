<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UniverseItem extends Model
{
    protected $fillable = [
        'universe_id',
        'item_type',
        'item_id',
        'is_primary',
        'order',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function universe()
    {
        return $this->belongsTo(Universe::class);
    }

    public function item()
    {
        return $this->morphTo('item', 'item_type', 'item_id');
    }
}
