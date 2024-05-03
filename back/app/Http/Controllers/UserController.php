<?php

namespace App\Http\Controllers;

use App\Exceptions\FireflyException;
use App\Http\Controllers\Base\BaseController;
use App\Http\Controllers\Base\BaseControllerFirefly;
use Illuminate\Http\Request;


class UserController extends BaseController
{


    public function getUser(Request $request)
    {
        return getUser();
    }


}
