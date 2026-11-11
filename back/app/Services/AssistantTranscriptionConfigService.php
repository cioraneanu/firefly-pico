<?php

namespace App\Services;

class AssistantTranscriptionConfigService
{
    public function __construct(private AssistantUserSettingsService $userSettingsService)
    {
    }

    /**
     * The connection a transcription uses: the user's own one when they switched to it, else the server's
     * ASSISTANT_TRANSCRIPTION_* values.
     *
     * @param string|null $language Per-request language, winning over the configured one.
     * @param string|null $userId Owner of the recording (jobs run without a request, so they pass it).
     * @param array|null $override Unsaved values from the settings screen ({ use_own, endpoint, model, api_key, language }).
     */
    public function getConfig($language = null, $userId = null, ?array $override = null)
    {
        $server = $this->getServerConfig($language);
        $own = $this->userSettingsService->getOwnConfig('transcription', $userId ?? getUserId(), $override);
        if (!$own) {
            return $server;
        }

        return [
            'source' => 'own',
            'isConfigured' => $own['endpoint'] !== '' || $own['apiKey'] !== '',
            'endpoint' => $own['endpoint'] ?: config('services.assistant_transcription.defaults.endpoint'),
            'model' => $own['model'] ?: config('services.assistant_transcription.defaults.model'),
            'apiKey' => $own['apiKey'],
            'language' => $this->normalizeLanguage($this->trimValue($language) ?: $own['language']),
        ];
    }

    public function getServerConfig($language = null)
    {
        $endpoint = $this->trimValue(config('services.assistant_transcription.endpoint'));
        $model = $this->trimValue(config('services.assistant_transcription.model'));
        $apiKey = $this->trimValue(config('services.assistant_transcription.api_key'));
        // Read this at runtime as well so a container-provided language is not
        // lost when Laravel's configuration was cached before startup.
        $language = $this->trimValue($language) ?: $this->trimValue(getenv('ASSISTANT_TRANSCRIPTION_LANGUAGE') ?: config('services.assistant_transcription.language'));

        return [
            'source' => 'server',
            'isConfigured' => $endpoint !== '' || $apiKey !== '',
            'endpoint' => $endpoint ?: config('services.assistant_transcription.defaults.endpoint'),
            'model' => $model ?: config('services.assistant_transcription.defaults.model'),
            'apiKey' => $apiKey,
            'language' => $this->normalizeLanguage($language),
        ];
    }

    public function getPublicConfig()
    {
        $config = $this->getServerConfig();

        return [
            'is_configured' => $config['isConfigured'],
            'endpoint' => $config['endpoint'],
            'model' => $config['model'],
            'language' => $config['language'],
        ];
    }

    // Transcription APIs expect an ISO-639-1 code, so "ro-RO" or "ro_RO" becomes "ro".
    private function normalizeLanguage($language)
    {
        if (!preg_match('/^([a-z]{2,3})[-_]/i', (string)$language, $matches)) {
            return $language;
        }

        return strtolower($matches[1]);
    }

    private function trimValue($value)
    {
        return trim((string)($value ?? ''));
    }
}
