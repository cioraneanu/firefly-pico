<?php

namespace App\Http\Controllers;

use App\Exceptions\FireflyException;
use App\Http\Controllers\Base\BaseControllerFirefly;
use Illuminate\Http\Request;


class TransactionController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/transactions");
    }

    public function search(Request $request)
    {
        $url = $this->getFullUrl();
        $response = $this->getHttpClient()->get($url);

        if ($response->status() !== self::HTTP_CODE_OK) {
            throw new FireflyException($response);
        }
        $data = $response->json();
        $data = $this->onPostGet($data);
        return $data;
    }

    // ---------------------------


}
