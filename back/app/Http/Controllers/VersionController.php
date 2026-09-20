<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseController;
use App\Services\AssistantLlmConfigService;
use App\Services\AssistantTranscriptionConfigService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;


class VersionController extends BaseController
{

    // A new tag appears a few times a month at most, so asking twice a day is plenty.
    const VERSION_CACHE_SECONDS = 60 * 60 * 12;

    // When the lookup fails, retry sooner than that - but not on the very next request.
    const VERSION_CACHE_SECONDS_ON_FAILURE = 60 * 60;

    const VERSION_TIMEOUT_SECONDS = 5;


    public function getInfo(AssistantLlmConfigService $assistantLlmConfigService, AssistantTranscriptionConfigService $assistantTranscriptionConfigService)
    {
        return $this->respond([
            'latest_version' => $this->resolveLatestVersion(),
            'assistant_llm' => $assistantLlmConfigService->getPublicConfig(),
            'assistant_transcription' => $assistantTranscriptionConfigService->getPublicConfig(),
        ]);
    }


    /**
     * This endpoint also carries the assistant configuration, so a slow or unreachable GitHub
     * must not hold it up: the answer is cached, the request is capped, and it can be turned
     * off entirely.
     */
    private function resolveLatestVersion()
    {
        if (config('app.disable_external_calls')) {
            return null;
        }

        $includeDev = $this->isDevBuild();
        // The stable and dev channels resolve to different tags.
        $cacheKey = 'latest_version_' . ($includeDev ? 'dev' : 'stable');

        // Wrapped in an array on purpose: Cache::remember() treats a null result as a miss and
        // would go back to GitHub on every single request while the lookup keeps failing.
        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return fget($cached, 'version');
        }

        $version = $this->fetchLatestVersion($includeDev);
        $seconds = $version ? self::VERSION_CACHE_SECONDS : self::VERSION_CACHE_SECONDS_ON_FAILURE;
        Cache::put($cacheKey, ['version' => $version], $seconds);

        return $version;
    }


    private function isDevBuild()
    {
        $versionFile = base_path('VERSION');
        if (!file_exists($versionFile)) {
            return false;
        }

        return str_ends_with(trim(file_get_contents($versionFile)), '-dev');
    }


    private function fetchLatestVersion($includeDev)
    {
        $url = 'https://api.github.com/repos/cioraneanu/firefly-pico/tags?per_page=100';

        try {
            $response = Http::connectTimeout(self::VERSION_TIMEOUT_SECONDS)->timeout(self::VERSION_TIMEOUT_SECONDS)->get($url);
        } catch (ConnectionException $e) {
            // No route to GitHub at all. Not knowing the latest version is no reason to fail
            // the request - it also carries the assistant configuration.
            return null;
        }

        if (!$response->successful()) {
            return null;
        }

        $versions = fcollect($response->json())
            ->map(fn($item) => $item['name'])
            ->filter(function ($item) use ($includeDev) {
                if ($includeDev) {
                    return str_ends_with($item, '-dev');
                }
                return !str_ends_with($item, '-dev');
            })
            ->toArray();

        // Custom sort for dev versions to handle the build number
        usort($versions, function ($a, $b) {
            return version_compare($a, $b);
        });

        $versions = array_reverse($versions);
        return $versions[0] ?? null;
    }
}
