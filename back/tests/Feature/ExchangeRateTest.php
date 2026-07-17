<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExchangeRateTest extends TestCase
{
    private $fireflyRates = [];
    private $fireflyRatesStatus = 200;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        Http::fake(function ($request) {
            if (str_contains($request->url(), 'open.er-api.com')) {
                return Http::response(['rates' => ['USD' => 1, 'RON' => 4.5], 'time_last_update_utc' => 'Fri, 17 Jul 2026 00:02:31 +0000']);
            }
            if (str_contains($request->url(), 'fxratesapi.com')) {
                return Http::response(['rates' => []]);
            }
            if (str_contains($request->url(), 'about/user')) {
                return Http::response(['data' => ['id' => '1']]);
            }
            if (str_contains($request->url(), 'exchange-rates')) {
                return Http::response(['data' => $this->fireflyRates], $this->fireflyRatesStatus);
            }

            return Http::response(null, 404);
        });
    }

    private function fireflyRate($from, $to, $rate, $date = '2026-01-01')
    {
        return ['attributes' => [
            'from_currency_code' => $from,
            'from_currency_name' => "$from name",
            'to_currency_code' => $to,
            'to_currency_name' => "$to name",
            'rate' => (string)$rate,
            'date' => "{$date}T00:00:00+00:00",
        ]];
    }

    private function getRates()
    {
        $response = $this->getJson('api/currencies/exchange', ['Authorization' => 'Bearer test-token']);
        $response->assertOk();
        return $response->json();
    }

    public function test_custom_currency_rate_defined_in_firefly_is_merged()
    {
        $this->fireflyRates = [$this->fireflyRate('AMR', 'USD', 0.11)];

        $body = $this->getRates();

        $this->assertEqualsWithDelta(1 / 0.11, $body['rates']['AMR'], 0.0001);
        $this->assertEquals(4.5, $body['rates']['RON']);
        $this->assertContains(['code' => 'AMR', 'name' => 'AMR name', 'country' => null], $body['currencies']);
    }

    public function test_rates_are_derived_in_both_directions_and_across_chains()
    {
        $this->fireflyRates = [
            $this->fireflyRate('USD', 'AMR', 9),
            $this->fireflyRate('PTS', 'AMR', 3),
        ];

        $body = $this->getRates();

        $this->assertEqualsWithDelta(9, $body['rates']['AMR'], 0.0001);
        // 1 PTS = 3 AMR = 3/9 USD
        $this->assertEqualsWithDelta(3, $body['rates']['PTS'], 0.0001);
    }

    public function test_latest_rate_of_a_pair_wins()
    {
        $this->fireflyRates = [
            $this->fireflyRate('AMR', 'USD', 0.5, '2026-01-01'),
            $this->fireflyRate('AMR', 'USD', 0.25, '2026-02-01'),
        ];

        $body = $this->getRates();

        $this->assertEqualsWithDelta(4, $body['rates']['AMR'], 0.0001);
    }

    public function test_external_rates_are_kept_when_firefly_has_no_exchange_rates_endpoint()
    {
        $this->fireflyRatesStatus = 404;

        $body = $this->getRates();

        $this->assertEquals(['USD' => 1, 'RON' => 4.5], $body['rates']);
    }
}
