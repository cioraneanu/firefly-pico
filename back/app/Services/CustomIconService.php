<?php

namespace App\Services;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;

// Icons the admin drops in the "custom_icons_path" folder (a mounted volume in Docker)
class CustomIconService
{
    // Also acts as the whitelist of files we expose
    const MIME_TYPES = [
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
    ];

    public function getAll()
    {
        $path = config('app.custom_icons_path');
        $files = is_dir($path) ? scandir($path) : [];
        return fcollect($files)
            ->filter(fn($file) => !str_starts_with($file, '.') && $this->getMimeType($file) && is_file("$path/$file"))
            ->sort(SORT_NATURAL | SORT_FLAG_CASE)
            ->values();
    }

    public function getFilePath($file)
    {
        $path = config('app.custom_icons_path') . "/$file";
        if (basename($file) !== $file || !$this->getMimeType($file) || !is_file($path)) {
            throw new GeneralException('Icon not found.', BaseController::HTTP_CODE_NOT_FOUND);
        }
        return $path;
    }

    public function getMimeType($file)
    {
        return self::MIME_TYPES[strtolower(pathinfo($file, PATHINFO_EXTENSION))] ?? null;
    }
}
