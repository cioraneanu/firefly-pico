<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\PiggyBank;


class PiggyBankController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/piggy-banks", PiggyBank::class);
    }

}
