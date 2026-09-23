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

    /**
     * One request that replaces the fan-out the app used to do from the browser.
     *
     * The client sends the hash it already holds; when nothing changed we answer with that
     * hash and nothing else, so an unchanged sync costs a few bytes instead of the whole
     * payload — and the client can skip rewriting its local stores entirely.
     */
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
