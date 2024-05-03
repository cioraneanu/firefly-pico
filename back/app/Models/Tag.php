<?php

namespace App\Models;


class Tag extends BaseModel
{
    protected $fillable = [
        'id',
        'icon',
        'parent_id',
        'is_todo',
    ];

    public static $extraFields = [
        'icon',
        'parent_id',
        'is_todo'
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
