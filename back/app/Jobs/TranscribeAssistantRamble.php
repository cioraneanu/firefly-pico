<?php

namespace App\Jobs;

use App\Models\AssistantRamble;
use App\Services\AssistantTranscriptionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class TranscribeAssistantRamble implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // Keep in sync with the Horizon worker timeout in config/horizon.php.
    public $timeout = 150;

    public $deleteWhenMissingModels = true;

    public function __construct(public AssistantRamble $ramble)
    {
    }

    public function handle(AssistantTranscriptionService $transcriptionService): void
    {
        $transcriptionService->transcribePending(fcollect([$this->ramble]));
    }
}
