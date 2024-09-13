<?php

namespace App\Models;


class Budget extends BaseModel
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
