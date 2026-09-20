<?php

namespace App\Http\Controllers\Base;


use App\Exceptions\FireflyException;
use App\Services\SyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Base API Controller.
 */
class BaseControllerFirefly extends BaseController
{

    protected $url;
    protected $model;

    public function __construct($endpoint = "", $model = null)
    {
        $this->url = config('app.firefly_url') . $endpoint;
        $this->model = $model ? app($model) : null;
    }


    // -------------------------------------

    private function getHeaders()
    {
        return [
            "authorization" => request()->headers->get('authorization'),
            "content-type" => request()->headers->get('content-type'),
            "accept" => request()->headers->get('accept')
        ];
    }

    protected function getFullUrl($baseUrl = null)
    {
        $fullUrl = request()->fullUrl();
        $pattern = "#(.*)/api/(.*)#";
        $regexResult = preg_match($pattern, $fullUrl, $matches);
        if (!$regexResult) {
            return null;
        }
        return config('app.firefly_url') . "/api/v1/" . $matches[2];
    }

    public function getHttpClient()
    {
        return Http::withHeaders($this->getHeaders())->connectTimeout(10)->timeout(10);
    }

    // -------------------------------------

    public function getOne(Request $request)
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

    public function getAll(Request $request)
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

    public function create(Request $request)
    {
        $url = $this->getFullUrl();
        $body = $request->all();
        $response = $this->getHttpClient()->post($url, $body);

        if ($response->status() !== self::HTTP_CODE_OK) {
            throw new FireflyException($response);
        }

        $data = $this->onPostSave($response->json());
        return $data;
    }

    public function update(Request $request)
    {
        $url = $this->getFullUrl();
        $body = $request->all();
        $response = $this->getHttpClient()->put($url, $body);

        if ($response->status() !== self::HTTP_CODE_OK) {
            throw new FireflyException($response);
        }

        $data = $this->onPostSave($response->json());
        return $data;
    }

    public function delete(Request $request)
    {
        $url = $this->getFullUrl();
        $response = $this->getHttpClient()->delete($url);
        if ($response->status() !== self::HTTP_CODE_OK_DELETE) {
            throw new FireflyException($response);
        }
        $data = $this->onPostDelete($response->json());
        return $data;
    }

    // --------


    protected function onPostGet($list)
    {
        if (!$this->model) {
            return $list;
        }

        $isList = !isAssociative($list['data']);
        $items = $isList ? $list['data'] : [$list['data']];
        $items = SyncService::mergeExtras($items, $this->model);
        $list['data'] = $isList ? $items : fget($items, '0');

        return $list;
    }


    protected function onPostSave($item)
    {
        if (!$this->model) {
            return $item;
        }

        $id = fget($item, 'data.id');
        $find = ['id' => $id];
        $fill = request()->only($this->model::$extraFields);
        $this->model::updateOrCreate($find, $fill);
        foreach ($fill as $key => $value) {
            fset($item, "data.attributes.$key", $value);
        }
        return $item;
    }


    protected function onPostDelete($item)
    {
        if (!$this->model) {
            return $item;
        }
        $id = request()->id;
        if ($id) {
            $this->model::where('id', $id)->delete();
        }
        return $item;
    }

    // ------


//    protected function onPostGet($list)
//    {
//        return $list;
//    }
//
//    protected function onPostSave($item)
//    {
//        return $item;
//    }
//
//    protected function onPostDelete($item)
//    {
//        return $item;
//    }

}
