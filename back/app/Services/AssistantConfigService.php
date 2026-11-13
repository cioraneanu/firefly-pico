<?php

namespace App\Services;

// Shared by the llm and transcription connections: the user's own one when they switched to it, else the server's ASSISTANT_* values.
abstract class AssistantConfigService
{
    // 'llm' or 'transcription': reads config('services.assistant_{group}') and the user's {group}_* settings.
    protected string $group;

    public function __construct(private AssistantUserSettingsService $userSettingsService)
    {
    }

    /**
     * @param array|null $override Unsaved values from the settings screen ({ use_own, endpoint, model, api_key, language }).
     * @param string|null $userId Defaults to the request's user (jobs run without a request, so they pass it).
     */
    protected function getConnection(?array $override = null, $userId = null): array
    {
        $own = $this->userSettingsService->getOwnConfig($this->group, $userId ?? getUserId(), $override);
        return $own ? $this->buildConnection('own', $own) : $this->getServerConfig();
    }

    public function getServerConfig(): array
    {
        return $this->buildConnection('server', [
            'endpoint' => config("services.assistant_{$this->group}.endpoint"),
            'model' => config("services.assistant_{$this->group}.model"),
            'apiKey' => config("services.assistant_{$this->group}.api_key"),
        ]);
    }

    public function getPublicConfig(): array
    {
        $config = $this->getServerConfig();

        return [
            'is_configured' => $config['isConfigured'],
            'endpoint' => $config['endpoint'],
            'model' => $config['model'],
        ];
    }

    private function buildConnection($source, array $values): array
    {
        $endpoint = trim((string)fget($values, 'endpoint'));
        $apiKey = trim((string)fget($values, 'apiKey'));

        return [
            'source' => $source,
            // A saved key that no longer decrypts leaves the connection unconfigured instead of calling it without the key.
            'isConfigured' => !fget($values, 'isApiKeyLost') && ($endpoint !== '' || $apiKey !== ''),
            'endpoint' => $endpoint ?: config("services.assistant_{$this->group}.defaults.endpoint"),
            'model' => trim((string)fget($values, 'model')) ?: config("services.assistant_{$this->group}.defaults.model"),
            'apiKey' => $apiKey,
            'language' => trim((string)fget($values, 'language')),
        ];
    }
}
