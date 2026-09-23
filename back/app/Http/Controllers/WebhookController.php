<?php

namespace App\Http\Controllers;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use App\Services\SyncService;
use Illuminate\Http\Request;

class WebhookController extends BaseController
{

    public function receive(Request $request)
    {
        $secret = config('app.firefly_webhook_secret');
        if (!$secret) {
            throw new GeneralException("Webhooks are not configured", self::HTTP_CODE_NOT_FOUND);
        }

        if (!$this->hasValidSignature($request->header('Signature'), $request->getContent(), $secret)) {
            throw new GeneralException("Invalid signature", self::HTTP_CODE_UNAUTHORIZED);
        }

        $userId = fget($request->json()->all(), 'user_id');
        if ($userId) {
            SyncService::bumpVersion($userId);
        }

        return $this->respond(['data' => true]);
    }

    // ---------------------------- PRIVATE --------------------------

    // Firefly sends "t=<timestamp>,v1=<hmac sha3-256 of '<timestamp>.<body>'>"
    private function hasValidSignature($header, $body, $secret)
    {
        $parts = [];
        foreach (explode(',', (string) $header) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, null);
            $parts[$key] = $value;
        }

        $timestamp = fget($parts, 't');
        $signature = fget($parts, 'v1');
        if (!$timestamp || !$signature || abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        return hash_equals(hash_hmac('sha3-256', "$timestamp.$body", $secret), $signature);
    }

}
