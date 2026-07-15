<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseController;
use Illuminate\Http\Request;


class UserController extends BaseController
{

    public function getUser(Request $request)
    {
        return getUser();
    }
}
