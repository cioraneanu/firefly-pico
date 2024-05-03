<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Account;


class AccountController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/accounts", Account::class);
    }

}
