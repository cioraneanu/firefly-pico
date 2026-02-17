<?php

namespace App\Models;


class Account extends BaseModel
{
    protected $fillable = [
        'id',
        'icon',
        'is_dashboard_visible',
        'group'
    ];

    public static $extraFields = [
        'icon',
        'is_dashboard_visible',
        'group'
    ];

    protected $with = [];


}
