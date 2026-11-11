<?php

namespace App\Services;

use App\Models\AssistantUserSetting;

/**
 * Per-user assistant connections. Each group (llm, transcription) is all-or-nothing: when the user picks
 * "own", their endpoint, key and model are used together and the server's values are ignored for them,
 * so the server's API key is never sent to an endpoint the user typed in.
 */
class AssistantUserSettingsService
{
    public function find($userId): ?AssistantUserSetting
    {
        return $userId ? AssistantUserSetting::query()->forUser($userId)->first() : null;
    }

    // What the settings screen shows: the user's saved values (keys only as has_api_key) plus the server's connections.
    public function getForResponse($userId): array
    {
        $settings = $this->find($userId) ?? new AssistantUserSetting(['llm_use_own' => false, 'transcription_use_own' => false]);

        return [
            ...$settings->toArray(),
            'server' => [
                'llm' => app(AssistantLlmConfigService::class)->getPublicConfig(),
                'transcription' => app(AssistantTranscriptionConfigService::class)->getPublicConfig(),
            ],
        ];
    }

    public function save($userId, array $data): AssistantUserSetting
    {
        $settings = AssistantUserSetting::query()->firstOrNew(['user_id' => $userId]);
        $settings->fill(array_intersect_key($data, array_flip([
            'llm_use_own', 'llm_endpoint', 'llm_model',
            'transcription_use_own', 'transcription_endpoint', 'transcription_model', 'transcription_language',
        ])));

        // Keys are write-only: a new one replaces the stored key, an empty value keeps it, *_clear removes it.
        foreach (['llm', 'transcription'] as $group) {
            if (fget($data, "{$group}_api_key_clear")) {
                $settings->{"{$group}_api_key"} = null;
            } elseif (trim((string)fget($data, "{$group}_api_key")) !== '') {
                $settings->{"{$group}_api_key"} = trim((string)fget($data, "{$group}_api_key"));
            }
        }

        $settings->save();
        return $settings->refresh();
    }

    /**
     * The user's own connection for one group, or null when the group uses the server's.
     * $override lets the settings screen try unsaved values: { use_own, endpoint, model, api_key, language }.
     */
    public function getOwnConfig($group, $userId, ?array $override = null): ?array
    {
        $settings = $this->find($userId);
        $useOwn = $override !== null ? (bool)fget($override, 'use_own') : (bool)$settings?->{"{$group}_use_own"};
        if (!$useOwn) {
            return null;
        }

        $value = fn($field) => trim((string)($override !== null && array_key_exists($field, $override) ? $override[$field] : $settings?->{"{$group}_{$field}"}));
        // A key typed on the screen wins; otherwise the user's saved key (it is theirs, whatever endpoint they test).
        $apiKey = trim((string)fget($override, 'api_key')) ?: trim((string)$settings?->{"{$group}_api_key"});

        return [
            'endpoint' => $value('endpoint'),
            'model' => $value('model'),
            'apiKey' => $apiKey,
            'language' => $group === 'transcription' ? $value('language') : null,
        ];
    }
}
