<?php

namespace App\Services;

class AssistantTranscriptionConfigService extends AssistantConfigService
{
    protected string $group = 'transcription';

    // $language: per-request language, winning over the configured one.
    public function getConfig(?array $override = null, $userId = null, $language = null): array
    {
        $config = $this->getConnection($override, $userId);

        return [...$config, 'language' => $this->normalizeLanguage(trim((string)$language) ?: $config['language'])];
    }

    public function getServerConfig(): array
    {
        // Read this at runtime as well so a container-provided language is not
        // lost when Laravel's configuration was cached before startup.
        $language = trim((string)(getenv('ASSISTANT_TRANSCRIPTION_LANGUAGE') ?: config('services.assistant_transcription.language')));

        return [...parent::getServerConfig(), 'language' => $this->normalizeLanguage($language)];
    }

    public function getPublicConfig(): array
    {
        return [...parent::getPublicConfig(), 'language' => $this->getServerConfig()['language']];
    }

    // Transcription APIs expect an ISO-639-1 code, so "ro-RO" or "ro_RO" becomes "ro".
    private function normalizeLanguage($language)
    {
        if (!preg_match('/^([a-z]{2,3})[-_]/i', (string)$language, $matches)) {
            return $language;
        }

        return strtolower($matches[1]);
    }
}
