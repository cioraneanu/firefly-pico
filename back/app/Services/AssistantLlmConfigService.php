<?php

namespace App\Services;

class AssistantLlmConfigService
{
    public function getConfig()
    {
        $endpoint = $this->trimValue(config('services.assistant_llm.endpoint'));
        $model = $this->trimValue(config('services.assistant_llm.model'));
        $apiKey = $this->trimValue(config('services.assistant_llm.api_key'));
        // Read this value at runtime as well so container-provided context is not
        // lost when Laravel's configuration was cached before startup.
        $context = $this->trimValue(getenv('ASSISTANT_LLM_CONTEXT') ?: config('services.assistant_llm.context'));

        return [
            'isConfigured' => $endpoint !== '' || $apiKey !== '',
            'endpoint' => $endpoint ?: config('services.assistant_llm.defaults.endpoint'),
            'model' => $model ?: config('services.assistant_llm.defaults.model'),
            'apiKey' => $apiKey,
            'context' => $context,
        ];
    }

    public function getPublicConfig()
    {
        $config = $this->getConfig();

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
