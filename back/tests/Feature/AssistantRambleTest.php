<?php

namespace Tests\Feature;

use App\Models\AssistantRamble;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AssistantRambleTest extends TestCase
{
    use RefreshDatabase;

    private $token = 'test-token';

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake(function ($request) {
            return match ($request->header('Authorization')[0] ?? $request->header('authorization')[0] ?? '') {
                'Bearer test-token' => Http::response(['data' => ['id' => '1']]),
                'Bearer other-token' => Http::response(['data' => ['id' => '2']]),
                default => Http::response(null, 401),
            };
        });
    }

    private function headers($token = null)
    {
        return ['Authorization' => 'Bearer ' . ($token ?? $this->token)];
    }

    public function test_create_ramble_with_json_body()
    {
        $response = $this->postJson('api/assistant/rambles', ['text' => 'coffee 5 eur'], $this->headers());

        $response->assertOk();
        $this->assertDatabaseHas('assistant_rambles', [
            'text' => 'coffee 5 eur',
            'user_id' => '1',
        ]);
    }

    public function test_create_ramble_with_plain_text_body()
    {
        $response = $this->call('POST', 'api/assistant/rambles', [], [], [], $this->transformHeadersToServerVars($this->headers() + ['Content-Type' => 'text/plain']), 'coffee 5 eur');

        $response->assertOk();
        $this->assertDatabaseHas('assistant_rambles', ['text' => 'coffee 5 eur']);
    }

    public function test_create_ramble_without_text_fails()
    {
        $response = $this->postJson('api/assistant/rambles', [], $this->headers());

        $response->assertStatus(422);
        $this->assertDatabaseCount('assistant_rambles', 0);
    }

    public function test_create_ramble_without_valid_token_fails()
    {
        $response = $this->postJson('api/assistant/rambles', ['text' => 'coffee 5 eur']);

        $response->assertStatus(401);
        $this->assertDatabaseCount('assistant_rambles', 0);
    }

    public function test_count_and_list_are_scoped_to_user()
    {
        AssistantRamble::create(['text' => 'mine', 'user_id' => '1']);
        AssistantRamble::create(['text' => 'other', 'user_id' => '2']);

        $this->getJson('api/assistant/rambles/count', $this->headers())->assertOk()->assertJson(['count' => 1]);
        $this->getJson('api/assistant/rambles', $this->headers())->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.text', 'mine');
    }

    public function test_delete_rambles_by_ids()
    {
        $ramble = AssistantRamble::create(['text' => 'mine', 'user_id' => '1']);

        $this->deleteJson('api/assistant/rambles', ['ids' => [$ramble->id]], $this->headers())->assertOk()->assertJson(['deleted' => 1]);
        $this->assertDatabaseCount('assistant_rambles', 0);
    }

    public function test_delete_rambles_cannot_delete_other_users_rambles()
    {
        $mine = AssistantRamble::create(['text' => 'mine', 'user_id' => '1']);
        $other = AssistantRamble::create(['text' => 'other', 'user_id' => '2']);

        $this->deleteJson('api/assistant/rambles', ['ids' => [$mine->id, $other->id]], $this->headers())->assertOk()->assertJson(['deleted' => 1]);
        $this->assertDatabaseHas('assistant_rambles', ['id' => $other->id]);
    }

    public function test_delete_single_ramble_of_other_user_fails()
    {
        $other = AssistantRamble::create(['text' => 'other', 'user_id' => '2']);

        $this->deleteJson("api/assistant/rambles/{$other->id}", [], $this->headers())->assertNotFound();
        $this->assertDatabaseHas('assistant_rambles', ['id' => $other->id]);
    }

    public function test_delete_rambles_without_valid_token_fails()
    {
        $ramble = AssistantRamble::create(['text' => 'mine', 'user_id' => '1']);

        $this->deleteJson('api/assistant/rambles', ['ids' => [$ramble->id]])->assertStatus(401);
        $this->deleteJson("api/assistant/rambles/{$ramble->id}")->assertStatus(401);
        $this->assertDatabaseCount('assistant_rambles', 1);
    }

    public function test_interpret_transactions_without_valid_token_fails()
    {
        $response = $this->postJson('api/assistant/interpret-transactions', [
            'payload' => ['messages' => [['role' => 'user', 'content' => 'coffee 5 eur']]],
            'llm' => ['endpoint' => 'https://example.com/v1/chat/completions'],
        ]);

        $response->assertStatus(401);
        Http::assertNotSent(fn($request) => str_contains($request->url(), 'example.com'));
    }
}
