<?php

namespace App\Validations;

use App\Http\Validation\Base\ResourceValidationContract;
use Illuminate\Http\Request;


class TransactionTemplateValidation
{
    public static function validateCreate(Request $request)
    {
        self::commonValidation($request);
    }

    public static function validateUpdate(Request $request)
    {
        self::commonValidation($request);
    }

    public static function validateDelete(Request $request)
    {
    }

    private static function commonValidation(Request $request)
    {
        $request->validate([
            'name' => 'required|max:1000',
//            'description' => 'nullable|max:10000',
        ]);
    }
}
