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

        return Cache::remember($cacheKey, 60 * 60 * 24 * 5, function () {
            $rates = collect();
            $updatedAt = null;

            // Fetch rates from ExchangeRate API
            $exchangeRateAPIResponse = Http::get("https://open.er-api.com/v6/latest/USD");

            if ($exchangeRateAPIResponse->status() === BaseController::HTTP_CODE_OK) {
                $exchangeRateAPIBody = $exchangeRateAPIResponse->json();
                $exchangeRateAPIRates = collect(fget($exchangeRateAPIBody, 'rates'));
                $rates = $rates->merge($exchangeRateAPIRates);
                $updatedAt = Carbon::parse(fget($exchangeRateAPIBody, 'time_last_update_utc'))->startOfDay()->format("Y-m-d");
            }

            // Fetch rates from FXRates API
            $fxRatesAPIResponse = Http::get("https://api.fxratesapi.com/latest");
            if ($fxRatesAPIResponse->status() === BaseController::HTTP_CODE_OK) {
                $fxRates = collect(fget($fxRatesAPIResponse->json(), 'rates'));
                // Merge rates, prioritizing rates from the first API
                $rates = $fxRates->merge($rates);
            }

            return [
                'date' => $updatedAt,
                'rates' => $rates,
                'currencies' => CurrencyUtils::CURRENCIES
            ];
        });
    }

}
