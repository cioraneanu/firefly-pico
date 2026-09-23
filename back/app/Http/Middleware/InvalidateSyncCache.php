<?php

namespace App\Http\Middleware;

use App\Services\SyncService;
use Closure;
use Illuminate\Http\Request;

class InvalidateSyncCache
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (!$request->isMethod('GET') && $response->isSuccessful() && $request->bearerToken() && getUserId()) {
            SyncService::bumpVersion(getUserId());
        }

        return $response;
    }
}
