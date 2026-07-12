<?php

namespace Tests\Feature;

use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TagTotalTest extends TestCase
{
    use RefreshDatabase;

    private $token = 'test-token';

    private $transactionsCount = 2;

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

            if (str_contains($request->url(), 'tags/7/transactions')) {
                return Http::response([
                    'data' => $this->transactionGroups(),
                    'meta' => ['pagination' => ['total' => $this->transactionsCount, 'total_pages' => 1]],
                ]);
            }

            if (str_contains($request->url(), 'tags/7')) {
                return Http::response(['data' => ['id' => '7', 'attributes' => ['tag' => 'vacation']]]);
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
                    ['type' => 'withdrawal', 'amount' => '100.50', 'currency_id' => '5', 'tags' => ['vacation']],
                    ['type' => 'withdrawal', 'amount' => '10.00', 'currency_id' => '5', 'tags' => ['other']],
                ]],
            ],
            [
                'id' => '101',
                'attributes' => ['transactions' => [
                    ['type' => 'deposit', 'amount' => '20.50', 'currency_id' => '5', 'tags' => ['vacation']],
                    ['type' => 'transfer', 'amount' => '999', 'currency_id' => '5', 'tags' => ['vacation']],
                ]],
            ],
        ];
    }

    private function headers($token = null)
    {
        return ['Authorization' => 'Bearer ' . ($token ?? $this->token)];
    }

    public function test_compute_total_saves_amount_and_currency()
    {
        $response = $this->postJson('api/tags/7/total', [], $this->headers());

        $response->assertOk();
        $this->assertEquals(80.0, $response->json('data.total_amount'));
        $this->assertEquals('5', $response->json('data.total_currency_id'));

        $tag = Tag::find(7);
        $this->assertEquals(80.0, (float)$tag->total_amount);
        $this->assertEquals(5, (int)$tag->total_currency_id);
    }

    public function test_compute_total_updates_existing_tag()
    {
        Tag::create(['id' => 7, 'icon' => 'IconBeach']);

        $this->postJson('api/tags/7/total', [], $this->headers())->assertOk();

        $tag = Tag::find(7);
        $this->assertEquals('IconBeach', $tag->icon);
        $this->assertEquals(80.0, (float)$tag->total_amount);
    }

    public function test_compute_total_with_too_many_transactions_fails()
    {
        $this->transactionsCount = 501;

        $response = $this->postJson('api/tags/7/total', [], $this->headers());

        $response->assertStatus(422);
        $this->assertStringContainsString('too big', $response->json('message'));
        $this->assertDatabaseCount('tags', 0);
    }

    public function test_compute_total_without_valid_token_fails()
    {
        $response = $this->postJson('api/tags/7/total', [], $this->headers('bad-token'));

        $response->assertStatus(401);
        $this->assertDatabaseCount('tags', 0);
    }
}
