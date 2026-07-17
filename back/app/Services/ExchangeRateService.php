<?php

namespace App\Services;

use App\Http\Controllers\Base\BaseController;
use App\Http\Controllers\Base\BaseControllerFirefly;
use Illuminate\Support\Facades\Cache;

class ExchangeRateService
{
    /**
     * Extend the USD based rates table with rates defined in Firefly, so custom currencies
     * (like credit card reward points) convert like any other currency instead of producing NaN totals.
     */
    public function mergeFireflyRates($data)
    {
        $pairs = $this->getFireflyRatePairs();
        if ($pairs->isEmpty()) {
            return $data;
        }

        $rates = collect($data['rates']);
        // A pair can only be resolved once one of its sides is known, so keep looping while
        // progress is made to also cover chains like PTS -> AMR -> USD.
        do {
            $sizeBefore = $rates->count();
            foreach ($pairs as $pair) {
                if ($pair['rate'] <= 0) {
                    continue;
                }
                if (!$rates->has($pair['from']) && $rates->has($pair['to'])) {
                    $rates[$pair['from']] = $rates[$pair['to']] / $pair['rate'];
                }
                if (!$rates->has($pair['to']) && $rates->has($pair['from'])) {
                    $rates[$pair['to']] = $rates[$pair['from']] * $pair['rate'];
                }
            }
        } while ($rates->count() > $sizeBefore);

        $data['rates'] = $rates;
        $data['currencies'] = $this->appendCustomCurrencies($data['currencies'], $pairs);
        return $data;
    }

    private function appendCustomCurrencies($currencies, $pairs)
    {
        $knownCodes = collect($currencies)->pluck('code')->flip();
        $customCurrencies = $pairs
            ->flatMap(fn($pair) => [$pair['from'] => $pair['fromName'], $pair['to'] => $pair['toName']])
            ->reject(fn($name, $code) => $knownCodes->has($code))
            ->map(fn($name, $code) => ['code' => $code, 'name' => $name, 'country' => null])
            ->values();

        return collect($currencies)->concat($customCurrencies);
    }

    /**
     * The latest rate of each currency pair defined in Firefly, cached per user.
     */
    private function getFireflyRatePairs()
    {
        return Cache::remember('exchange_firefly_' . getUserId(), 60 * 60, function () {
            $url = config('app.firefly_url') . '/api/v1/exchange-rates?limit=5000';
            try {
                $response = (new BaseControllerFirefly())->getHttpClient()->get($url);
            } catch (\Exception $exception) {
                return collect();
            }

            // Older Firefly versions don't have this endpoint
            if ($response->status() !== BaseController::HTTP_CODE_OK) {
                return collect();
            }

            // Firefly returns rates ordered by date ascending, so keying by pair keeps the latest rate
            return collect(fget($response->json(), 'data'))
                ->map(fn($item) => fget($item, 'attributes'))
                ->keyBy(fn($attributes) => fget($attributes, 'from_currency_code') . '/' . fget($attributes, 'to_currency_code'))
                ->map(fn($attributes) => [
                    'from' => fget($attributes, 'from_currency_code'),
                    'fromName' => fget($attributes, 'from_currency_name'),
                    'to' => fget($attributes, 'to_currency_code'),
                    'toName' => fget($attributes, 'to_currency_name'),
                    'rate' => (float)fget($attributes, 'rate'),
                ])
                ->values();
        });
    }
}
