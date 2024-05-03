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
        $url = 'https://hub.docker.com/v2/repositories/cioraneanu/firefly-pico/tags?page_size=1000';
        $response = Http::get($url);
        if (!$response->successful()) {
            return null;
        }
        $body = $response->json();
        $versions = fcollect($body['results'])
        ->map(fn($item) => $item['name'])
        ->filter(fn($item) => $item !== 'latest')
        ->toArray();

        usort($versions, 'version_compare');
        $versions =  array_reverse($versions);
        return $versions[0];
    }


}
