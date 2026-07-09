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
        Http::fake(['*/api/v1/about/user' => Http::response(['data' => ['id' => '1']])]);
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
            'auth_token_hash' => hash('sha256', $this->token),
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

    public function test_count_and_list_are_scoped_to_token()
    {
        AssistantRamble::create(['text' => 'mine', 'auth_token_hash' => hash('sha256', $this->token)]);
        AssistantRamble::create(['text' => 'other', 'auth_token_hash' => hash('sha256', 'other-token')]);

        $this->getJson('api/assistant/rambles/count', $this->headers())->assertOk()->assertJson(['count' => 1]);
        $this->getJson('api/assistant/rambles', $this->headers())->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.text', 'mine');
    }

    public function test_delete_rambles_by_ids()
    {
        $ramble = AssistantRamble::create(['text' => 'mine', 'auth_token_hash' => hash('sha256', $this->token)]);

        $this->deleteJson('api/assistant/rambles', ['ids' => [$ramble->id]], $this->headers())->assertOk()->assertJson(['deleted' => 1]);
        $this->assertDatabaseCount('assistant_rambles', 0);
    }
}
