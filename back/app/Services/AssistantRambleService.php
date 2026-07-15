<?php

namespace App\Services;

use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use App\Jobs\TranscribeAssistantRamble;
use App\Models\AssistantRamble;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssistantRambleService
{
    public function __construct(private AssistantTranscriptionService $transcriptionService)
    {
    }

    public function getRambles()
    {
        $list = AssistantRamble::query()->allowed()->orderBy('created_at')->get();
        $this->transcriptionService->transcribePending($list);
        return $list;
    }

    public function countRambles()
    {
        return AssistantRamble::query()->allowed()->count();
    }

    public function createRamble(Request $request)
    {
        $text = trim((string)$request->get('text'));
        if (!$text && str_contains((string)$request->header('Content-Type'), 'text/plain')) {
            $text = trim($request->getContent());
        }

        $voiceFile = $request->file('voice');
        if (!$text && !$voiceFile) {
            throw new GeneralException('Ramble text or voice recording is required.', BaseController::HTTP_CODE_UNPROCESSABLE_ENTITY);
        }

        $ramble = AssistantRamble::create([
            'text' => $text ?: null,
            'voice_path' => $voiceFile ? $voiceFile->store('assistant-rambles', 'local') : null,
            'user_id' => getUserId()
        ]);

        if ($ramble->voice_path) {
            // Without a real queue, transcribe in-process after the response so saving stays fast.
            config('queue.default') === 'sync'
                ? TranscribeAssistantRamble::dispatchAfterResponse($ramble)
                : TranscribeAssistantRamble::dispatch($ramble);
        }

        return $ramble;
    }

    public function getVoiceResponse($id)
    {
        $ramble = AssistantRamble::query()->allowed()->findOrFail($id);

        $disk = Storage::disk('local');
        if (!$ramble->voice_path || !$disk->exists($ramble->voice_path)) {
            throw new GeneralException('This ramble has no voice recording.', BaseController::HTTP_CODE_NOT_FOUND);
        }

        return $disk->response($ramble->voice_path);
    }

    public function deleteRamble($id)
    {
        $ramble = AssistantRamble::query()->allowed()->findOrFail($id);
        $ramble->delete();
        return 1;
    }

    public function deleteRambles($ids)
    {
        // Delete through the models (not a bulk query) so the deleted event
        // fires and each ramble's voice file is removed from disk.
        $rambles = AssistantRamble::query()
            ->allowed()
            ->whereIn('id', $ids)
            ->get();

        $deleted = 0;
        foreach ($rambles as $ramble) {
            $deleted += $ramble->delete() ? 1 : 0;
        }

        return $deleted;
    }
}
