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
        $url = 'https://api.github.com/repos/cioraneanu/firefly-pico/tags?per_page=100';
        $response = Http::get($url);
        if (!$response->successful()) {
            return null;
        }
        $versions = fcollect($response->json())
        ->map(fn($item) => $item['name'])
        ->filter(fn($item) => !str_ends_with($item, '-dev'))
        ->toArray();

        usort($versions, 'version_compare');
        $versions =  array_reverse($versions);
        return $versions[0];
    }


}
