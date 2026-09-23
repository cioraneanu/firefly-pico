<?php

namespace App\Services;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use App\Models\Account;
use App\Models\Budget;
use App\Models\Category;
use App\Models\PiggyBank;
use App\Models\Recurrence;
use App\Models\Tag;
use App\Models\TransactionTemplate;
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class SyncService
{
    const PAGE_SIZE = 1000;

    const FIREFLY_ENTITIES = [
        'accounts' => ['/api/v1/accounts', Account::class],
        'categories' => ['/api/v1/categories', Category::class],
        'budgets' => ['/api/v1/budgets', Budget::class],
        'budget-limits' => ['/api/v1/budget-limits', null],
        'tags' => ['/api/v1/tags', Tag::class],
        'piggy-banks' => ['/api/v1/piggy-banks', PiggyBank::class],
        'recurrences' => ['/api/v1/recurrences', Recurrence::class],
        'currencies' => ['/api/v1/currencies', null],
    ];

    public function __construct(private readonly ExchangeRateService $exchangeRateService) {}

    // -------------------------------------

    public static function mergeExtras($list, $modelClass)
    {
        if (!$modelClass || count($list) === 0) {
            return $list;
        }

        $idList = fcollect($list)->pluck('id');
        $dictionary = $modelClass::whereIn('id', $idList)->get()->keyBy('id');

        foreach ($list as $index => $item) {
            $modelItem = fget($dictionary, fget($item, 'id'));
            // If the Firefly resource is not present in our DB, we cannot add anything.. Just skip it :)
            if (!$modelItem) {
                continue;
            }

            foreach ($modelClass::$extraFields as $field) {
                fset($list, "$index.attributes.$field", fget($modelItem, $field));
            }
        }

        return $list;
    }

    public function sync(array $entities, array $params, $force = false)
    {
        $cacheKey = $this->getCacheKey($entities, $params);
        if ($force) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, config('app.sync_cache_seconds'), function () use ($entities, $params) {
            $data = $this->fetchAll($entities, $params);

            return [
                'hash' => md5(json_encode($data)),
                'data' => $data,
            ];
        });
    }

    // Bumping the version orphans every cached sync payload of that Firefly user
    public static function bumpVersion($userId)
    {
        $key = self::getVersionKey($userId);
        Cache::put($key, Cache::get($key, 0) + 1, 60 * 60 * 24 * 30);
    }

    // ---------------------------- PRIVATE --------------------------

    private static function getVersionKey($userId)
    {
        return "sync_version_$userId";
    }

    private function getCacheKey(array $entities, array $params)
    {
        $userId = getUserId();
        $version = Cache::get(self::getVersionKey($userId), 0);
        $signature = md5(json_encode([$entities, $params, getAuthTokenHash()]));

        return "sync_{$userId}_{$version}_$signature";
    }

    private function fetchAll(array $entities, array $params)
    {
        $requests = $this->getRequests($entities, $params);
        $responses = $this->pool($requests, 1);

        $data = [];
        foreach ($responses as $key => $response) {
            $data[$key] = $this->readList($response);
        }

        $data = $this->fetchRemainingPages($data, $requests, $responses);

        foreach ($data as $key => $list) {
            $data[$key] = self::mergeExtras($list, self::FIREFLY_ENTITIES[$key][1]);
        }

        if (in_array('transaction-templates', $entities, true)) {
            $data['transaction-templates'] = TransactionTemplate::query()->orderBy('name', 'asc')->get()->toArray();
        }
        if (in_array('exchange-rates', $entities, true)) {
            $data['exchange-rates'] = $this->exchangeRateService->getRates();
        }

        return $data;
    }

    private function fetchRemainingPages(array $data, array $requests, array $responses)
    {
        $extraRequests = [];
        foreach ($responses as $key => $response) {
            $totalPages = (int) fget($this->decode($response), 'meta.pagination.total_pages', 1);
            for ($page = 2; $page <= $totalPages; $page++) {
                $extraRequests["$key|$page"] = $requests[$key];
            }
        }

        if (count($extraRequests) === 0) {
            return $data;
        }

        foreach ($this->pool($extraRequests, null) as $key => $response) {
            $entity = explode('|', $key)[0];
            $data[$entity] = array_merge($data[$entity], $this->readList($response));
        }

        return $data;
    }

    private function getRequests(array $entities, array $params)
    {
        $requests = [];
        foreach (self::FIREFLY_ENTITIES as $entity => [$path]) {
            if (in_array($entity, $entities, true)) {
                $requests[$entity] = [
                    'url' => config('app.firefly_url') . $path,
                    'query' => $this->getQueryFor($entity, $params),
                ];
            }
        }

        return $requests;
    }

    private function getQueryFor($entity, array $params)
    {
        $query = ['limit' => self::PAGE_SIZE];

        if ($entity === 'accounts' && fget($params, 'date')) {
            $query['date'] = fget($params, 'date');
        }

        if ($entity === 'budget-limits') {
            $query['start'] = fget($params, 'start');
            $query['end'] = fget($params, 'end');
        }

        return $query;
    }

    // $page null means the page is encoded in the request key as "entity|page"
    private function pool(array $requests, $page)
    {
        $headers = [
            'authorization' => request()->headers->get('authorization'),
            'accept' => 'application/json',
        ];

        return Http::pool(function (Pool $pool) use ($requests, $headers, $page) {
            $list = [];
            foreach ($requests as $key => $request) {
                $query = $request['query'];
                $query['page'] = $page ?? (int) explode('|', $key)[1];

                $list[] = $pool->as($key)
                    ->withHeaders($headers)
                    ->connectTimeout(10)
                    ->timeout(60)
                    ->get($request['url'], $query);
            }

            return $list;
        });
    }

    // Failing instead of returning an empty list keeps both the cache and the client's stores intact
    private function decode($response)
    {
        if (!is_object($response) || !method_exists($response, 'status') || $response->status() !== BaseController::HTTP_CODE_OK) {
            throw new GeneralException("Firefly III request failed", BaseController::HTTP_CODE_BAD_GATEWAY);
        }

        return $response->json() ?? [];
    }

    private function readList($response)
    {
        return fget($this->decode($response), 'data', []);
    }
}
