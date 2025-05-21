<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{


    protected $fillable = [
        'auth_token_hash',
        'settings',
        'name',
    ];

    protected $casts = [
        'settings' => 'array'
    ];
}
