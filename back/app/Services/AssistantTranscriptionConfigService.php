<?php

namespace App\Services;

class AssistantTranscriptionConfigService
{
    /**
     * @param string|null $language Per-request language, winning over the configured one.
     */
    public function getConfig($language = null)
    {
        $endpoint = $this->trimValue(config('services.assistant_transcription.endpoint'));
        $model = $this->trimValue(config('services.assistant_transcription.model'));
        $apiKey = $this->trimValue(config('services.assistant_transcription.api_key'));
        $provider = $this->trimValue(getenv('ASSISTANT_TRANSCRIPTION_PROVIDER') ?: config('services.assistant_transcription.provider'));
        // Read this at runtime as well so a container-provided language is not
        // lost when Laravel's configuration was cached before startup.
        $language = $this->trimValue($language) ?: $this->trimValue(getenv('ASSISTANT_TRANSCRIPTION_LANGUAGE') ?: config('services.assistant_transcription.language'));

        return [
            'isConfigured' => $endpoint !== '' || $apiKey !== '',
            'endpoint' => $endpoint ?: config('services.assistant_transcription.defaults.endpoint'),
            'model' => $model ?: config('services.assistant_transcription.defaults.model'),
            'apiKey' => $apiKey,
            'provider' => $provider ?: 'openai',
            'language' => $this->normalizeLanguage($language),
        ];
    }

    public function getPublicConfig()
    {
        $config = $this->getConfig();

        return [
            'is_configured' => $config['isConfigured'],
            'endpoint' => $config['endpoint'],
            'model' => $config['model'],
            'language' => $config['language'],
            'provider' => $config['provider'],
        ];
    }

    // Transcription APIs expect an ISO-639-1 code, so "ro-RO" or "ro_RO" becomes "ro".
    private function normalizeLanguage($language)
    {
        if (!preg_match('/^([a-z]{2,3})[-_]/i', $language, $matches)) {
            return $language;
        }

        return strtolower($matches[1]);
    }

    private function trimValue($value)
    {
        return trim((string)($value ?? ''));
    }
}
