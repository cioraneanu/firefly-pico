<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Tag;
use Illuminate\Http\Request;


class FireflyProxyController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/");
    }

    // ---------------------------


    public function proxyRequest(Request $request) {

        $url = $this->getFullUrl();
        $body = $request->all();
        $method = $request->method();
//        dd($url, $body, $method);
        $response = $this->getHttpClient()->get($url, $body);

        return $response->body();
    }



}
