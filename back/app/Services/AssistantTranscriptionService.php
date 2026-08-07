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
     * Transcribe a single audio file and return the text.
     * Used for live audio recording in the browser.
     */
    public function transcribeFile(string $filePath, ?string $language = null): ?string
    {
        $config = $this->configService->getConfig($language);
        if (!$config['isConfigured']) {
            \Log::error('Transcription not configured');
            return null;
        }

        $disk = Storage::disk('local');
        if (!$disk->exists($filePath)) {
            \Log::error('File does not exist: ' . $filePath);
            return null;
        }

        $contents = $disk->get($filePath);
        if (!$contents) {
            \Log::error('File is empty: ' . $filePath);
            return null;
        }

        $size = strlen($contents);
        \Log::info('Transcribing file: ' . $filePath . ' size=' . $size . ' provider=' . $config['provider']);

        $request = $this->buildHttpRequest($config);

        try {
            $response = $request
                ->attach('file', $contents, basename($filePath))
                ->post($this->buildEndpoint($config), $this->buildPayload($config));
        } catch (ConnectionException $e) {
            \Log::error('ConnectionException: ' . $e->getMessage());
            return null;
        }

        $status = $response->status();
        $body = $response->json();
        \Log::info('Transcription response status=' . $status . ' body=' . json_encode($body));

        if (!$response->successful()) {
            return null;
        }

        return $this->extractTranscript($body);
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
        $request = $this->buildHttpRequest($config);

        try {
            $response = $request->attach('file', $wav, 'test.wav')->post($this->buildEndpoint($config), $this->buildPayload($config));
        } catch (ConnectionException $exception) {
            return ['successful' => false, 'status' => 502, 'message' => $exception->getMessage() ?: 'Assistant transcription request failed.'];
        }

        // Deepgram returns 400 for silent/no-speech audio, which means the endpoint/key are valid
        if (!$response->successful() && $config['provider'] === 'deepgram' && $response->status() === 400) {
            $json = $response->json();
            $errCode = $json['err_code'] ?? '';
            $errMsg = $json['err_msg'] ?? '';
            // Deepgram "1001" = No speech detected, "1003" = No audio data
            if (in_array($errCode, ['1001', '1003']) || str_contains($errMsg, 'No speech') || str_contains($errMsg, 'audio')) {
                return [
                    'successful' => true,
                    'status' => 200,
                    'message' => 'Deepgram connection OK (no speech in test audio)',
                ];
            }
        }

        $message = $this->extractErrorMessage($response);

        return [
            'successful' => $response->successful(),
            'status' => $response->successful() ? 200 : $response->status(),
            'message' => $message,
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

        $request = $this->buildHttpRequest($config);

        try {
            $response = $request
                ->attach('file', $contents, basename($ramble->voice_path))
                ->post($this->buildEndpoint($config), $this->buildPayload($config));
        } catch (ConnectionException) {
            return null;
        }

        if (!$response->successful()) {
            return null;
        }

        return $this->extractTranscript($response->json());
    }

    /**
     * Build the HTTP request with the correct auth header for the provider.
     */
    private function buildHttpRequest(array $config): \Illuminate\Http\Client\PendingRequest
    {
        $request = Http::acceptJson()->connectTimeout(10)->timeout(120);

        if ($config['provider'] === 'deepgram') {
            // Deepgram uses Token auth: "Authorization: Token dg-..."
            if ($config['apiKey']) {
                $request = $request->withHeader('Authorization', 'Token ' . $config['apiKey']);
            }
        } else {
            // OpenAI-style Bearer auth
            if ($config['apiKey']) {
                $request = $request->withToken($config['apiKey']);
            }
        }

        return $request;
    }

    /**
     * Build the multipart/form-data payload.  Provider-specific fields are appended.
     */
    private function buildPayload(array $config): array
    {
        $payload = array_filter([
            'model' => $config['model'],
            'language' => $config['language'],
        ], fn($value) => $value !== '' && $value !== null);

        if ($config['provider'] === 'deepgram') {
            // Deepgram parameters go in query string, not body
            return [];
        } else {
            // OpenAI requires response_format
            $payload['response_format'] = 'json';
        }

        return $payload;
    }

    /**
     * Build the full endpoint URL with query parameters for providers that need them.
     */
    private function buildEndpoint(array $config): string
    {
        $endpoint = $config['endpoint'];

        if ($config['provider'] === 'deepgram') {
            $params = array_filter([
                'model' => $config['model'],
                'language' => $config['language'],
                'smart_format' => 'true',
                'punctuate' => 'true',
            ], fn($value) => $value !== '' && $value !== null);

            $separator = str_contains($endpoint, '?') ? '&' : '?';
            return $endpoint . $separator . http_build_query($params);
        }

        return $endpoint;
    }

    /**
     * Extract the transcript text from the response.  Provider-specific parsing.
     */
    private function extractTranscript(?array $json): ?string
    {
        if ($json === null) {
            return null;
        }

        // Deepgram: { "results": { "channels": [{ "alternatives": [{ "transcript": "..." }] }] }
        if (isset($json['results']['channels'][0]['alternatives'][0]['transcript'])) {
            return trim((string) $json['results']['channels'][0]['alternatives'][0]['transcript']);
        }

        // OpenAI: { "text": "..." }
        if (isset($json['text'])) {
            return trim((string) $json['text']);
        }

        return null;
    }

    /**
     * Extract a human-readable error message from a failed response.
     */
    private function extractErrorMessage(\Illuminate\Http\Client\Response $response): string
    {
        $json = $response->json();

        // Deepgram error format: { "err_code": "...", "err_msg": "..." }
        if (isset($json['err_msg'])) {
            return $json['err_msg'];
        }

        // OpenAI error format: { "error": { "message": "..." } }
        return fget($json, 'error.message') ?? fget($json, 'message') ?? 'Assistant transcription request failed.';
    }
}
