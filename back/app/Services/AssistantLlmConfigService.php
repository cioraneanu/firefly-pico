<?php

namespace App\Services;

class AssistantLlmConfigService
{
    public function __construct(private AssistantUserSettingsService $userSettingsService)
    {
    }

    /**
     * The connection a request uses: the user's own one when they switched to it, else the server's
     * ASSISTANT_LLM_* values. ASSISTANT_LLM_CONTEXT applies to both.
     *
     * @param array|null $override Unsaved values from the settings screen ({ use_own, endpoint, model, api_key }).
     */
    public function getConfig($userId = null, ?array $override = null)
    {
        $server = $this->getServerConfig();
        $own = $this->userSettingsService->getOwnConfig('llm', $userId ?? getUserId(), $override);
        if (!$own) {
            return $server;
        }

        return [
            'source' => 'own',
            'isConfigured' => $own['endpoint'] !== '' || $own['apiKey'] !== '',
            'endpoint' => $own['endpoint'] ?: config('services.assistant_llm.defaults.endpoint'),
            'model' => $own['model'] ?: config('services.assistant_llm.defaults.model'),
            'apiKey' => $own['apiKey'],
            'context' => $server['context'],
        ];
    }

    public function getServerConfig()
    {
        $endpoint = $this->trimValue(config('services.assistant_llm.endpoint'));
        $model = $this->trimValue(config('services.assistant_llm.model'));
        $apiKey = $this->trimValue(config('services.assistant_llm.api_key'));
        // Read this value at runtime as well so container-provided context is not
        // lost when Laravel's configuration was cached before startup.
        $context = $this->trimValue(getenv('ASSISTANT_LLM_CONTEXT') ?: config('services.assistant_llm.context'));

        return [
            'source' => 'server',
            'isConfigured' => $endpoint !== '' || $apiKey !== '',
            'endpoint' => $endpoint ?: config('services.assistant_llm.defaults.endpoint'),
            'model' => $model ?: config('services.assistant_llm.defaults.model'),
            'apiKey' => $apiKey,
            'context' => $context,
        ];
    }

    public function getPublicConfig()
    {
        $config = $this->getServerConfig();

        return [
            'is_configured' => $config['isConfigured'],
            'endpoint' => $config['endpoint'],
            'model' => $config['model'],
        ];
    }

    private function trimValue($value)
    {
        return trim((string)($value ?? ''));
    }
}
