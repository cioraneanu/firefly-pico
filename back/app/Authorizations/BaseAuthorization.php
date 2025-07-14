<?php

namespace App\Authorizations;

use App\Exceptions\GeneralException;
use App\Http\Authorization\Base\ResourceAuthorisationContract;
use App\Http\Controllers\Base\APIController;
use App\Http\Controllers\Base\BaseController;


class BaseAuthorization
{
    public static function checkUser()
    {
        if (!getUser()) {
            throw new GeneralException("Unauthorized", BaseController::HTTP_CODE_UNAUTHORIZED);
        }
    }

}
