<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;


class FireflyProxyController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/");
    }

    // ---------------------------


    public function proxyRequest(Request $request)
    {
        $url = $this->getFullUrl();
        $body = $request->getContent();
        $method = $request->method();
        $response = $this->getHttpClient()->send($method, $url, ['body' => $body]);
        return response($response->body(), $response->getStatusCode());
    }


}
