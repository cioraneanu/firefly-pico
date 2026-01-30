<?php

namespace App\Http\Controllers;

use App\Exceptions\FireflyException;
use App\Http\Controllers\Base\BaseController;
use App\Http\Controllers\Base\BaseControllerFirefly;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;


class VersionController extends BaseController
{


    public function getLatestVersion(Request $request)
    {
        $versionFile = base_path('VERSION');
        $includeDev = false;

        if (file_exists($versionFile)) {
            $version = trim(file_get_contents($versionFile));
            $includeDev = str_ends_with($version, '-dev');
        }

        $url = 'https://api.github.com/repos/cioraneanu/firefly-pico/tags?per_page=100';
        $response = Http::get($url);
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
