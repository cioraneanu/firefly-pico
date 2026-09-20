<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExchangeRatesTest extends TestCase
{
    use RefreshDatabase;

    private $token = 'test-token';

    /** @var array host => number of requests made to it */
    private $calls = [];

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.disable_external_calls' => false]);

        Http::fake(function ($request) {
            $url = $request->url();

            if (str_contains($url, 'about/user')) {
                $authorization = $request->header('Authorization')[0] ?? $request->header('authorization')[0] ?? '';
                if ($authorization !== "Bearer {$this->token}") {
                    return Http::response(null, 401);
                }

                return Http::response(['data' => ['id' => '1']]);
            }

            foreach (['open.er-api.com', 'api.fxratesapi.com'] as $host) {
                if (str_contains($url, $host)) {
                    $this->calls[$host] = ($this->calls[$host] ?? 0) + 1;

                    return Http::response([
                        'rates' => ['USD' => 1, 'EUR' => 0.9],
                        'time_last_update_utc' => 'Sat, 20 Sep 2026 00:00:01 +0000',
                    ]);
                }
            }

            return Http::response(null, 404);
        });
    }

    private function exchangeRates()
    {
        return $this->withHeaders(['Authorization' => "Bearer {$this->token}"])
            ->getJson('/api/currencies/exchange');
    }

    // ---------------------------

    public function test_exchange_rates_are_fetched_when_external_calls_are_allowed()
    {
        $response = $this->exchangeRates();

        $response->assertOk();
        $response->assertJsonPath('rates.EUR', 0.9);
        $this->assertSame(1, $this->calls['open.er-api.com'] ?? 0);
    }

    public function test_disabling_external_calls_skips_the_rate_providers()
    {
        config(['app.disable_external_calls' => true]);

        $response = $this->exchangeRates();

        $response->assertOk();
        $this->assertSame([], $this->calls);
    }

    public function test_disabling_external_calls_still_returns_the_bundled_currency_metadata()
    {
        config(['app.disable_external_calls' => true]);

        $response = $this->exchangeRates();

        $response->assertJsonPath('date', null);
        $this->assertSame([], $response->json('rates'));
        // The currency list ships with the app, so it stays available offline
        $this->assertNotEmpty($response->json('currencies'));
        $this->assertContains('EUR', array_column($response->json('currencies'), 'code'));
    }

    public function test_exchange_rates_without_a_valid_token_fail()
    {
        $this->withHeaders(['Authorization' => 'Bearer not-the-right-token'])
            ->getJson('/api/currencies/exchange')
            ->assertStatus(401);
    }
}
