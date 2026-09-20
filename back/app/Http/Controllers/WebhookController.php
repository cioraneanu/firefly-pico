<?php

namespace App\Http\Controllers;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use App\Services\SyncService;
use Illuminate\Http\Request;

/**
 * Receives Firefly III webhooks so the app can notice outside changes immediately instead of
 * waiting for the next scheduled sync.
 *
 * Firefly only offers webhooks for transactions and budgets, so this is a complement to
 * polling rather than a replacement: tags, categories and accounts still rely on the
 * (now cheap) hash check.
 *
 * Setup: create a webhook in Firefly III pointing at <pico>/api/webhooks/firefly and copy its
 * secret into FIREFLY_WEBHOOK_SECRET. Without that env var the endpoint stays disabled.
 */
class WebhookController extends BaseController
{

    public function receive(Request $request)
    {
        $secret = config('app.firefly_webhook_secret');
        if (!$secret) {
            throw new GeneralException("Webhooks are not configured", self::HTTP_CODE_NOT_FOUND);
        }

        $body = $request->getContent();
        if (!$this->hasValidSignature($request->header('Signature'), $body, $secret)) {
            throw new GeneralException("Invalid signature", self::HTTP_CODE_UNAUTHORIZED);
        }

        SyncService::bumpVersion(fget($request->json()->all(), 'user_id'));

        return $this->respond(['data' => true]);
    }

    // ---------------------------- PRIVATE --------------------------

    /**
     * Firefly sends "t=<timestamp>,v1=<signature>" where the signature is an HMAC over
     * "<timestamp>.<raw body>". See Sha3SignatureGenerator in Firefly III.
     */
    private function hasValidSignature($header, $body, $secret)
    {
        if (!$header) {
            return false;
        }

        $parts = [];
        foreach (explode(',', $header) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, null);
            $parts[$key] = $value;
        }

        $timestamp = fget($parts, 't');
        $signature = fget($parts, 'v1');
        if (!$timestamp || !$signature) {
            return false;
        }

        // Reject replays of old deliveries.
        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        $expected = hash_hmac('sha3-256', "$timestamp.$body", $secret);

        return hash_equals($expected, $signature);
    }

}
