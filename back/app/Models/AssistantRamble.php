<?php

namespace App\Models;

use App\Models\Erp\MilitaryUnitDivision;
use Illuminate\Database\Eloquent\Builder;

class AssistantRamble extends BaseModel
{
    protected $fillable = [
        'text', 'auth_token_hash'
    ];

    public function scopeAllowed(Builder $query)
    {
        return $query->where('auth_token_hash', getAuthTokenHash());
    }
}
