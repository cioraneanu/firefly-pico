<?php

namespace App\Models;


class Account extends BaseModel
{
    protected $fillable = [
        'id',
        'icon',
        'is_hidden',
    ];

    public static $extraFields = [
        'icon',
        'is_hidden',
    ];

    protected $with = [];


}
