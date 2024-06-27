<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{


    protected $fillable = [
        'auth_token_hash',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array'
    ];
}
