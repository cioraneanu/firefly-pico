<?php
/**
 * Created by PhpStorm.
 * User: teodor.g.ion
 * Date: 03/01/2018
 */

namespace App\Exceptions;

use App\Http\Controllers\Base\APIController;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;

/**
 * Class GeneralException.
 */
class FireflyException extends Exception
{
    /**
     * @var
     */
    public $message;


    /**
     * GeneralException constructor.
     *
     * @param string $message
     * @param int $code
     * @param Throwable|null $previous
     */
    public function __construct($response)
    {
        $message = $response->json()['message'];
        $status = $response->status();

//        $message = "Error: $message";
        parent::__construct($message, $status);
    }

    /**
     * Report the exception.
     *
     * @return void
     */
    public function report()
    {
        //
    }

    /**
     * Render the exception into an HTTP response.
     *
     * @param Request
     * @return Response
     */
    public function render($request)
    {
        /*
         * All instances of GeneralException redirect back with a flash message to show a bootstrap alert-error
         */
        return redirect()
            ->back()
            ->withInput($request->except('password', 'password_confirmation'))
            ->withFlashDanger($this->message);
    }
}
