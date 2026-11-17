<?php

namespace App\Validations;

use Illuminate\Http\Request;

class AssistantValidation
{
    public static function validateRambleUpdate(Request $request)
    {
        $request->validate([
            'text' => 'required|string|max:10000',
        ]);
    }

    // A group switched to "own" needs at least its endpoint; the key may be empty (local models) and the model falls back to the default.
    public static function validateSettingsUpdate(Request $request)
    {
        $request->validate([
            'llm_use_own' => 'required|boolean',
            'llm_endpoint' => ['nullable', 'required_if_accepted:llm_use_own', ...self::endpointRules()],
            'llm_model' => 'nullable|string|max:255',
            'llm_api_key' => 'nullable|string|max:2000',
            'llm_api_key_clear' => 'nullable|boolean',
            'transcription_use_own' => 'required|boolean',
            'transcription_endpoint' => ['nullable', 'required_if_accepted:transcription_use_own', ...self::endpointRules()],
            'transcription_model' => 'nullable|string|max:255',
            'transcription_api_key' => 'nullable|string|max:2000',
            'transcription_api_key_clear' => 'nullable|boolean',
            'transcription_language' => 'nullable|string|max:20',
        ]);
    }

    // Unsaved connection values sent by the settings screen to test or try them before saving.
    private static function configOverrideRules(): array
    {
        return [
            'config' => 'nullable|array',
            'config.use_own' => 'required_with:config|boolean',
            'config.endpoint' => ['nullable', ...self::endpointRules()],
            'config.model' => 'nullable|string|max:255',
            'config.api_key' => 'nullable|string|max:2000',
            'config.api_key_clear' => 'nullable|boolean',
            'config.language' => 'nullable|string|max:20',
        ];
    }

    public static function validateConfigOverride(Request $request)
    {
        $request->validate(self::configOverrideRules());
    }

    public static function validateInterpretTransactions(Request $request)
    {
        $request->validate([
            'payload' => 'required|array',
            'payload.messages' => 'required|array',
            ...self::configOverrideRules(),
        ]);
    }

    private static function endpointRules(): array
    {
        return ['bail', 'url:http,https', 'max:500', fn($attribute, $value, $fail) => self::isAllowedOwnEndpoint($value) || $fail('The :attribute must not point to a private or reserved address.')];
    }

    /**
     * The server calls a user's own endpoint, so it may not reach loopback, private, link-local or reserved addresses
     * (cloud metadata, the server's LAN) unless ASSISTANT_ALLOW_PRIVATE_ENDPOINTS is on (e.g. for Ollama on the LAN).
     * Every resolved address must be public; a host that does not resolve is refused.
     */
    public static function isAllowedOwnEndpoint($url): bool
    {
        if (config('services.assistant.allow_private_endpoints')) {
            return true;
        }

        $host = trim((string)parse_url((string)$url, PHP_URL_HOST), '[]');
        $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : [...(gethostbynamel($host) ?: []), ...array_column(@dns_get_record($host, DNS_AAAA) ?: [], 'ipv6')];
        $flags = FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE | FILTER_FLAG_GLOBAL_RANGE;

        return $ips && fcollect($ips)->every(fn($ip) => filter_var($ip, FILTER_VALIDATE_IP, $flags));
    }
}
