<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;


class Transaction extends Model
{
    protected $fillable = [
        'firefly_id',
        'longitude',
        'latitude'
    ];

    protected $with = [];


    // ------------------------------ Relations ------------------------------

    public function tags()
    {
        return $this->hasMany(TransactionTemplateTag::class);
    }

    // ------------------------------ Scopes ---------------------------------

    public function scopeSearch(Builder $query, $search = null)
    {
        if (!$search)
            return $query;

        return applyWhereLike($query, 'name', $search);
    }


}
