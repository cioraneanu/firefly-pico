<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\FireflyProxyController;
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
RouteUtils::makeCRUD("budgets", BudgetController::class);
RouteUtils::makeCRUD("tags", TagController::class);

// RouteUtils::makeCRUD("currencies", CurrencyController::class);

Route::get("currencies/{id}", [CurrencyController::class, 'getOne'])->where('id', '[0-9]+');
Route::get("currencies", [CurrencyController::class, 'getAll']);
Route::post("currencies", [CurrencyController::class, 'create']);
Route::put("currencies/{code}", [CurrencyController::class, 'update']);
Route::delete("currencies/{code}", [CurrencyController::class, 'delete']);

Route::get('currencies/exchange', [CurrencyController::class, 'exchangeRates']);

Route::get('budget-limits', [BudgetController::class, 'getBudgetLimits']);


RouteUtils::makeCRUD("transactions", TransactionController::class);
Route::get('search/transactions', [TransactionController::class, 'getAll']);


RouteUtils::makeCRUD("profiles", ProfileController::class);



Route::get('/test', function (Request $request) {
    return "Test!";
});

// Just proxy the requests in which we do not change anything straight to Firefly III
$proxyMethods = ['get', 'post', 'put', 'patch', 'delete'];
foreach ($proxyMethods as $proxyMethod) {
    Route::$proxyMethod('{any?}', [FireflyProxyController::class, 'proxyRequest'])->where('any', '.*');
}




