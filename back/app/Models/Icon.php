<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;


class Icon extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    protected $with = [];

    // ------------------------------ Scopes ---------------------------------

    public function scopeSearch(Builder $query, $search = null)
    {
        if (!$search)
            return $query;

        return applyWhereLike($query, 'name', $search);
    }


}
