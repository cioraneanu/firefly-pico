<?php

namespace App\Models;

use App\Casts\EncryptedOrNull;

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

    protected $casts = [
        'llm_use_own' => 'boolean',
        'transcription_use_own' => 'boolean',
        'llm_api_key' => EncryptedOrNull::class,
        'transcription_api_key' => EncryptedOrNull::class,
    ];

    public function getLlmHasApiKeyAttribute()
    {
        return !empty($this->llm_api_key);
    }

    public function getTranscriptionHasApiKeyAttribute()
    {
        return !empty($this->transcription_api_key);
    }

    // A key is saved but no longer decrypts (APP_KEY changed): it has to be entered again.
    public function isApiKeyLost($group)
    {
        return $this->getRawOriginal("{$group}_api_key") !== null && $this->{"{$group}_api_key"} === null;
    }
}
