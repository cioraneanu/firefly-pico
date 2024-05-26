<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class CreateFakeTransactions extends Command
{

    protected $signature = 'fake:transactions {--count=} {--token=}';


    protected $description = 'Command used for generating fake transactions. Goal is to seed 10k transaction and test the Firefly /api/transaction endpoint performance.';


    public function handle()
    {
        $transactionsCount = $this->option('count');
        $token = $this->option('token');
        $url = config('app.firefly_url') . "/api/v1/transactions";
        for ($i = 1; $i <= $transactionsCount; $i++) {
            $body = [
                "apply_rules" => false,
                "fire_webhooks" => false,
                "transactions" => [
                    [
                        "amount" => "10",
                        "description" => "electricity",
                        "notes" => "",
                        "source_id" => "1",
                        "source_name" => "Mihai's account",
                        "category_id" => "1",
                        "date" => "2024-05-26 23:50",
                        "type" => "withdrawal",
                        "tags" => ["electricity", "bills"]
                    ]
                ]
            ];

            $headers = [
                "authorization" => "Bearer $token",
                "content-type" => "application/json",
                "accept" => 'application/json, text/plain, */*'
            ];
            $response = Http::withHeaders($headers)->post($url, $body);
        }


    }
}
