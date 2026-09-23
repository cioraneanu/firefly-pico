<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Http\Controllers\Base\BaseController;
use App\Services\SyncService;
use Illuminate\Http\Request;

class SyncController extends BaseController
{

    public function __construct(private readonly SyncService $syncService) {}

    // ---------------------------

    public function getSync(Request $request)
    {
        BaseAuthorization::checkUser();

        $entities = array_values(array_filter(explode(',', (string) $request->entities)));
        $params = $request->only(['date', 'start', 'end']);

        $result = $this->syncService->sync($entities, $params, $request->boolean('force'));

        if ($request->hash && $request->hash === fget($result, 'hash')) {
            return $this->respond([
                'hash' => fget($result, 'hash'),
                'unchanged' => true,
            ]);
        }

        return $this->respond([
            'hash' => fget($result, 'hash'),
            'unchanged' => false,
            'data' => fget($result, 'data'),
        ]);
    }

}
