<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AssistantController extends BaseController
{
    public function interpretTransactions(Request $request)
    {
        $request->validate([
            'text' => ['required', 'string'],
            'now' => ['nullable', 'string'],
            'timezone' => ['nullable', 'string'],
            'language' => ['nullable', 'string'],
            'context' => ['nullable', 'array'],
            'llm' => ['nullable', 'array'],
            'llm.endpoint' => ['nullable', 'string'],
            'llm.model' => ['nullable', 'string'],
            'llm.apiKey' => ['nullable', 'string'],
        ]);

        $llm = $request->input('llm', []);
        $endpoint = $llm['endpoint'] ?? config('app.assistant_llm_endpoint');
        $model = $llm['model'] ?? config('app.assistant_llm_model');
        $apiKey = $llm['apiKey'] ?? config('app.assistant_llm_api_key');

        if (!$endpoint || !$model) {
            return $this->setStatusCode(self::HTTP_CODE_BAD_REQUEST)->respond([
                'message' => 'Assistant LLM endpoint and model are required.',
            ]);
        }

        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        if ($apiKey) {
            $headers['Authorization'] = "Bearer $apiKey";
        }

        $response = Http::withHeaders($headers)
            ->connectTimeout(10)
            ->timeout(60)
            ->post($endpoint, [
                'model' => $model,
                'temperature' => 0.1,
                'stream' => false,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $this->getInterpretationPrompt(),
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode([
                            'text' => $request->input('text'),
                            'now' => $request->input('now'),
                            'timezone' => $request->input('timezone'),
                            'language' => $request->input('language'),
                            'context' => $request->input('context', []),
                        ], JSON_UNESCAPED_SLASHES),
                    ],
                ],
            ]);

        if (!$response->successful()) {
            return $this->setStatusCode($response->status())->respond([
                'message' => $response->json('error.message') ?? $response->json('message') ?? 'Assistant LLM request failed.',
            ]);
        }

        $content = $response->json('choices.0.message.content');
        $json = $this->decodeJsonContent($content);

        if ($json === null) {
            return $this->setStatusCode(self::HTTP_CODE_UNPROCESSABLE_ENTITY)->respond([
                'message' => 'Assistant LLM did not return valid JSON.',
            ]);
        }

        return $this->respond([
            'transactions' => $this->normalizeTransactions($json),
        ]);
    }

    private function getInterpretationPrompt()
    {
        return implode("\n", [
            'You extract financial transactions from natural language.',
            'Return only one JSON object, with no markdown and no commentary.',
            'The JSON object must have a transactions array.',
            'Each transaction must use this shape:',
            '{"amount": number|null, "currencyCode": string|null, "description": string|null, "tagNames": string[], "categoryName": string|null, "templateName": string|null, "budgetName": string|null, "sourceAccountName": string|null, "destinationAccountName": string|null, "type": "expense|income|transfer|null", "occurredAt": string|null, "notes": string|null}',
            'Split one utterance into multiple transactions when the user says "another", "and one", "plus", or otherwise describes more than one payment.',
            'Use the provided now and timezone to resolve relative dates and times such as yesterday, today, 30 minutes ago, or last Friday.',
            'Use ISO-8601 for occurredAt when a date or relative time is stated. If only a date is stated, keep the current local time from now.',
            'Use ISO 4217 codes for currencyCode, for example EUR, USD, RON. Leave currencyCode null when the user did not state a currency.',
            'Do not invent local resource names. Only set tagNames, categoryName, templateName, budgetName, sourceAccountName, or destinationAccountName when the user explicitly asks for them or the name is present in the supplied context.',
            'If a user says "tag food", put food in tagNames. If they say "for pharmacy", use pharmacy as description unless it clearly matches a supplied tag, category, or template.',
            'Prefer type expense unless the user clearly describes income or a transfer.',
        ]);
    }

    private function decodeJsonContent($content)
    {
        if (!$content || !is_string($content)) {
            return null;
        }

        $content = trim($content);
        $content = preg_replace('/^```(?:json)?\s*/i', '', $content);
        $content = preg_replace('/\s*```$/', '', $content);

        $decoded = json_decode($content, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        preg_match('/(\{.*\}|\[.*\])/s', $content, $matches);
        if (!$matches) {
            return null;
        }

        $decoded = json_decode($matches[1], true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : null;
    }

    private function normalizeTransactions($json)
    {
        if (!is_array($json)) {
            return [];
        }

        $transactions = $json['transactions'] ?? (array_is_list($json) ? $json : [$json]);
        $transactions = array_values(array_filter($transactions, 'is_array'));

        return array_values(array_map(function ($transaction) {
            $date = $transaction['occurredAt'] ?? $transaction['occurred_at'] ?? null;
            if (!$date && isset($transaction['date'])) {
                $time = $transaction['time'] ?? '00:00';
                $date = trim($transaction['date'] . 'T' . $time);
            }

            $tags = $transaction['tagNames'] ?? $transaction['tag_names'] ?? $transaction['tags'] ?? [];
            if (is_string($tags)) {
                $tags = [$tags];
            }

            return [
                'amount' => $transaction['amount'] ?? null,
                'currencyCode' => $transaction['currencyCode'] ?? $transaction['currency_code'] ?? $transaction['currency'] ?? null,
                'description' => $transaction['description'] ?? null,
                'tagNames' => array_values(array_filter($tags)),
                'categoryName' => $transaction['categoryName'] ?? $transaction['category_name'] ?? $transaction['category'] ?? null,
                'templateName' => $transaction['templateName'] ?? $transaction['template_name'] ?? $transaction['template'] ?? null,
                'budgetName' => $transaction['budgetName'] ?? $transaction['budget_name'] ?? $transaction['budget'] ?? null,
                'sourceAccountName' => $transaction['sourceAccountName'] ?? $transaction['source_account_name'] ?? $transaction['source_account'] ?? null,
                'destinationAccountName' => $transaction['destinationAccountName'] ?? $transaction['destination_account_name'] ?? $transaction['destination_account'] ?? null,
                'type' => $transaction['type'] ?? null,
                'occurredAt' => $date,
                'notes' => $transaction['notes'] ?? null,
            ];
        }, $transactions));
    }
}
