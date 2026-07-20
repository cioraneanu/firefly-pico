<?php

namespace App\Models;


class Tag extends BaseModel
{
    protected $fillable = [
        'id',
        'icon',
        'parent_id',
        'is_todo',
        'total_amount',
        'total_currency_id',
    ];

    public static $extraFields = [
        'icon',
        'parent_id',
        'is_todo',
        'total_amount',
        'total_currency_id'
    ];

    protected $with = [];


    // ------------------------------ Scopes ---------------------------------

//     public function scopeSearch(Builder $query, $search = null)
//     {
//         if (!$search)
//             return $query;
//
//         return applyWhereLike($query, 'name', $search);
//     }


}
