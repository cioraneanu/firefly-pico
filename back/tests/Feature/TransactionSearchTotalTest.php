<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TransactionSearchTotalTest extends TestCase
{
    use RefreshDatabase;

    private $token = 'test-token';

    /** @var callable returns the faked search response body for a given page */
    private $searchPage;

    protected function setUp(): void
    {
        parent::setUp();

        $this->searchPage = fn($page) => [
            'data' => $page === 1 ? $this->transactionGroups() : [],
            // Firefly's search pagination totals are unreliable on purpose here: the service must not trust them
            'meta' => ['pagination' => ['total' => 4876, 'total_pages' => 98, 'per_page' => 50]],
        ];

        Http::fake(function ($request) {
            $authorization = $request->header('Authorization')[0] ?? $request->header('authorization')[0] ?? '';
            if ($authorization !== 'Bearer test-token') {
                return Http::response(null, 401);
            }

            if (str_contains($request->url(), 'about/user')) {
                return Http::response(['data' => ['id' => '1']]);
            }

            if (str_contains($request->url(), 'search/transactions')) {
                parse_str(parse_url($request->url(), PHP_URL_QUERY), $query);
                return Http::response(($this->searchPage)((int)($query['page'] ?? 1)));
            }

            return Http::response(null, 404);
        });
    }

    private function transactionGroups()
    {
        return [
            [
                'id' => '100',
                'attributes' => ['transactions' => [
                    ['type' => 'withdrawal', 'amount' => '100.50', 'currency_id' => '5', 'currency_code' => 'EUR'],
                    ['type' => 'withdrawal', 'amount' => '10.00', 'currency_id' => '5', 'currency_code' => 'EUR'],
                ]],
            ],
            [
                'id' => '101',
                'attributes' => ['transactions' => [
                    ['type' => 'deposit', 'amount' => '20.50', 'currency_id' => '5', 'currency_code' => 'EUR'],
                    ['type' => 'transfer', 'amount' => '999', 'currency_id' => '5', 'currency_code' => 'EUR'],
                    ['type' => 'withdrawal', 'amount' => '7.00', 'currency_id' => '9', 'currency_code' => 'USD'],
                ]],
            ],
        ];
    }

    private function makeGroups($count, $amount = '1.00')
    {
        return array_map(fn($i) => [
            'id' => (string)$i,
            'attributes' => ['transactions' => [
                ['type' => 'withdrawal', 'amount' => $amount, 'currency_id' => '5', 'currency_code' => 'EUR'],
            ]],
        ], range(1, $count));
    }

    private function headers($token = null)
    {
        return ['Authorization' => 'Bearer ' . ($token ?? $this->token)];
    }

    public function test_compute_search_total_returns_totals_per_currency()
    {
        $response = $this->getJson('api/search/transactions/total?query=' . urlencode('tag_is:"vacation"'), $this->headers());

        $response->assertOk();
        $totals = collect($response->json('data.totals'))->keyBy('currency_id');
        $this->assertEquals(90.0, $totals['5']['amount']);
        $this->assertEquals('EUR', $totals['5']['currency_code']);
        $this->assertEquals(3, $totals['5']['count']);
        $this->assertEquals(7.0, $totals['9']['amount']);
        $this->assertEquals('USD', $totals['9']['currency_code']);
        // The count comes from the fetched data, not from the (unreliable) pagination meta
        $this->assertEquals(2, $response->json('data.transactions_count'));
    }

    public function test_compute_search_total_stops_on_short_page_despite_wrong_pagination_meta()
    {
        $this->searchPage = fn($page) => [
            'data' => match ($page) {
                1 => $this->makeGroups(50),
                2 => $this->makeGroups(10),
                default => $this->fail("Page $page should not be requested after a short page"),
            },
            'meta' => ['pagination' => ['total' => 4876, 'total_pages' => 98, 'per_page' => 50]],
        ];

        $response = $this->getJson('api/search/transactions/total?query=test', $this->headers());

        $response->assertOk();
        $this->assertEquals(60.0, $response->json('data.totals.0.amount'));
        $this->assertEquals(60, $response->json('data.transactions_count'));
    }

    public function test_compute_search_total_with_too_many_transactions_fails()
    {
        $this->searchPage = fn($page) => [
            'data' => $this->makeGroups(50),
            'meta' => ['pagination' => ['total' => 4876, 'total_pages' => 98, 'per_page' => 50]],
        ];

        $response = $this->getJson('api/search/transactions/total?query=test', $this->headers());

        $response->assertStatus(422);
        $this->assertStringContainsString('too big', $response->json('message'));
    }

    public function test_compute_search_total_without_valid_token_fails()
    {
        $response = $this->getJson('api/search/transactions/total?query=test', $this->headers('bad-token'));

        $response->assertStatus(401);
    }
}
