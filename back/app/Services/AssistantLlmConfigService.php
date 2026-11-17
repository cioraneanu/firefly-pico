<?php

namespace App\Services;

class AssistantLlmConfigService extends AssistantConfigService
{
    protected string $group = 'llm';

    // ASSISTANT_LLM_CONTEXT applies to the user's own connection as well as the server's.
    public function getConfig(?array $override = null, $userId = null): array
    {
        // Read this value at runtime as well so container-provided context is not
        // lost when Laravel's configuration was cached before startup.
        $context = trim((string)(getenv('ASSISTANT_LLM_CONTEXT') ?: config('services.assistant_llm.context')));

        return [...$this->getConnection($override, $userId), 'context' => $context];
    }
}
