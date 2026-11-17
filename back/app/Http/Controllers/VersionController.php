<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseController;
use App\Services\AssistantLlmConfigService;
use App\Services\AssistantTranscriptionConfigService;
use Illuminate\Support\Facades\Http;


class VersionController extends BaseController
{

    public function getInfo(AssistantLlmConfigService $assistantLlmConfigService, AssistantTranscriptionConfigService $assistantTranscriptionConfigService)
    {
        return $this->respond([
            'latest_version' => $this->resolveLatestVersion(),
            // forUser asks Firefly who the user is: if Firefly can't be reached, fall back to the server's config
            'assistant_llm' => rescue(fn() => $assistantLlmConfigService->getPublicConfig(forUser: true), fn() => $assistantLlmConfigService->getPublicConfig(), false),
            'assistant_transcription' => rescue(fn() => $assistantTranscriptionConfigService->getPublicConfig(forUser: true), fn() => $assistantTranscriptionConfigService->getPublicConfig(), false),
        ]);
    }


    private function resolveLatestVersion()
    {
        $versionFile = base_path('VERSION');
        $includeDev = false;

        if (file_exists($versionFile)) {
            $version = trim(file_get_contents($versionFile));
            $includeDev = str_ends_with($version, '-dev');
        }

        $url = 'https://api.github.com/repos/cioraneanu/firefly-pico/tags?per_page=100';
        $response = rescue(fn() => Http::get($url), null, false);
        if (!$response?->successful()) {
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
