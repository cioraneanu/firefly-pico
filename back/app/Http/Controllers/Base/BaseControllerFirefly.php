<?php

namespace App\Http\Controllers\Base;


use App\Exceptions\FireflyException;
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
//        Log::debug("regexing!", ['$fullUrl' => $fullUrl, '$matches' => $matches, 'url' => $this->url]);
        return config('app.firefly_url') . "/api/v1/" . $matches[2];
//        return ($baseUrl ?? $this->url) . $matches[1];


//        $fullUrl = request()->fullUrl();
//        $pattern = "#/api/([a-zA-Z0-9\-\_\/]+)(.*)#";
//        $regexResult = preg_match($pattern, $fullUrl, $matches);
//        if (!$regexResult) {
//            return null;
//        }
//        Log::debug("regexing!", ['$fullUrl' => $fullUrl, '$matches' => $matches, 'url' => $this->url]);
//        return ($baseUrl ?? $this->url) . $matches[1];
    }

    public function getHttpClient()
    {
        return Http::withHeaders($this->getHeaders());
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
        $collection = fcollect($list['data']);
        $idList = $collection->pluck("id");
        $dictionary = $this->model::whereIn('id', $idList)->get()->keyBy('id');


        for ($i = 0; $i < $collection->count(); $i++) {
            $modelItemId = fget($collection, "$i.id");
            $modelItem = fget($dictionary, $modelItemId);
            // If the Firefly resource is not present in our DB, we cannot add anything.. Just skip it :)
            if (!$modelItem) {
                continue;
            }

            $newData = fcollect($this->model::$extraFields)->reduce(function ($carry, $item) use ($modelItem) {
                $carry[$item] = fget($modelItem, $item);
                return $carry;
            }, []);

            $path = $isList ? "data.$i.attributes" : "data.attributes";
            foreach ($newData as $key => $value) {
                fset($list, "$path.$key", $value);
            }
        }

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
