<?php

namespace App\Services;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class AssistantLlmService
{
    public function __construct(private AssistantLlmConfigService $configService)
    {
    }

    public function interpretTransactions($payload, $userContext)
    {
        $config = $this->getConfiguredConfig();

        $this->appendContext($payload, $config['context'], $userContext);
        $payload['model'] = $config['model'];

        return $this->sendRequest($config, $payload);
    }

    public function testConfiguration()
    {
        $config = $this->getConfiguredConfig();

        return $this->sendRequest($config, [
            'model' => $config['model'],
            'temperature' => 0,
            'max_tokens' => 1,
            'messages' => [['role' => 'user', 'content' => 'Reply OK.']],
        ]);
    }

    // -----------

    private function getConfiguredConfig()
    {
        $config = $this->configService->getConfig();

        if (!$config['isConfigured']) {
            throw new GeneralException('Assistant LLM is not configured.', BaseController::HTTP_CODE_UNPROCESSABLE_ENTITY);
        }

        return $config;
    }

    private function appendContext(&$payload, $globalContext, $userContext)
    {
        $globalContext = trim((string)$globalContext);
        $userContext = trim((string)$userContext);
        $context = implode("\n\n", array_filter([
            $globalContext ? "Backend context (default):\n{$globalContext}" : null,
            $userContext ? "Frontend context (higher priority):\n{$userContext}\nWhen the frontend and backend contexts conflict, follow the frontend context." : null,
        ]));
        if (!$context) {
            return;
        }

        foreach ($payload['messages'] as &$message) {
            if (fget($message, 'role') === 'system') {
                $message['content'] = rtrim((string)fget($message, 'content')) . "\n" . $context;
                return;
            }
        }

        $payload['messages'][] = ['role' => 'system', 'content' => $context];
    }

    private function sendRequest($config, $payload)
    {
        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        if ($config['apiKey']) {
            $headers['Authorization'] = "Bearer {$config['apiKey']}";
        }

        try {
            $response = Http::withHeaders($headers)
                ->connectTimeout(10)
                ->timeout(60)
                ->post($config['endpoint'], $payload);
        } catch (ConnectionException $exception) {
            throw new GeneralException($exception->getMessage() ?: 'Assistant LLM request failed.', 502);
        }

        $responseBody = $response->json();

        if (!$response->successful()) {
            throw new GeneralException(
                data_get($responseBody, 'error.message') ?? data_get($responseBody, 'message') ?? 'Assistant LLM request failed.',
                $response->status()
            );
        }

        if (is_array($responseBody)) {
            return $responseBody;
        }

        return ['content' => $response->body()];
    }
}
