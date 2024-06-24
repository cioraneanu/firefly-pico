<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSettings extends Model
{
    protected $table = 'app_settings';

    protected $primaryKey = 'auth_token_hash';

    protected $keyType = 'string';

    protected $fillable = [
        'auth_token_hash',
        'settings',
    ];
}