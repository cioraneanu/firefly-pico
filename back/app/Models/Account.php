<?php

namespace App\Models;


class Account extends BaseModel
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
