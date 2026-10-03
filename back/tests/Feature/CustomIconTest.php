<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CustomIconTest extends TestCase
{
    private $path;

    protected function setUp(): void
    {
        parent::setUp();

        $this->path = storage_path('framework/testing/custom-icons');
        File::ensureDirectoryExists($this->path);
        File::put("$this->path/coffee.svg", '<svg xmlns="http://www.w3.org/2000/svg"/>');
        File::put("$this->path/Bank.PNG", 'png');
        File::put("$this->path/notes.txt", 'not an icon');
        File::put("$this->path/.hidden.svg", '<svg/>');
        config(['app.custom_icons_path' => $this->path]);

        Http::fake(function ($request) {
            $authorization = $request->header('Authorization')[0] ?? $request->header('authorization')[0] ?? '';
            if ($authorization === 'Bearer test-token' && str_contains($request->url(), 'about/user')) {
                return Http::response(['data' => ['id' => '1']]);
            }
            return Http::response(null, 401);
        });
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->path);
        parent::tearDown();
    }

    public function test_lists_only_icon_files(): void
    {
        $this->withToken('test-token')
            ->getJson('/api/custom-icons')
            ->assertOk()
            ->assertExactJson(['data' => ['Bank.PNG', 'coffee.svg']]);
    }

    public function test_listing_requires_a_valid_token(): void
    {
        $this->withToken('wrong-token')->getJson('/api/custom-icons')->assertUnauthorized();
    }

    public function test_listing_is_empty_when_the_folder_is_missing(): void
    {
        config(['app.custom_icons_path' => "$this->path/missing"]);

        $this->withToken('test-token')->getJson('/api/custom-icons')->assertOk()->assertExactJson(['data' => []]);
    }

    public function test_serves_an_icon_without_a_token(): void
    {
        $this->get('/api/custom-icons/coffee.svg')
            ->assertOk()
            ->assertHeader('Content-Type', 'image/svg+xml')
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }

    public function test_rejects_other_files(): void
    {
        $this->get('/api/custom-icons/notes.txt')->assertNotFound();
        $this->get('/api/custom-icons/missing.svg')->assertNotFound();
        $this->get('/api/custom-icons/..')->assertNotFound();
    }
}
