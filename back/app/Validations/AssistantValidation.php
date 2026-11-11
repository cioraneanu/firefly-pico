<?php

namespace App\Validations;

use Illuminate\Http\Request;

class AssistantValidation
{
    // A group switched to "own" needs at least its endpoint; the key may be empty (local models) and the model falls back to the default.
    public static function validateSettingsUpdate(Request $request)
    {
        $request->validate([
            'llm_use_own' => 'required|boolean',
            'llm_endpoint' => 'nullable|required_if:llm_use_own,true|url|max:500',
            'llm_model' => 'nullable|string|max:255',
            'llm_api_key' => 'nullable|string|max:2000',
            'llm_api_key_clear' => 'nullable|boolean',
            'transcription_use_own' => 'required|boolean',
            'transcription_endpoint' => 'nullable|required_if:transcription_use_own,true|url|max:500',
            'transcription_model' => 'nullable|string|max:255',
            'transcription_api_key' => 'nullable|string|max:2000',
            'transcription_api_key_clear' => 'nullable|boolean',
            'transcription_language' => 'nullable|string|max:20',
        ]);
    }

    // Unsaved connection values sent by the settings screen to test or try them before saving.
    public static function validateConfigOverride(Request $request)
    {
        $request->validate([
            'config' => 'nullable|array',
            'config.use_own' => 'required_with:config|boolean',
            'config.endpoint' => 'nullable|url|max:500',
            'config.model' => 'nullable|string|max:255',
            'config.api_key' => 'nullable|string|max:2000',
            'config.language' => 'nullable|string|max:20',
        ]);
    }
}
