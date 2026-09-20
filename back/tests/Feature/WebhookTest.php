<?php

namespace Tests\Feature;

use App\Services\SyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WebhookTest extends TestCase
{
    use RefreshDatabase;

    private $secret = 'webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.firefly_webhook_secret' => $this->secret]);
    }

    private function send($body, $signature)
    {
        return $this->call(
            'POST',
            '/api/webhooks/firefly',
            [],
            [],
            [],
            ['HTTP_Signature' => $signature, 'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            $body
        );
    }

    private function sign($body, $timestamp = null)
    {
        $timestamp = $timestamp ?? time();

        return sprintf('t=%s,v1=%s', $timestamp, hash_hmac('sha3-256', "$timestamp.$body", $this->secret));
    }

    // ---------------------------

    public function test_a_signed_webhook_bumps_the_sync_version_for_that_user()
    {
        $body = json_encode(['user_id' => 1, 'trigger' => 'UPDATE_TRANSACTION']);
        $before = SyncService::getVersion('1');

        $this->send($body, $this->sign($body))->assertOk();

        $this->assertGreaterThan($before, SyncService::getVersion('1'));
    }

    public function test_a_webhook_with_a_wrong_signature_is_rejected()
    {
        $body = json_encode(['user_id' => 1]);

        $this->send($body, 't=' . time() . ',v1=nope')->assertStatus(401);
        $this->assertSame(0, SyncService::getVersion('1'));
    }

    public function test_a_replayed_webhook_is_rejected()
    {
        $body = json_encode(['user_id' => 1]);
        $old = time() - 3600;

        $this->send($body, $this->sign($body, $old))->assertStatus(401);
    }

    public function test_a_webhook_without_a_signature_is_rejected()
    {
        $this->send(json_encode(['user_id' => 1]), '')->assertStatus(401);
    }

    public function test_the_endpoint_is_disabled_without_a_configured_secret()
    {
        config(['app.firefly_webhook_secret' => '']);
        $body = json_encode(['user_id' => 1]);

        $this->send($body, $this->sign($body))->assertStatus(404);
    }
}
