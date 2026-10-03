<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Http\Controllers\Base\BaseController;
use Illuminate\Http\Request;

// Icons the admin drops in the "custom_icons_path" folder (a mounted volume in Docker)
class CustomIconController extends BaseController
{
    // Also acts as the whitelist of files we expose
    const MIME_TYPES = [
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
    ];

    public function getAll(Request $request)
    {
        BaseAuthorization::checkUser();

        $path = config('app.custom_icons_path');
        $files = is_dir($path) ? scandir($path) : [];
        $list = fcollect($files)
            ->filter(fn($file) => !str_starts_with($file, '.') && $this->getMimeType($file) && is_file("$path/$file"))
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return $this->respond(['data' => $list]);
    }

    // Not authenticated => the front end shows these with <img src>, which cannot send the Bearer token
    public function getOne(Request $request)
    {
        $file = $request->route('file');
        $path = config('app.custom_icons_path') . "/$file";
        $mimeType = $this->getMimeType($file);
        if (basename($file) !== $file || !$mimeType || !is_file($path)) {
            return $this->setStatusCode(self::HTTP_CODE_NOT_FOUND)->respond(['message' => 'Icon not found.']);
        }

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
            // Blocks scripts in an SVG even if someone opens the file directly
            'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'",
        ]);
    }

    private function getMimeType($file)
    {
        return self::MIME_TYPES[strtolower(pathinfo($file, PATHINFO_EXTENSION))] ?? null;
    }
}
