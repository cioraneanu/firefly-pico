<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class AssistantRamble extends BaseModel
{
    protected $fillable = [
        'text', 'user_id'
    ];

    public function scopeAllowed(Builder $query)
    {
        return $query->where('user_id', getUserId());
    }
}
