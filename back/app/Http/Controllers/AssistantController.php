<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Http\Controllers\Base\BaseController;
use App\Models\AssistantRamble;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AssistantController extends BaseController
{


    public function getAll(Request $request)
    {
        $list = AssistantRamble::query()->allowed()->orderBy('created_at')->get();
        return $this->respond(['data' => $list,]);
    }

    public function getCount(Request $request)
    {
        $list = AssistantRamble::query()->allowed()->count();
        return $this->respond(['count' => $list,]);
    }


    public function create(Request $request)
    {
        BaseAuthorization::checkUser();
        $text = $request->get('text');

        if (!$text) {
            return $this->setStatusCode(self::HTTP_CODE_UNPROCESSABLE_ENTITY)->respond([
                'message' => 'Ramble text is required.',
            ]);
        }

        $ramble = AssistantRamble::create([
            'text' => $text,
            'auth_token_hash' => getAuthTokenHash()
        ]);

        return $this->respond([
            'data' => $ramble,
        ]);
    }

    public function deleteRamble(Request $request)
    {
        $ramble = AssistantRamble::query()->findOrFail($request->id);
        $ramble->delete();

        return $this->respond([
            'deleted' => 1,
        ]);
    }

    public function deleteRambles(Request $request)
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deleted = AssistantRamble::query()
            ->whereIn('id', $request->input('ids'))
            ->delete();

        return $this->respond([
            'deleted' => $deleted,
        ]);
    }

    public function getLlmConfig()
    {
        $config = $this->getAssistantLlmConfig();

        return $this->respond([
            'isConfigured' => $config['isConfigured'],
            'endpoint' => $config['endpoint'],
            'model' => $config['model'],
        ]);
    }

    public function interpretTransactions(Request $request)
    {
        $request->validate([
            'payload' => ['required', 'array'],
            'payload.messages' => ['required', 'array'],
            'llm' => ['sometimes', 'array'],
            'llm.endpoint' => ['nullable', 'string'],
            'llm.model' => ['nullable', 'string'],
            'llm.apiKey' => ['nullable', 'string'],
        ]);

        $config = $this->getAssistantLlmConfig();
        $payload = $request->input('payload');

        if ($config['isConfigured']) {
            $endpoint = $config['endpoint'];
            $model = $config['model'];
            $apiKey = $config['apiKey'];
        } else {
            $llm = $request->input('llm', []);
            $endpoint = $this->trimValue($llm['endpoint'] ?? null) ?: $config['endpoint'];
            $model = $this->trimValue($llm['model'] ?? ($payload['model'] ?? null)) ?: $config['model'];
            $apiKey = $this->trimValue($llm['apiKey'] ?? null);
        }

        if (!$endpoint) {
            return $this->setStatusCode(self::HTTP_CODE_UNPROCESSABLE_ENTITY)->respond([
                'message' => 'Assistant LLM endpoint is required.',
            ]);
        }

        $payload['model'] = $model;

        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        if ($apiKey) {
            $headers['Authorization'] = "Bearer $apiKey";
        }

        try {
            $response = Http::withHeaders($headers)
                ->connectTimeout(10)
                ->timeout(60)
                ->post($endpoint, $payload);
        } catch (ConnectionException $exception) {
            return $this->setStatusCode(502)->respond([
                'message' => $exception->getMessage() ?: 'Assistant LLM request failed.',
            ]);
        }

        $responseBody = $response->json();

        if (!$response->successful()) {
            return $this->setStatusCode($response->status())->respond([
                'message' => data_get($responseBody, 'error.message') ?? data_get($responseBody, 'message') ?? 'Assistant LLM request failed.',
            ]);
        }

        if (is_array($responseBody)) {
            return $this->respond($responseBody);
        }

        return $this->respond([
            'content' => $response->body(),
        ]);
    }

    private function getAssistantLlmConfig()
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

    private function trimValue($value)
    {
        return trim((string)($value ?? ''));
    }


}
