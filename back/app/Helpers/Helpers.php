<?php


use App\Http\Controllers\Base\BaseController;
use App\Http\Controllers\Base\BaseControllerFirefly;
use Illuminate\Support\Facades\Cache;


if (!function_exists('getAuthTokenHash')) {
    function getAuthTokenHash()
    {
        $token = request()->bearerToken();
        return hash('sha256', $token);
    }
}


if (!function_exists('getUser')) {
    function getUser()
    {
        return Cache::driver('array')->rememberForever('getUser', function () {
            $httpClient = (new BaseControllerFirefly())->getHttpClient();
            $url = config('app.firefly_url') . '/api/v1/about/user';
            $response = $httpClient->get($url);
            if ($response->status() !== BaseController::HTTP_CODE_OK) {
                return null;
            }
            return $response->json();
        });
    }
}


if (!function_exists('fget')) {

    function fget($variable, $fields, $default = null, $params = [])
    {
        if (!$fields) return $variable;

        $result = $variable;
        $fieldsList = explode('.', $fields);
        foreach ($fieldsList as $field) {
            if (is_object($result) && checkIfObjectHasProperty($result, $field)) {
                if (checkIfFieldIsMethod($field)) {
                    $methodName = removeMethodParam($field);
                    $paramsList = getMethodParamsList($field);
                    $paramsList2 = collect($paramsList)->map(function ($item) use ($params) {
                        if (!array_key_exists($item, $params)) {
                            throw new Exception("You did not provide param with name '$item'");
                        }
                        return $params[$item];
                    });
                    $result = $result->$methodName(...$paramsList2);
                } else {
                    $result = $result->$field;
                }

            } else if (is_array($result)) {
                if (checkIfFieldIsIndex($field)) {
                    // Remove () and/or ($variable)
                    $index = getIndexFromField($field);
                    if (array_key_exists($index, $result)) {
                        $result = $result[$index];
                    }
                } else {

                    if (array_key_exists($field, $result)) {
                        $result = $result[$field];
                    } else {
                        return $default;
                    }
                }
            } else if ($result instanceof \Illuminate\Support\Collection) {
                $processedField = checkIfFieldIsIndex($field) ? getIndexFromField($field) : $field;
                if (!$result->has($processedField)) {
                    return $default;
                }
                $result = $result->get($processedField);
            } else {
                return $default;
            }
        }
        return $result;
    }


    function checkIfObjectHasProperty($variable, $field)
    {
        try {
            $result = $variable->$field;
            return true;
        } catch (Exception $e) {
            return false;
        }

//        if (checkIfFieldIsMethod($field)) {
//            // Remove () and/or ($variable)
//            $methodName = removeMethodParam($field);
//            $result = method_exists($variable, $methodName);
//            return $result;
//        }
//        if (is_subclass_of($variable, config('funky.laravel_model_class'))) {
//            // Check if has relation
//            $result = array_key_exists($field, $variable->getRelations());
//            if ($result) {
//                return $result;
//            }
//            // Check if has attribute
////            dd($variable->getAttributes());
//            return array_key_exists($field, $variable->getAttributes());
//        }
//
//        if (method_exists($variable, 'toArray')) {
//            $arrayKeyexists = array_key_exists($field, $variable->toArray());
//
//            return array_key_exists($field, $variable->toArray());
//        }
//        return property_exists($variable, $field);
    }

    function checkIfFieldIsIndex($field)
    {
        return preg_match('/\[.*?\]/', $field);
    }

    function getIndexFromField($field)
    {
        return substr($field, strripos($field, "[") + 1, strripos($field, "]") - 1);
    }

    function checkIfFieldIsMethod($field)
    {
        return preg_match('/.*\(.*\)/', $field);
    }

    function removeMethodParam($method)
    {
        return preg_replace('/(.*)(\(.*\))/', '$1', $method);
    }

    function getMethodParamsList($method)
    {
        $params = preg_replace('/(.*)(\(.*\))/', '$2', $method);
        $params = str_replace(['(', ')'], "", $params);
        if (strlen($params) === 0) return [];

        return explode(',', $params);
    }

    function checkIfObjectHasMethod($variable, $field)
    {
        if (checkIfFieldIsMethod($field)) {
            // Remove () and/or ($variable)
            $methodName = removeMethodParam($field);
            $result = method_exists($variable, $methodName);
            return $result;
        }
    }

}

if (!function_exists('fset')) {
    function fset(&$array, $path, $value)
    {
        $pathList = explode('.', $path);

        $temp = &$array;
        foreach ($pathList as $key) {
            $temp = &$temp[$key];
        }
        $temp = $value;
        unset($temp);
    }
}

if (!function_exists('fcollect')) {
    function fcollect($variable)
    {
        if (!$variable) {
            return collect([]);
        }

        if ($variable instanceof Paginator || $variable instanceof LengthAwarePaginator) {
            return $variable->getCollection();
        }

        if (is_array($variable)) {
            if (isAssociative($variable)) {
                return collect([$variable]);
            } else {
                $result = collect($variable);
                return (requiresFlat($result)) ? $result->flatten() : $result;
            }
        }

        if (($variable instanceof \Illuminate\Support\Collection)) {
            return $variable;
        }

        if (($variable instanceof \Illuminate\Database\Eloquent\Collection)) {
            return $variable;
        }

        // Is not null and not list => it is just one item
        return collect([$variable]);
    }
}


if (!function_exists('requiresFlat')) {
    function requiresFlat($list)
    {
        if (isAssociative($list)) {
            return false;
        }

        $list = fcollect($list);

        $list = $list->first();
        if (!$list) {
            return false;
        }

        if (is_int($list)) {
            return false;
        }

        if (is_array($list) && count($list) == 0) {
            return true;
        }

        if (($list instanceof \Illuminate\Database\Eloquent\Collection || $list instanceof \Illuminate\Support\Collection) && $list->isEmpty()) {
            return true;
        }

        if (isAssociative($list)) {
            return false;
        }

        return true;
    }
}

if (!function_exists('isAssociative')) {
    function isAssociative($value)
    {
        if (!$value) {
            return false;
        }
        if ($value === []) {
            return false;
        }

        if ($value instanceof \Illuminate\Database\Eloquent\Model) {
            return true;
        }

        if ($value instanceof \Illuminate\Support\Collection) {
            return $value->keys() != collect(range(0, $value->count() - 1));
        }

        if (is_array($value)) {
            return array_keys($value) !== range(0, count($value) - 1);
        }

        return false;
    }
}


