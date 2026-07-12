<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TransactionSearchTotalTest extends TestCase
{
    use RefreshDatabase;

    private $token = 'test-token';

    private $transactionsCount = 3;

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake(function ($request) {
            $authorization = $request->header('Authorization')[0] ?? $request->header('authorization')[0] ?? '';
            if ($authorization !== 'Bearer test-token') {
                return Http::response(null, 401);
            }

            if (str_contains($request->url(), 'about/user')) {
                return Http::response(['data' => ['id' => '1']]);
            }

            if (str_contains($request->url(), 'search/transactions')) {
                return Http::response([
                    'data' => $this->transactionGroups(),
                    'meta' => ['pagination' => ['total' => $this->transactionsCount, 'total_pages' => 1]],
                ]);
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
                    ['type' => 'withdrawal', 'amount' => '100.50', 'currency_id' => '5'],
                    ['type' => 'withdrawal', 'amount' => '10.00', 'currency_id' => '5'],
                ]],
            ],
            [
                'id' => '101',
                'attributes' => ['transactions' => [
                    ['type' => 'deposit', 'amount' => '20.50', 'currency_id' => '5'],
                    ['type' => 'transfer', 'amount' => '999', 'currency_id' => '5'],
                    ['type' => 'withdrawal', 'amount' => '7.00', 'currency_id' => '9'],
                ]],
            ],
        ];
    }

    private function headers($token = null)
    {
        return ['Authorization' => 'Bearer ' . ($token ?? $this->token)];
    }

    public function test_compute_search_total_returns_amount_and_dominant_currency()
    {
        $response = $this->getJson('api/search/transactions/total?query=' . urlencode('category_is:"Groceries"'), $this->headers());

        $response->assertOk();
        $this->assertEquals(90.0, $response->json('data.total_amount'));
        $this->assertEquals('5', $response->json('data.total_currency_id'));
        $this->assertEquals($this->transactionsCount, $response->json('data.transactions_count'));
    }

    public function test_compute_search_total_with_too_many_transactions_fails()
    {
        $this->transactionsCount = 501;

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
