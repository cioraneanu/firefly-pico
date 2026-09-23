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
use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Fetches every "reference" resource the app keeps in its local stores with a single
 * round trip from the browser.
 *
 * Firefly III has no way to ask for "everything that changed since X": there is no
 * updated_at filter, no sort on updated_at (sorting only exists for accounts) and no
 * ETag support. So a full sync is the only option, and the job here is to make that
 * full sync as cheap as possible:
 *  - all resources are fetched from Firefly in parallel instead of one after the other
 *  - a large page size means one request per resource instead of one per 50 records
 *  - the payload is hashed so an unchanged sync answers with a few bytes
 */
class SyncService
{
    // Firefly III clamps "limit" to 65536 on the v1 list endpoints, so a single request
    // realistically covers the whole collection. Pagination below is only a safety net.
    const PAGE_SIZE = 1000;

    // Resources proxied from Firefly III. Each entry is [firefly path, Pico model with extra fields].
    const FIREFLY_ENTITIES = [
        'accounts' => ['/api/v1/accounts', Account::class],
        'budgets' => ['/api/v1/budgets', Budget::class],
        'budget-limits' => ['/api/v1/budget-limits', null],
        'tags' => ['/api/v1/tags', Tag::class],
        'piggy-banks' => ['/api/v1/piggy-banks', PiggyBank::class],
        'recurrences' => ['/api/v1/recurrences', Recurrence::class],
        'currencies' => ['/api/v1/currencies', null],
    ];

    // Resources served from Firefly's autocomplete endpoints instead of the regular list
    // endpoints. Autocomplete returns a flat, unpaginated [{id, name}] array, which is far
    // smaller than the full resource. Only safe where the app never reads any other Firefly
    // field: categories are rendered from "name" plus the icon stored in Pico's own database.
    const AUTOCOMPLETE_ENTITIES = [
        'categories' => ['/api/v1/autocomplete/categories', Category::class, 'categories'],
    ];

    public function __construct(private readonly ExchangeRateService $exchangeRateService) {}

    // -------------------------------------

    /**
     * Merge the extra fields Pico stores in its own database into a list of Firefly resources.
     */
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

    // -------------------------------------

    /**
     * @param  array  $entities  Which resources to include, so profiles with disabled
     *                           resources do not pay for what they never display.
     * @param  array  $params    Date filters: "date" for accounts, "start"/"end" for budget limits.
     * @param  bool   $force     Skip the cached payload, for when the user explicitly asks to resync.
     */
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

    /**
     * Bumped whenever something changed, which drops every cached sync payload for that owner
     * without having to enumerate cache keys. The owner is the Firefly user id when Firefly III
     * tells us (webhook), or the auth token hash when the change went through Pico itself.
     */
    public static function getVersion($owner)
    {
        return Cache::get(self::getVersionKey($owner), 0);
    }

    public static function bumpVersion($owner)
    {
        $key = self::getVersionKey($owner);
        Cache::put($key, self::getVersion($owner) + 1, 60 * 60 * 24 * 30);
    }

    // ---------------------------- PRIVATE --------------------------

    private static function getVersionKey($owner)
    {
        return "sync_version_" . ($owner ?? 'unknown');
    }

    private function getCacheKey(array $entities, array $params)
    {
        $userId = getUserId();
        $tokenHash = getAuthTokenHash();
        $signature = md5(json_encode([$entities, $params, $tokenHash]));

        return sprintf('sync_%s_%s_%s_%s', $userId, self::getVersion($userId), self::getVersion($tokenHash), $signature);
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

        // Resources that never touch Firefly III. They are a local database read, so there is
        // nothing to parallelise and no point paginating them.
        if (in_array('transaction-templates', $entities, true)) {
            $data['transaction-templates'] = \App\Models\TransactionTemplate::query()->orderBy('name', 'asc')->get()->toArray();
        }
        if (in_array('exchange-rates', $entities, true)) {
            $data['exchange-rates'] = $this->exchangeRateService->getRates();
        }

        foreach ($data as $key => $list) {
            $data[$key] = $this->transform($key, $list);
        }

        return $data;
    }

    /**
     * Firefly's "limit" ceiling means the first page is almost always the only page. When it
     * is not, the leftovers are fetched in one extra parallel batch rather than one at a time.
     */
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
            [$entity, $page] = explode('|', $key);
            $data[$entity] = array_merge($data[$entity], $this->readList($response));
        }

        return $data;
    }

    private function getRequests(array $entities, array $params)
    {
        $requests = [];

        foreach (self::FIREFLY_ENTITIES as $entity => [$path, $model]) {
            if (!in_array($entity, $entities, true)) {
                continue;
            }
            $requests[$entity] = [
                'url' => config('app.firefly_url') . $path,
                'query' => $this->getQueryFor($entity, $params),
            ];
        }

        foreach (self::AUTOCOMPLETE_ENTITIES as $entity => [$path, $model, $type]) {
            if (!in_array($entity, $entities, true)) {
                continue;
            }
            $requests[$entity] = [
                'url' => config('app.firefly_url') . $path,
                // Autocomplete falls back to the user's "listPageSize" preference (50 by default)
                // when no limit is given, so an explicit limit is required or the list is truncated.
                'query' => ['limit' => self::PAGE_SIZE],
            ];
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

    private function decode($response)
    {
        // An empty list would wipe the client's store, and get cached on top of that. Failing
        // keeps both the cache and the client's stores as they were.
        if (!is_object($response) || !method_exists($response, 'status') || $response->status() !== BaseController::HTTP_CODE_OK) {
            throw new GeneralException("Firefly III request failed", BaseController::HTTP_CODE_BAD_GATEWAY);
        }

        return $response->json() ?? [];
    }

    private function readList($response)
    {
        $body = $this->decode($response);

        // Regular endpoints answer with {data: [...]}, autocomplete answers with a bare array.
        return fget($body, 'data', isAssociative($body) ? [] : $body);
    }

    private function transform($entity, $list)
    {
        if (array_key_exists($entity, self::AUTOCOMPLETE_ENTITIES)) {
            [$path, $model, $type] = self::AUTOCOMPLETE_ENTITIES[$entity];
            // Rebuild the JSON:API shape the app expects from the flat autocomplete payload.
            $list = fcollect($list)->map(fn($item) => [
                'id' => (string) fget($item, 'id'),
                'type' => $type,
                'attributes' => ['name' => fget($item, 'name')],
            ])->all();

            return self::mergeExtras($list, $model);
        }

        if (array_key_exists($entity, self::FIREFLY_ENTITIES)) {
            return self::mergeExtras($list, self::FIREFLY_ENTITIES[$entity][1]);
        }

        return $list;
    }
}
