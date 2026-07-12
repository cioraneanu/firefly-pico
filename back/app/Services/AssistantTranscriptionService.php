<?php

namespace App\Services;

use App\Models\AssistantRamble;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AssistantTranscriptionService
{
    public function __construct(private AssistantTranscriptionConfigService $configService)
    {
    }

    /**
     * Transcribe every voice ramble in the collection that was never attempted before.
     * Each ramble is attempted exactly once: is_transcribed marks the attempt, not success.
     */
    public function transcribePending($rambles): void
    {
        $pending = $rambles->filter(fn($ramble) => $ramble->voice_path && !$ramble->is_transcribed);
        if ($pending->isEmpty()) {
            return;
        }

        $config = $this->configService->getConfig();
        if (!$config['isConfigured']) {
            return;
        }

        foreach ($pending as $ramble) {
            $this->transcribe($ramble, $config);
        }
    }

    private function transcribe(AssistantRamble $ramble, array $config): void
    {
        $ramble->is_transcribed = true;

        $text = $this->requestTranscription($ramble, $config);
        if ($text !== '') {
            $ramble->text = trim(implode("\n", array_filter([trim((string)$ramble->text), $text])));
        }

        $ramble->save();
    }

    private function requestTranscription(AssistantRamble $ramble, array $config): string
    {
        $disk = Storage::disk('local');
        if (!$disk->exists($ramble->voice_path)) {
            return '';
        }

        $request = Http::acceptJson()->connectTimeout(10)->timeout(120);
        if ($config['apiKey']) {
            $request = $request->withToken($config['apiKey']);
        }

        try {
            $response = $request
                ->attach('file', $disk->get($ramble->voice_path), basename($ramble->voice_path))
                ->post($config['endpoint'], [
                    'model' => $config['model'],
                    'response_format' => 'json',
                ]);
        } catch (ConnectionException) {
            return '';
        }

        if (!$response->successful()) {
            return '';
        }

        return trim((string)data_get($response->json(), 'text'));
    }
}
