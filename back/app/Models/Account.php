<?php

namespace App\Models;


class Account extends BaseModel
{
    protected $fillable = [
        'id',
        'icon',
        'badge',
        'is_dashboard_visible'
    ];

    public static $extraFields = [
        'icon',
        'badge',
        'is_dashboard_visible'
    ];

    protected $with = [];


}
