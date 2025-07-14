<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Profile extends Model
{
    use SoftDeletes;


    protected $fillable = [
        'auth_token_hash',
        'settings',
        'name',
    ];

    protected $casts = [
        'settings' => 'array'
    ];
}
