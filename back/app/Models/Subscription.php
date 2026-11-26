<?php

namespace App\Models;


class Subscription extends BaseModel
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
