<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Services\SyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SyncTest extends TestCase
{
    use RefreshDatabase;

    private $token = 'test-token';

    /** @var array url fragment => number of times it was requested */
    private $requestCount = [];

    private $fireflyIsDown = false;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake(function ($request) {
            $url = $request->url();
            parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

            $authorization = $request->header('Authorization')[0] ?? $request->header('authorization')[0] ?? '';
            if ($authorization !== "Bearer {$this->token}") {
                return Http::response(null, 401);
            }

            if (str_contains($url, 'about/user')) {
                return Http::response(['data' => ['id' => '1']]);
            }

            if (str_contains($url, 'rules')) {
                return Http::response(['data' => []]);
            }

            if ($this->fireflyIsDown) {
                return Http::response(['message' => 'down'], 500);
            }

            foreach (['autocomplete/categories', 'accounts', 'tags', 'currencies'] as $fragment) {
                if (str_contains($url, $fragment)) {
                    $this->requestCount[$fragment] = ($this->requestCount[$fragment] ?? 0) + 1;

                    return Http::response($this->body($fragment, (int) ($query['page'] ?? 1)));
                }
            }

            return Http::response(null, 404);
        });
    }

    private function body($fragment, $page)
    {
        if ($fragment === 'autocomplete/categories') {
            // Autocomplete answers with a bare array and never paginates
            return [
                ['id' => '3', 'name' => 'Groceries'],
                ['id' => '4', 'name' => 'Rent'],
            ];
        }

        if ($fragment === 'accounts') {
            // Two pages, to prove the leftovers are picked up
            return [
                'data' => $page === 1
                    ? [['id' => '10', 'type' => 'accounts', 'attributes' => ['name' => 'Checking']]]
                    : [['id' => '11', 'type' => 'accounts', 'attributes' => ['name' => 'Savings']]],
                'meta' => ['pagination' => ['total_pages' => 2]],
            ];
        }

        return ['data' => [], 'meta' => ['pagination' => ['total_pages' => 1]]];
    }

    private function sync($params = [])
    {
        return $this->withHeaders(['Authorization' => "Bearer {$this->token}"])
            ->getJson('/api/sync?' . http_build_query($params));
    }

    // ---------------------------

    public function test_sync_returns_every_requested_entity_in_one_request()
    {
        $response = $this->sync(['entities' => 'accounts,categories,tags']);

        $response->assertOk();
        $response->assertJsonPath('unchanged', false);
        $response->assertJsonPath('data.categories.0.attributes.name', 'Groceries');
        $response->assertJsonPath('data.accounts.0.attributes.name', 'Checking');
        $this->assertNotEmpty($response->json('hash'));
    }

    public function test_sync_only_fetches_the_requested_entities()
    {
        $this->sync(['entities' => 'accounts'])->assertOk();

        $this->assertSame(2, $this->requestCount['accounts'] ?? 0, 'accounts has two pages');
        $this->assertArrayNotHasKey('tags', $this->requestCount);
        $this->assertArrayNotHasKey('autocomplete/categories', $this->requestCount);
    }

    public function test_sync_follows_pagination_for_entities_that_overflow_one_page()
    {
        $response = $this->sync(['entities' => 'accounts']);

        $this->assertSame(['10', '11'], array_column($response->json('data.accounts'), 'id'));
    }

    public function test_sync_merges_extra_fields_stored_by_pico()
    {
        Account::create(['id' => 10, 'icon' => 'wallet', 'group' => 'Daily', 'is_dashboard_visible' => false]);
        Category::create(['id' => 3, 'icon' => 'basket']);

        $response = $this->sync(['entities' => 'accounts,categories']);

        $response->assertJsonPath('data.accounts.0.attributes.icon', 'wallet');
        $response->assertJsonPath('data.accounts.0.attributes.group', 'Daily');
        // Categories come from the lean autocomplete endpoint but still carry Pico's own fields
        $response->assertJsonPath('data.categories.0.attributes.icon', 'basket');
        $response->assertJsonPath('data.categories.0.type', 'categories');
    }

    public function test_sync_answers_without_a_payload_when_the_hash_still_matches()
    {
        $hash = $this->sync(['entities' => 'accounts'])->json('hash');

        $response = $this->sync(['entities' => 'accounts', 'hash' => $hash]);

        $response->assertOk();
        $response->assertJsonPath('unchanged', true);
        $response->assertJsonMissingPath('data');
    }

    public function test_sync_sends_the_payload_when_the_client_hash_is_stale()
    {
        $this->sync(['entities' => 'accounts'])->assertOk();

        $response = $this->sync(['entities' => 'accounts', 'hash' => 'something-else']);

        $response->assertJsonPath('unchanged', false);
        $this->assertNotNull($response->json('data.accounts'));
    }

    public function test_sync_reuses_the_cached_payload_instead_of_refetching_firefly()
    {
        $this->sync(['entities' => 'accounts'])->assertOk();
        $countAfterFirst = $this->requestCount['accounts'];

        $this->sync(['entities' => 'accounts'])->assertOk();

        $this->assertSame($countAfterFirst, $this->requestCount['accounts']);
    }

    public function test_bumping_the_version_drops_the_cached_payload()
    {
        $this->sync(['entities' => 'accounts'])->assertOk();
        $countAfterFirst = $this->requestCount['accounts'];

        SyncService::bumpVersion('1');
        $this->sync(['entities' => 'accounts'])->assertOk();

        $this->assertGreaterThan($countAfterFirst, $this->requestCount['accounts']);
    }

    public function test_forcing_a_sync_skips_the_cached_payload()
    {
        $this->sync(['entities' => 'accounts'])->assertOk();
        $countAfterFirst = $this->requestCount['accounts'];

        $this->sync(['entities' => 'accounts', 'force' => 1])->assertOk();

        $this->assertGreaterThan($countAfterFirst, $this->requestCount['accounts']);
    }

    public function test_a_write_through_pico_drops_the_cached_payload()
    {
        $this->sync(['entities' => 'accounts'])->assertOk();
        $countAfterFirst = $this->requestCount['accounts'];

        $this->withHeaders(['Authorization' => "Bearer {$this->token}"])->postJson('/api/rules', [])->assertOk();
        $this->sync(['entities' => 'accounts'])->assertOk();

        $this->assertGreaterThan($countAfterFirst, $this->requestCount['accounts']);
    }

    public function test_a_failing_firefly_request_fails_the_sync_without_caching_it()
    {
        $this->fireflyIsDown = true;
        $this->sync(['entities' => 'accounts,tags'])->assertStatus(502);

        $this->fireflyIsDown = false;
        $response = $this->sync(['entities' => 'accounts,tags']);

        $response->assertOk();
        $this->assertCount(2, $response->json('data.accounts'));
    }

    public function test_sync_without_a_valid_token_fails()
    {
        Cache::driver('array')->forget('getUser');

        $this->withHeaders(['Authorization' => 'Bearer nope'])
            ->getJson('/api/sync?entities=accounts')
            ->assertStatus(401);
    }
}
