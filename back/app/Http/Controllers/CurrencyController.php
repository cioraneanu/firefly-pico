<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Services\ExchangeRateService;


class CurrencyController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/currencies");
    }

    // ---------------------------


    public function exchangeRates(ExchangeRateService $exchangeRateService)
    {
        BaseAuthorization::checkUser();
        return $exchangeRateService->getRates();
    }


}
