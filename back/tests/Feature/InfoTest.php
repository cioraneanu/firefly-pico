<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InfoTest extends TestCase
{
    use RefreshDatabase;

    private $githubCalls = 0;

    /** @var int status code the faked GitHub returns */
    private $githubStatus = 200;

    /** @var bool whether the faked GitHub is reachable at all */
    private $githubReachable = true;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.disable_external_calls' => false]);

        Http::fake(function ($request) {
            if (str_contains($request->url(), 'api.github.com')) {
                ++$this->githubCalls;

                if (!$this->githubReachable) {
                    throw new ConnectionException('cURL error 28: Connection timed out');
                }

                if ($this->githubStatus !== 200) {
                    return Http::response(null, $this->githubStatus);
                }

                return Http::response([
                    ['name' => '1.9.0'],
                    ['name' => '1.10.0'],
                    ['name' => '1.11.0-dev'],
                ]);
            }

            return Http::response(null, 404);
        });
    }

    private function info()
    {
        return $this->getJson('/api/info');
    }

    // ---------------------------

    public function test_info_returns_the_latest_stable_version()
    {
        $response = $this->info();

        $response->assertOk();
        $response->assertJsonPath('latest_version', '1.10.0');
    }

    public function test_info_asks_github_once_and_then_serves_the_cached_answer()
    {
        $this->info()->assertOk();
        $this->info()->assertOk();
        $this->info()->assertOk();

        $this->assertSame(1, $this->githubCalls);
    }

    public function test_a_failed_lookup_is_not_retried_on_the_next_request()
    {
        $this->githubStatus = 403;

        $this->info()->assertJsonPath('latest_version', null);
        $this->info()->assertJsonPath('latest_version', null);

        // Caching null naively would hammer GitHub while it keeps rate limiting us
        $this->assertSame(1, $this->githubCalls);
    }

    public function test_an_unreachable_github_does_not_fail_the_endpoint()
    {
        // What an airgapped install actually sees once the request times out
        $this->githubReachable = false;

        $response = $this->info();

        $response->assertOk();
        $response->assertJsonPath('latest_version', null);
        $this->assertNotNull($response->json('assistant_llm'));
    }

    public function test_an_unreachable_github_is_not_retried_on_the_next_request()
    {
        $this->githubReachable = false;

        $this->info()->assertOk();
        $this->info()->assertOk();

        $this->assertSame(1, $this->githubCalls);
    }

    public function test_info_still_answers_with_the_assistant_config_when_the_version_lookup_fails()
    {
        $this->githubStatus = 500;

        $response = $this->info();

        $response->assertOk();
        $response->assertJsonPath('latest_version', null);
        $this->assertNotNull($response->json('assistant_llm'));
        $this->assertNotNull($response->json('assistant_transcription'));
    }

    // ---------------------------

    public function test_disabling_external_calls_skips_github_entirely()
    {
        config(['app.disable_external_calls' => true]);

        $response = $this->info();

        $response->assertOk();
        $response->assertJsonPath('latest_version', null);
        $this->assertSame(0, $this->githubCalls);
    }

    public function test_disabling_external_calls_still_returns_the_assistant_config()
    {
        config(['app.disable_external_calls' => true]);

        $response = $this->info();

        $this->assertNotNull($response->json('assistant_llm'));
        $this->assertNotNull($response->json('assistant_transcription'));
    }
}
