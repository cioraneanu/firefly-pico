<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;


class TransactionTemplateTag extends Model
{
    protected $fillable = [
        'transaction_template_id', 'tag_id',
    ];

    protected $with = [];


    // ------------------------------ Relations ------------------------------


}
