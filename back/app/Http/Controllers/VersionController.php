<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseController;
use App\Services\VersionService;


class VersionController extends BaseController
{

    public function getInfo(VersionService $versionService)
    {
        return $this->respond($versionService->getInfo());
    }
}
