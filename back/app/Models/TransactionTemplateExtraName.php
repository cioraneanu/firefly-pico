<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;


class TransactionTemplateExtraName extends Model
{
    protected $fillable = [
        'transaction_template_id', 'name',
    ];

    protected $with = [];


    // ------------------------------ Relations ------------------------------


}
