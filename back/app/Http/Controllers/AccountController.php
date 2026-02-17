<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Str;


class AccountController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/accounts", Account::class);
    }


    public function getAccountGroups(Request $request)
    {
        $text = $request->text;
        return Account::distinct()->pluck('group')->filter(function ($value) use ($text) {
            return $text ? Str::contains($value, $text, true) : !!$value;
        })->values();
    }

}
