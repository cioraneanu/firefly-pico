<?php

namespace App\Services;

class AssistantLlmConfigService
{
    public function getConfig()
    {
        $endpoint = $this->trimValue(config('services.assistant_llm.endpoint'));
        $model = $this->trimValue(config('services.assistant_llm.model'));
        $apiKey = $this->trimValue(config('services.assistant_llm.api_key'));

        return [
            'isConfigured' => $endpoint !== '' || $apiKey !== '',
            'endpoint' => $endpoint ?: config('services.assistant_llm.defaults.endpoint'),
            'model' => $model ?: config('services.assistant_llm.defaults.model'),
            'apiKey' => $apiKey,
        ];
    }

    public function getPublicConfig()
    {
        $config = $this->getConfig();

        return [
            'isConfigured' => $config['isConfigured'],
            'endpoint' => $config['endpoint'],
            'model' => $config['model'],
        ];
    }

    private function trimValue($value)
    {
        return trim((string)($value ?? ''));
    }
}
