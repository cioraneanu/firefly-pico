<?php

namespace App\Models;


class Category extends BaseModel
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
