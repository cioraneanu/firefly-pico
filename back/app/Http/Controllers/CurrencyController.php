<?php

namespace App\Http\Controllers;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use App\Http\Controllers\Base\BaseControllerFirefly;
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

//         Log::debug("Currency call");
        $date = Carbon::now()->startOfDay()->format("Y-m-d");
        $cacheKey = "exchange_$date";
        return Cache::remember($cacheKey, 60 * 60 * 24 * 5, function () {
//         Log::debug("Currency call live");
            $response = Http::get("https://open.er-api.com/v6/latest/USD");
            if ($response->status() !== self::HTTP_CODE_OK) {
                return null;
            }
            $body = $response->json();
            return [
                'date' => Carbon::parse(fget($body, 'time_last_update_utc'))->startOfDay()->format("Y-m-d"),
                'rates' => fget($body, 'rates')
            ];
        });
    }


}
