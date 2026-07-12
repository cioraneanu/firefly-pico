<?php

namespace App\Services;

class AssistantTranscriptionConfigService
{
    public function getConfig()
    {
        $endpoint = $this->trimValue(config('services.assistant_transcription.endpoint'));
        $model = $this->trimValue(config('services.assistant_transcription.model'));
        $apiKey = $this->trimValue(config('services.assistant_transcription.api_key'));

        return [
            'isConfigured' => $endpoint !== '' || $apiKey !== '',
            'endpoint' => $endpoint ?: config('services.assistant_transcription.defaults.endpoint'),
            'model' => $model ?: config('services.assistant_transcription.defaults.model'),
            'apiKey' => $apiKey,
        ];
    }

    private function trimValue($value)
    {
        return trim((string)($value ?? ''));
    }
}
