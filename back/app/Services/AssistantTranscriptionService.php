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
     * Transcribe every voice ramble in the collection that was not transcribed yet.
     * is_transcribed marks a completed transcription: a request that failed leaves it
     * false so a later load retries it instead of losing the recording.
     *
     * @param string|null $language Language of these recordings, overriding the configured one.
     */
    public function transcribePending($rambles, $language = null): void
    {
        $pending = $rambles->filter(fn($ramble) => $ramble->voice_path && !$ramble->is_transcribed);
        if ($pending->isEmpty()) {
            return;
        }

        $config = $this->configService->getConfig($language);
        if (!$config['isConfigured']) {
            return;
        }

        foreach ($pending as $ramble) {
            $this->transcribe($ramble, $config);
        }

        $this->purgeEmpty($pending);
    }

    /**
     * Delete the rambles that transcribed into nothing (silence, or a recording without
     * speech). They carry no text and would only show up as blank rows in the app.
     * Returns the rambles that were kept.
     */
    public function purgeEmpty($rambles)
    {
        return $rambles->reject(function (AssistantRamble $ramble) {
            if (!$ramble->is_transcribed || trim((string)$ramble->text) !== '') {
                return false;
            }

            // Purging runs twice over the same models when a listing transcribes them.
            if ($ramble->exists) {
                $ramble->delete();
            }

            return true;
        })->values();
    }

    public function testConfiguration(): array
    {
        $config = $this->configService->getConfig();
        if (!$config['isConfigured']) {
            return ['successful' => false, 'status' => 422, 'message' => 'Assistant transcription is not configured.'];
        }

        $sampleRate = 8000;
        $audio = str_repeat("\0", $sampleRate / 4 * 2);
        $wav = 'RIFF' . pack('V', 36 + strlen($audio)) . 'WAVEfmt ' . pack('VvvVVvv', 16, 1, 1, $sampleRate, $sampleRate * 2, 2, 16) . 'data' . pack('V', strlen($audio)) . $audio;
        $request = Http::acceptJson()->connectTimeout(10)->timeout(120);
        if ($config['apiKey']) {
            $request = $request->withToken($config['apiKey']);
        }

        try {
            $response = $request->attach('file', $wav, 'test.wav')->post($config['endpoint'], $this->buildPayload($config));
        } catch (ConnectionException $exception) {
            return ['successful' => false, 'status' => 502, 'message' => $exception->getMessage() ?: 'Assistant transcription request failed.'];
        }

        return [
            'successful' => $response->successful(),
            'status' => $response->successful() ? 200 : $response->status(),
            'message' => fget($response->json(), 'error.message') ?? fget($response->json(), 'message') ?? 'Assistant transcription request failed.',
        ];
    }

    private function transcribe(AssistantRamble $ramble, array $config): void
    {
        $text = $this->requestTranscription($ramble, $config);
        if ($text === null) {
            // The request itself failed. Leave the ramble alone so it is retried later.
            return;
        }

        $ramble->is_transcribed = true;
        if ($text !== '') {
            $ramble->text = trim(implode("\n", array_filter([trim((string)$ramble->text), $text])));
        }

        $ramble->save();
    }

    /**
     * The transcribed text, '' when the recording holds no speech, null when the request failed.
     */
    private function requestTranscription(AssistantRamble $ramble, array $config): ?string
    {
        $disk = Storage::disk('local');
        if (!$disk->exists($ramble->voice_path)) {
            return '';
        }

        // An empty file cannot be transcribed, and attach() drops empty contents which breaks the multipart request.
        $contents = $disk->get($ramble->voice_path);
        if (!$contents) {
            return '';
        }

        $request = Http::acceptJson()->connectTimeout(10)->timeout(120);
        if ($config['apiKey']) {
            $request = $request->withToken($config['apiKey']);
        }

        try {
            $response = $request
                ->attach('file', $contents, basename($ramble->voice_path))
                ->post($config['endpoint'], $this->buildPayload($config));
        } catch (ConnectionException) {
            return null;
        }

        if (!$response->successful()) {
            return null;
        }

        return trim((string)data_get($response->json(), 'text'));
    }

    /**
     * language is an optional hint of the OpenAI transcription API. It keeps short utterances
     * ("farmacie 23") from being detected as the wrong language and transcribed as gibberish,
     * so it is sent whenever it is configured.
     */
    private function buildPayload(array $config): array
    {
        return array_filter([
            'model' => $config['model'],
            'response_format' => 'json',
            'language' => $config['language'],
        ], fn($value) => $value !== '' && $value !== null);
    }
}
