<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class AssistantUserSetting extends BaseModel
{
    protected $fillable = [
        'user_id',
        'llm_use_own', 'llm_endpoint', 'llm_model', 'llm_api_key',
        'transcription_use_own', 'transcription_endpoint', 'transcription_model', 'transcription_api_key', 'transcription_language',
    ];

    // API keys are write-only: stored encrypted with APP_KEY and never sent back to the app.
    protected $hidden = [
        'llm_api_key', 'transcription_api_key',
    ];

    protected $appends = [
        'llm_has_api_key', 'transcription_has_api_key',
    ];

    protected $casts = [
        'llm_use_own' => 'boolean',
        'transcription_use_own' => 'boolean',
        'llm_api_key' => 'encrypted',
        'transcription_api_key' => 'encrypted',
    ];

    public function getLlmHasApiKeyAttribute()
    {
        return !empty($this->llm_api_key);
    }

    public function getTranscriptionHasApiKeyAttribute()
    {
        return !empty($this->transcription_api_key);
    }

    public function scopeForUser(Builder $query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
