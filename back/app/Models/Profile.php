<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    protected $primaryKey = 'auth_token_hash';

    protected $keyType = 'string';

    protected $fillable = [
        'auth_token_hash',
        'settings',
    ];
}