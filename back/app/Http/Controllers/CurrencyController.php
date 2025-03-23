<?php

namespace App\Http\Controllers;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Utils\CurrencyUtils;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;


class CurrencyController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/currencies");
    }

    // ---------------------------


    public function exchangeRates()
    {
        if (!getUser()) {
            throw new GeneralException("Unauthorized", BaseController::HTTP_CODE_UNAUTHORIZED);
        }

        $date = Carbon::now()->startOfDay()->format("Y-m-d");
        $cacheKey = "exchange_$date";
        return Cache::remember($cacheKey, 60 * 60 * 24 * 5, function () {
            // Fetch rates from ExchangeRate API
            $response_er_api = Http::get("https://open.er-api.com/v6/latest/USD");
            if ($response_er_api->status() !== self::HTTP_CODE_OK) {
                return null;
            }

            $body_er_api = $response_er_api->json();
            $rates = fget($body_er_api, 'rates');

            // Fetch rates from FXRates API
            $response_fxrates = Http::get("https://api.fxratesapi.com/latest");
            if ($response_fxrates->status() === self::HTTP_CODE_OK) {
                $body_fxrates = $response_fxrates->json();
                $rates_fxrates = fget($body_fxrates, 'rates');

                // Merge rates, prioritizing rates from the first API
                foreach ($rates_fxrates as $currency => $rate) {
                    if (!isset($rates[$currency])) {
                        $rates[$currency] = $rate;
                    }
                }
            }

            return [
                'date' => Carbon::parse(fget($body_er_api, 'time_last_update_utc'))->startOfDay()->format("Y-m-d"),
                'rates' => $rates,
                'currencies' => CurrencyUtils::CURRENCIES
            ];
        });
    }
}
