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

    /** @var callable returns the faked tag transactions response body for a given page */
    private $tagTransactionsPage;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tagTransactionsPage = fn($page) => [
            'data' => $page === 1 ? $this->transactionGroups() : [],
            // Firefly's pagination totals can be unreliable on purpose here: the service must count the fetched data instead
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

            if (str_contains($request->url(), 'tags/7/transactions')) {
                parse_str(parse_url($request->url(), PHP_URL_QUERY), $query);
                return Http::response(($this->tagTransactionsPage)((int)($query['page'] ?? 1)));
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

    private function makeGroups($count)
    {
        return array_map(fn($i) => [
            'id' => (string)$i,
            'attributes' => ['transactions' => [
                ['type' => 'withdrawal', 'amount' => '1.00', 'currency_id' => '5', 'tags' => ['vacation']],
            ]],
        ], range(1, $count));
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
        // The count comes from the fetched data, not from the (unreliable) pagination meta
        $this->assertEquals(2, $response->json('data.transactions_count'));

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
        $this->tagTransactionsPage = fn($page) => [
            'data' => $this->makeGroups(50),
            'meta' => ['pagination' => ['total' => 4876, 'total_pages' => 98, 'per_page' => 50]],
        ];

        $response = $this->postJson('api/tags/7/total', [], $this->headers());

        $response->assertStatus(422);
        $this->assertStringContainsString('too big', $response->json('message'));
        $this->assertDatabaseCount('tags', 0);
    }

    public function test_compute_total_without_valid_token_fails()
    {
        $response = $this->postJson('api/tags/7/total', [], $this->headers('bad-token'));

        $response->assertStatus(401);
    }
}
