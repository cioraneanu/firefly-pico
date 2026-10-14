<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Http\Controllers\Base\BaseController;
use App\Services\CustomIconService;
use Illuminate\Http\Request;

class CustomIconController extends BaseController
{
    public function __construct(protected CustomIconService $customIconService)
    {
    }

    public function getAll(Request $request)
    {
        BaseAuthorization::checkUser();
        $list = $this->customIconService->getAll();
        return $this->respond(['data' => $list]);
    }

    // Not authenticated => the front end shows these with <img src>, which cannot send the Bearer token
    public function getOne(Request $request)
    {
        $file = $request->route('file');
        $path = $this->customIconService->getFilePath($file);
        return response()->file($path, [
            'Content-Type' => $this->customIconService->getMimeType($file),
            'Cache-Control' => 'public, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
            // Blocks scripts in an SVG even if someone opens the file directly
            'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'",
        ]);
    }
}
