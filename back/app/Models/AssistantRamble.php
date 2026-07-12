<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;

class AssistantRamble extends BaseModel
{
    protected $fillable = [
        'text', 'voice_path', 'is_transcribed', 'user_id'
    ];

    protected $hidden = [
        'voice_path',
    ];

    protected $appends = [
        'has_voice',
    ];

    protected $casts = [
        'is_transcribed' => 'boolean',
    ];

    protected static function booted()
    {
        static::deleted(function (AssistantRamble $ramble) {
            if ($ramble->voice_path) {
                Storage::disk('local')->delete($ramble->voice_path);
            }
        });
    }

    public function getHasVoiceAttribute()
    {
        return !empty($this->voice_path);
    }

    public function scopeAllowed(Builder $query)
    {
        return $query->where('user_id', getUserId());
    }
}
