<?php

namespace App\Services;

use App\Http\Controllers\Base\BaseController;
use App\Utils\CurrencyUtils;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ExchangeRateService
{

    public function getRates()
    {
        $date = Carbon::now()->startOfDay()->format("Y-m-d");
        $cacheKey = "exchange_$date";

        return Cache::get($cacheKey) ?? $this->fetchRates($cacheKey);
    }

    // ---------------------------- PRIVATE --------------------------

    private function fetchRates($cacheKey)
    {
        $rates = collect();
        $updatedAt = null;

        // Fetch rates from ExchangeRate API
        $exchangeRateAPIResponse = $this->get("https://open.er-api.com/v6/latest/USD");
        if ($exchangeRateAPIResponse?->status() === BaseController::HTTP_CODE_OK) {
            $exchangeRateAPIBody = $exchangeRateAPIResponse->json();
            $rates = $rates->merge(collect(fget($exchangeRateAPIBody, 'rates')));
            $updatedAt = Carbon::parse(fget($exchangeRateAPIBody, 'time_last_update_utc'))->startOfDay()->format("Y-m-d");
        }

        // Fetch rates from FXRates API
        $fxRatesAPIResponse = $this->get("https://api.fxratesapi.com/latest");
        if ($fxRatesAPIResponse?->status() === BaseController::HTTP_CODE_OK) {
            // Merge rates, prioritizing rates from the first API
            $rates = collect(fget($fxRatesAPIResponse->json(), 'rates'))->merge($rates);
        }

        $result = [
            'date' => $updatedAt,
            'rates' => $rates,
            'currencies' => CurrencyUtils::CURRENCIES
        ];

        // A failed fetch is retried after a few minutes rather than served empty for days
        Cache::put($cacheKey, $result, $rates->isNotEmpty() ? 60 * 60 * 24 * 5 : 60 * 10);

        return $result;
    }

    private function get($url)
    {
        return rescue(fn() => Http::connectTimeout(5)->timeout(10)->get($url), null, false);
    }

}
