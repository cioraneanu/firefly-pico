<?php

namespace Tests\Feature;

use App\Models\AssistantUserSetting;
use Illuminate\Encryption\Encrypter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AssistantSettingsTest extends TestCase
{
    use RefreshDatabase;

    private const OWN_LLM = 'https://own.example/v1/chat/completions';
    private const SERVER_LLM = 'https://server.example/v1/chat/completions';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.assistant_llm.endpoint' => self::SERVER_LLM, 'services.assistant_llm.api_key' => 'server-key']);
        // own.example does not resolve: these tests are about keys and scoping, the address checks are tested with the flag off below.
        config(['services.assistant.allow_private_endpoints' => true]);
        Http::fake(function ($request) {
            if (str_contains($request->url(), 'own.example/fail')) {
                return Http::response(['error' => ['message' => 'internal detail']], 404);
            }
            if (str_contains($request->url(), '.example/')) {
                return Http::response(['choices' => [['message' => ['content' => 'OK']]]]);
            }

            return match ($request->header('Authorization')[0] ?? $request->header('authorization')[0] ?? '') {
                'Bearer test-token' => Http::response(['data' => ['id' => '1']]),
                'Bearer other-token' => Http::response(['data' => ['id' => '2']]),
                default => Http::response(null, 401),
            };
        });
    }

    private function headers($token = 'test-token')
    {
        return ['Authorization' => "Bearer {$token}"];
    }

    private function saveSettings(array $data = [], $token = 'test-token')
    {
        return $this->putJson('api/assistant/settings', [
            'llm_use_own' => true,
            'llm_endpoint' => self::OWN_LLM,
            'transcription_use_own' => false,
            ...$data,
        ], $this->headers($token));
    }

    private function sentToken($endpoint)
    {
        $request = Http::recorded(fn($request) => $request->url() === $endpoint)->last()[0] ?? null;
        return $request?->header('Authorization')[0] ?? null;
    }

    public function test_settings_without_valid_token_fail()
    {
        $this->getJson('api/assistant/settings')->assertStatus(401);
        $this->putJson('api/assistant/settings', ['llm_use_own' => false, 'transcription_use_own' => false])->assertStatus(401);
        $this->assertDatabaseCount('assistant_user_settings', 0);
    }

    public function test_settings_have_the_same_shape_before_and_after_saving()
    {
        $before = $this->getJson('api/assistant/settings', $this->headers())->assertOk()->json('data');
        $after = $this->saveSettings(['llm_api_key' => 'user-key'])->assertOk()->json('data');

        $this->assertSame(array_keys($before), array_keys($after));
        $this->assertSame([
            'llm_use_own', 'llm_endpoint', 'llm_model', 'llm_has_api_key',
            'transcription_use_own', 'transcription_endpoint', 'transcription_model', 'transcription_has_api_key', 'transcription_language',
            'server',
        ], array_keys($after));
        $this->assertFalse($before['llm_use_own']);
        $this->assertFalse($before['llm_has_api_key']);
    }

    public function test_api_keys_are_never_returned()
    {
        $response = $this->saveSettings(['llm_api_key' => 'user-key']);

        $response->assertOk()->assertJsonPath('data.llm_has_api_key', true)->assertJsonPath('data.transcription_has_api_key', false);
        $this->assertStringNotContainsString('user-key', $response->getContent());
        $this->assertStringNotContainsString('user-key', $this->getJson('api/assistant/settings', $this->headers())->getContent());
        $this->assertStringNotContainsString('server-key', $response->getContent());
        $this->assertNotSame('user-key', DB::table('assistant_user_settings')->value('llm_api_key'));
    }

    public function test_settings_are_scoped_to_user()
    {
        $this->saveSettings(['llm_api_key' => 'user-key'])->assertOk();
        Cache::driver('array')->flush(); // getUser() caches the user for the whole app

        $this->getJson('api/assistant/settings', $this->headers('other-token'))
            ->assertOk()
            ->assertJsonPath('data.llm_use_own', false)
            ->assertJsonPath('data.llm_endpoint', null)
            ->assertJsonPath('data.llm_has_api_key', false);
    }

    public function test_api_key_is_kept_on_empty_replaced_and_cleared()
    {
        $this->saveSettings(['llm_api_key' => 'first-key']);
        $this->saveSettings(['llm_api_key' => '  ']);
        $this->assertSame('first-key', AssistantUserSetting::first()->llm_api_key);

        $this->saveSettings(['llm_api_key' => 'second-key']);
        $this->assertSame('second-key', AssistantUserSetting::first()->llm_api_key);

        $this->saveSettings(['llm_api_key_clear' => true])->assertJsonPath('data.llm_has_api_key', false);
        $this->assertNull(AssistantUserSetting::first()->llm_api_key);
        $this->assertDatabaseCount('assistant_user_settings', 1);
    }

    public function test_info_reports_the_users_own_llm_as_configured()
    {
        config(['services.assistant_llm.endpoint' => null, 'services.assistant_llm.api_key' => null]);
        $this->saveSettings()->assertOk();

        $this->getJson('api/info', $this->headers())->assertOk()->assertJsonPath('assistant_llm.is_configured', true);
        Cache::driver('array')->flush(); // getUser() caches the user for the whole app
        $this->getJson('api/info', $this->headers('other-token'))->assertOk()->assertJsonPath('assistant_llm.is_configured', false);
    }

    public function test_own_connection_requires_an_http_endpoint()
    {
        $this->saveSettings(['llm_endpoint' => null])->assertStatus(422);
        $this->saveSettings(['llm_use_own' => '1', 'llm_endpoint' => null])->assertStatus(422);
        $this->saveSettings(['llm_endpoint' => 'ftp://own.example/v1'])->assertStatus(422);
        $this->postJson('api/assistant/test-llm', ['config' => ['use_own' => true, 'endpoint' => 'file:///etc/passwd']], $this->headers())->assertStatus(422);
        $this->assertDatabaseCount('assistant_user_settings', 0);
    }

    public function test_own_connection_sends_the_users_key_to_the_users_endpoint()
    {
        $this->saveSettings(['llm_api_key' => 'user-key']);

        $this->postJson('api/assistant/test-llm', [], $this->headers())->assertOk();

        $this->assertSame('Bearer user-key', $this->sentToken(self::OWN_LLM));
        Http::assertNotSent(fn($request) => str_contains($request->url(), 'server.example') || ($request->header('Authorization')[0] ?? '') === 'Bearer server-key');
    }

    public function test_removed_key_is_not_used_when_testing_before_saving()
    {
        $this->saveSettings(['llm_api_key' => 'user-key']);

        $this->postJson('api/assistant/test-llm', ['config' => ['use_own' => true, 'endpoint' => self::OWN_LLM, 'api_key_clear' => true]], $this->headers())->assertOk();

        $this->assertNull($this->sentToken(self::OWN_LLM));
    }

    public function test_server_connection_is_used_when_not_using_own()
    {
        $this->saveSettings(['llm_use_own' => false, 'llm_api_key' => 'user-key']);

        $this->postJson('api/assistant/test-llm', [], $this->headers())->assertOk();

        $this->assertSame('Bearer server-key', $this->sentToken(self::SERVER_LLM));
        Http::assertNotSent(fn($request) => str_contains($request->url(), 'own.example'));
    }

    private function insertUndecryptableKey()
    {
        DB::table('assistant_user_settings')->insert([
            'user_id' => '1',
            'llm_use_own' => true,
            'llm_endpoint' => self::OWN_LLM,
            'llm_api_key' => (new Encrypter(random_bytes(32), 'AES-256-CBC'))->encryptString('old-key'),
        ]);
    }

    public function test_undecryptable_key_reads_as_missing_and_is_not_used()
    {
        $this->insertUndecryptableKey();

        $this->getJson('api/assistant/settings', $this->headers())->assertJsonPath('data.llm_has_api_key', false);
        $this->postJson('api/assistant/test-llm', [], $this->headers())->assertStatus(422)->assertJsonPath('message', 'Assistant LLM is not configured.');
        Http::assertNotSent(fn($request) => str_contains($request->url(), '.example/'));
    }

    public function test_undecryptable_key_can_be_replaced_by_a_typed_key()
    {
        $this->insertUndecryptableKey();

        $this->postJson('api/assistant/test-llm', ['config' => ['use_own' => true, 'endpoint' => self::OWN_LLM, 'api_key' => 'new-key']], $this->headers())->assertOk();
        $this->assertSame('Bearer new-key', $this->sentToken(self::OWN_LLM));
    }

    public function test_own_endpoint_errors_are_not_passed_on()
    {
        $response = $this->postJson('api/assistant/test-llm', ['config' => ['use_own' => true, 'endpoint' => 'https://own.example/fail']], $this->headers());

        $response->assertStatus(502)->assertJsonPath('message', 'Assistant LLM request failed.');
        $this->assertStringNotContainsString('internal detail', $response->getContent());
    }

    public function test_own_transcription_endpoint_errors_are_not_passed_on()
    {
        $response = $this->postJson('api/assistant/test-transcription', ['config' => ['use_own' => true, 'endpoint' => 'https://own.example/fail']], $this->headers());

        $response->assertStatus(502)->assertJsonPath('message', 'Assistant transcription request failed.');
        $this->assertStringNotContainsString('internal detail', $response->getContent());
    }

    public function test_own_endpoint_must_not_point_to_a_private_or_reserved_address()
    {
        config(['services.assistant.allow_private_endpoints' => false]);
        $private = ['http://127.0.0.1:8080/v1', 'http://localhost/v1', 'http://10.0.0.5/v1', 'http://192.168.1.10/v1', 'http://169.254.169.254/latest/meta-data', 'http://[::1]/v1', 'http://[fe80::1]/v1', 'http://[fc00::1]/v1', 'https://unresolvable.invalid/v1'];

        foreach ($private as $endpoint) {
            $this->saveSettings(['llm_endpoint' => $endpoint])->assertStatus(422)->assertJsonValidationErrors('llm_endpoint');
            $this->saveSettings(['transcription_use_own' => true, 'transcription_endpoint' => $endpoint])->assertStatus(422)->assertJsonValidationErrors('transcription_endpoint');
            $this->postJson('api/assistant/test-llm', ['config' => ['use_own' => true, 'endpoint' => $endpoint]], $this->headers())->assertStatus(422)->assertJsonValidationErrors('config.endpoint');
            $this->postJson('api/assistant/test-transcription', ['config' => ['use_own' => true, 'endpoint' => $endpoint]], $this->headers())->assertStatus(422)->assertJsonValidationErrors('config.endpoint');
            $this->postJson('api/assistant/interpret-transactions', ['payload' => ['messages' => [['role' => 'user', 'content' => 'coffee']]], 'config' => ['use_own' => true, 'endpoint' => $endpoint]], $this->headers())->assertStatus(422)->assertJsonValidationErrors('config.endpoint');
        }

        $this->saveSettings(['llm_endpoint' => 'http://127.0.0.1/v1'])->assertJsonPath('errors.llm_endpoint.0', 'The llm endpoint must not point to a private or reserved address.');
        $this->assertDatabaseCount('assistant_user_settings', 0);
        Http::assertNotSent(fn($request) => !str_contains($request->url(), 'api/v1/about/user'));
    }

    public function test_saved_private_endpoint_is_not_called()
    {
        // Saved while ASSISTANT_ALLOW_PRIVATE_ENDPOINTS was on (or before the check existed), then turned off.
        $this->saveSettings(['llm_endpoint' => 'http://169.254.169.254/latest'])->assertOk();
        config(['services.assistant.allow_private_endpoints' => false]);

        $this->postJson('api/assistant/test-llm', [], $this->headers())->assertStatus(422)->assertJsonPath('message', 'Assistant LLM is not configured.');
        Http::assertNotSent(fn($request) => str_contains($request->url(), '169.254.169.254'));
    }

    public function test_own_endpoint_on_a_public_address_is_accepted()
    {
        config(['services.assistant.allow_private_endpoints' => false]);
        $endpoint = 'https://93.184.216.34/v1/chat/completions';

        $this->saveSettings(['llm_endpoint' => $endpoint])->assertOk()->assertJsonPath('data.llm_endpoint', $endpoint);
        $this->postJson('api/assistant/test-llm', [], $this->headers());

        Http::assertSent(fn($request) => $request->url() === $endpoint);
    }

    public function test_private_endpoint_is_allowed_when_the_server_allows_it()
    {
        $endpoint = 'http://192.168.1.10:11434/v1/chat/completions';

        $this->saveSettings(['llm_endpoint' => $endpoint])->assertOk();
        $this->postJson('api/assistant/test-llm', [], $this->headers());

        Http::assertSent(fn($request) => $request->url() === $endpoint);
    }

    public function test_server_endpoint_is_not_restricted()
    {
        config(['services.assistant.allow_private_endpoints' => false, 'services.assistant_llm.endpoint' => 'http://10.0.0.5/v1/chat/completions']);

        $this->postJson('api/assistant/test-llm', [], $this->headers());

        Http::assertSent(fn($request) => $request->url() === 'http://10.0.0.5/v1/chat/completions');
    }
}
