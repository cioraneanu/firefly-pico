<?php

namespace App\Exceptions;

use App\Http\Controllers\Base\APIController;
use App\Utils\ResponseUtils;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $exception)
    {
        if ($exception instanceof GeneralException) {
            return response()->json([
                'payload' => $exception->payload,
                'message' => $exception->getMessage()
            ], $exception->getCode());
        }

        if ($exception instanceof FireflyException) {
            return response()->json([
                'message' => $exception->getMessage()
            ], $exception->getCode());
        }


        return parent::render($request, $exception);
    }
}
