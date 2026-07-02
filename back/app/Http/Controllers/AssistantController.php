<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Http\Controllers\Base\BaseController;
use App\Models\AssistantRamble;
use App\Services\AssistantLlmConfigService;
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

        $config = app(AssistantLlmConfigService::class)->getConfig();
        $payload = $request->input('payload');

        if ($config['isConfigured']) {
            $endpoint = $config['endpoint'];
            $model = $config['model'];
            $apiKey = $config['apiKey'];
        } else {
            $llm = $request->input('llm', []);
            $endpoint = trim((string)($llm['endpoint'] ?? '')) ?: $config['endpoint'];
            $model = trim((string)($llm['model'] ?? ($payload['model'] ?? ''))) ?: $config['model'];
            $apiKey = trim((string)($llm['apiKey'] ?? ''));
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

}
