<?php

namespace App\Http\Controllers\Base;


use App\Exceptions\GeneralException;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Base API Controller.
 */
class BaseController extends Controller
{
    //  ================================================================================
    //  =============================   CONSTANTS   ====================================
    //  ================================================================================

    const HTTP_CODE_OK = 200;
    const HTTP_CODE_INSERT = 201;
    const HTTP_CODE_UPDATE = 202;
    const HTTP_CODE_OK_DELETE = 204;


    const HTTP_CODE_BAD_REQUEST = 400;
    const HTTP_CODE_UNAUTHORIZED = 401;
    const HTTP_CODE_FORBIDDEN = 403;
    const HTTP_CODE_NOT_FOUND = 404;
    const HTTP_CODE_CONFLICT = 409;
    const HTTP_CODE_UNPROCESSABLE_ENTITY = 422;
    const HTTP_CODE_INTERNAL_SERVER_ERROR = 500;

    //  ================================================================================
    //  ==============================   FIELDS   ======================================
    //  ================================================================================

    protected $statusCode = self::HTTP_CODE_OK;

    //  ================================================================================
    //  ===========================   ROUTE METHODS   ==================================
    //  ================================================================================

    public function getQuery()
    {
        throw new GeneralException("Implement me!");
    }


    public function getOne(Request $request)
    {
        // TODO: Implement getOne() method.
    }

    public function getAll(Request $request)
    {
        // TODO: Implement getAll() method.
    }

    public function getTable(Request $request)
    {
        // TODO: Implement getTable() method.
    }

    public function getCount(Request $request)
    {
        $response = $this->getQuery()->count();
        return $this->respond($response);
    }



    //  ================================================================================
    //  ============================   HELPER  METHODS   ===============================
    //  ================================================================================

    public function getStatusCode()
    {
        return $this->statusCode;
    }

    public function respondSuccessWithData($data)
    {
        return $this->setStatusCode(self::HTTP_CODE_OK)->respond($data);
    }

    public function setStatusCode($statusCode)
    {
        $this->statusCode = $statusCode;
        return $this;
    }

    public function respond($data, $headers = [])
    {
        return response()->json($data, $this->getStatusCode(), $headers);
    }


}
