<?php

namespace App\Models;


class PiggyBank extends BaseModel
{
    protected $fillable = [
        'id',
        'icon',
    ];

    public static $extraFields = [
        'icon',
    ];

    protected $with = [];


}
