<?php

namespace App\Http\Middleware;

use App\Services\SyncService;
use Closure;
use Illuminate\Http\Request;

/**
 * Any successful write through Pico (a transaction moves account balances, a new tag, a template,
 * ...) may change what /api/sync returns, so drop the cached payload for this token. Keyed by the
 * token rather than the Firefly user so it costs no extra request to Firefly III.
 */
class InvalidateSyncCache
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (!$request->isMethod('GET') && $response->isSuccessful() && $request->bearerToken()) {
            SyncService::bumpVersion(getAuthTokenHash());
        }

        return $response;
    }
}
