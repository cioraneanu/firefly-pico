<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

// Like Laravel's 'encrypted' cast, but a value that no longer decrypts (APP_KEY changed, e.g. a new Docker image) reads as null instead of failing every request.
class EncryptedOrNull implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        try {
            return $value === null ? null : Crypt::decryptString($value);
        } catch (DecryptException) {
            return null;
        }
    }

    public function set($model, string $key, $value, array $attributes)
    {
        return $value === null ? null : Crypt::encryptString($value);
    }
}
