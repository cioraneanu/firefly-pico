<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;


class TransactionTemplate extends Model
{
    protected $fillable = [
        'name',
        'amount', 'account_source_id', 'account_destination_id', 'category_id',
        'type', 'notes', 'description'
    ];

    protected $with = ['tags', 'extraNames'];


    // ------------------------------ Relations ------------------------------

    public function tags()
    {
        return $this->hasMany(TransactionTemplateTag::class);
    }

    public function extraNames()
    {
        return $this->hasMany(TransactionTemplateExtraName::class);
    }

    // ------------------------------ Scopes ---------------------------------

    public function scopeSearch(Builder $query, $search = null)
    {
        if (!$search)
            return $query;

        return applyWhereLike($query, 'name', $search);
    }


}
