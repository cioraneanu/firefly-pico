<?php

namespace App\Authorizations;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;


class AssistantAuthorization
{
    public static function authorizeRead()
    {
        self::commonAuthorization();
    }

    public static function authorizeCreate()
    {
        self::commonAuthorization();
    }

    public static function authorizeDelete()
    {
        self::commonAuthorization();
    }

    public static function authorizeUse()
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
