<?php

namespace App\Utils;

use Illuminate\Support\Facades\Route;

class RouteUtils
{
    public static function makeCRUD($routeName, $controller)
    {
        Route::get("$routeName/{id}", [$controller, 'getOne'])->where('id', '[0-9]+');
        Route::get($routeName, [$controller, 'getAll']);

        Route::post("$routeName", [$controller, 'create']);
        Route::patch("$routeName/{id}", [$controller, 'update'])->where('id', '[0-9]+');
        Route::put("$routeName/{id}", [$controller, 'update'])->where('id', '[0-9]+');
        Route::delete("$routeName/{id}", [$controller, 'delete'])->where('id', '[0-9]+');
    }

}
