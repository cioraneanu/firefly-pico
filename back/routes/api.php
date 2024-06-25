<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransactionTemplateController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VersionController;
use App\Utils\RouteUtils;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/


// Own resources
Route::get('latest-version', [VersionController::class, 'getLatestVersion']);
Route::get('user', [UserController::class, 'getUser']);
RouteUtils::makeCRUD("transaction-templates", TransactionTemplateController::class);

// Firefly proxied resources
RouteUtils::makeCRUD("accounts", AccountController::class);
RouteUtils::makeCRUD("categories", CategoryController::class);
RouteUtils::makeCRUD("tags", TagController::class);
RouteUtils::makeCRUD("currencies", CurrencyController::class);
Route::get('currencies/exchange', [CurrencyController::class, 'exchangeRates']);

RouteUtils::makeCRUD("transactions", TransactionController::class);
Route::get('search/transactions', [TransactionController::class, 'getAll']);

Route::get("profile", [AppSettingsController::class, "get"]);
Route::put("profile", [AppSettingsController::class, "createOrUpdate"]);


//Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//    return $request->user();
//});

Route::get('/test', function (Request $request) {
    return "Test!";
});



