<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Http\Controllers\Base\BaseController;
use App\Jobs\TranscribeAssistantRamble;
use App\Models\AssistantRamble;
use App\Services\AssistantLlmConfigService;
use App\Services\AssistantTranscriptionService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AssistantController extends BaseController
{


    public function getAll(Request $request)
    {
        BaseAuthorization::checkUser();
        $list = AssistantRamble::query()->allowed()->orderBy('created_at')->get();
        $transcriptionService = app(AssistantTranscriptionService::class);
        $transcriptionService->transcribePending($list);
        // Also drops rambles left empty by an earlier transcription, so they stop showing up as blank rows.
        $list = $transcriptionService->purgeEmpty($list);
        return $this->respond(['data' => $list,]);
    }

    public function getCount(Request $request)
    {
        BaseAuthorization::checkUser();
        $list = AssistantRamble::query()->allowed()->withoutEmptyTranscription()->count();
        return $this->respond(['count' => $list,]);
    }


    public function create(Request $request)
    {
        BaseAuthorization::checkUser();
        $request->validate([
            'voice' => ['nullable', 'file', 'mimes:mp3,mpga,wav,m4a,mp4,aac,ogg,oga,opus,webm,flac', 'max:25600'],
            'language' => ['nullable', 'string', 'max:20'],
        ]);

        $text = trim((string)$request->get('text'));
        if (!$text && str_contains((string)$request->header('Content-Type'), 'text/plain')) {
            $text = trim($request->getContent());
        }

        $voiceFile = $request->file('voice');
        if (!$text && !$voiceFile) {
            return $this->setStatusCode(self::HTTP_CODE_UNPROCESSABLE_ENTITY)->respond([
                'message' => 'Ramble text or voice recording is required.',
            ]);
        }

        $ramble = AssistantRamble::create([
            'text' => $text ?: null,
            'voice_path' => $voiceFile ? $voiceFile->store('assistant-rambles', 'local') : null,
            'user_id' => getUserId()
        ]);

        if ($ramble->voice_path) {
            // The caller (a shortcut, for instance) can say which language it recorded in.
            $language = trim((string)$request->get('language')) ?: null;

            // Without a real queue, transcribe in-process after the response so saving stays fast.
            config('queue.default') === 'sync'
                ? TranscribeAssistantRamble::dispatchAfterResponse($ramble, $language)
                : TranscribeAssistantRamble::dispatch($ramble, $language);
        }

        return $this->respond([
            'data' => $ramble,
        ]);
    }

    public function getRambleVoice(Request $request)
    {
        BaseAuthorization::checkUser();
        $ramble = AssistantRamble::query()->allowed()->findOrFail($request->id);

        $disk = Storage::disk('local');
        if (!$ramble->voice_path || !$disk->exists($ramble->voice_path)) {
            return $this->setStatusCode(self::HTTP_CODE_NOT_FOUND)->respond([
                'message' => 'This ramble has no voice recording.',
            ]);
        }

        return $disk->response($ramble->voice_path);
    }

    public function deleteRamble(Request $request)
    {
        BaseAuthorization::checkUser();
        $ramble = AssistantRamble::query()->allowed()->findOrFail($request->id);
        $ramble->delete();

        return $this->respond([
            'deleted' => 1,
        ]);
    }

    public function deleteRambles(Request $request)
    {
        BaseAuthorization::checkUser();
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        // Delete through the models (not a bulk query) so the deleted event
        // fires and each ramble's voice file is removed from disk.
        $rambles = AssistantRamble::query()
            ->allowed()
            ->whereIn('id', $request->input('ids'))
            ->get();

        $deleted = 0;
        foreach ($rambles as $ramble) {
            $deleted += $ramble->delete() ? 1 : 0;
        }

        return $this->respond([
            'deleted' => $deleted,
        ]);
    }

    public function interpretTransactions(Request $request)
    {
        BaseAuthorization::checkUser();
        $request->validate([
            'payload' => ['required', 'array'],
            'payload.messages' => ['required', 'array'],
        ]);

        $config = app(AssistantLlmConfigService::class)->getConfig();

        if (!$config['isConfigured']) {
            return $this->setStatusCode(self::HTTP_CODE_UNPROCESSABLE_ENTITY)->respond([
                'message' => 'Assistant LLM is not configured.',
            ]);
        }

        $payload = $request->input('payload');
        $this->appendContext($payload, $config['context'], $request->input('context'));
        $payload['model'] = $config['model'];

        return $this->sendLlmRequest($config, $payload);
    }

    public function testLlm(Request $request)
    {
        BaseAuthorization::checkUser();
        $config = app(AssistantLlmConfigService::class)->getConfig();

        if (!$config['isConfigured']) {
            return $this->setStatusCode(self::HTTP_CODE_UNPROCESSABLE_ENTITY)->respond([
                'message' => 'Assistant LLM is not configured.',
            ]);
        }

        return $this->sendLlmRequest($config, [
            'model' => $config['model'],
            'temperature' => 0,
            'max_tokens' => 1,
            'messages' => [['role' => 'user', 'content' => 'Reply OK.']],
        ]);
    }

    public function testTranscription(Request $request)
    {
        BaseAuthorization::checkUser();
        $result = app(AssistantTranscriptionService::class)->testConfiguration();

        if (!$result['successful']) {
            return $this->setStatusCode($result['status'])->respond([
                'message' => $result['message'],
            ]);
        }

        return $this->respond(['success' => true]);
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

    private function sendLlmRequest($config, $payload)
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
