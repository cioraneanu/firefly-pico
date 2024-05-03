<?php

namespace App\Authorizations;

use App\Exceptions\GeneralException;
use App\Http\Authorization\Base\ResourceAuthorisationContract;
use App\Http\Controllers\Base\APIController;
use App\Http\Controllers\Base\BaseController;


class TransactionTemplateAuthorization
{
    public static function authorizeRead()
    {
        self::commonAuthorization();
    }

    public static function authorizeCreate()
    {
        self::commonAuthorization();
    }

    public static function authorizeUpdate()
    {
        self::commonAuthorization();
    }

    public static function authorizeDelete()
    {
        self::commonAuthorization();
    }

    // -----------

    private static function commonAuthorization()
    {
        if (!getUser()) {
            throw new GeneralException("Unauthorized", BaseController::HTTP_CODE_UNAUTHORIZED);
        }
    }
}
