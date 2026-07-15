<?php

namespace App\Http\Controllers;

use App\Authorizations\AssistantAuthorization;
use App\Http\Controllers\Base\BaseController;
use App\Services\AssistantLlmService;
use App\Services\AssistantRambleService;
use App\Services\AssistantTranscriptionService;
use App\Validations\AssistantValidation;
use Illuminate\Http\Request;

class AssistantController extends BaseController
{
    //  ================================================================================
    //  ==============================   FIELDS   ======================================
    //  ================================================================================

    protected AssistantRambleService $assistantRambleService;
    protected AssistantLlmService $assistantLlmService;
    protected AssistantTranscriptionService $assistantTranscriptionService;

    //  ================================================================================
    //  ============================   CONSTRUCTOR   ===================================
    //  ================================================================================

    public function __construct(
        AssistantRambleService $assistantRambleService,
        AssistantLlmService $assistantLlmService,
        AssistantTranscriptionService $assistantTranscriptionService
    )
    {
        $this->assistantRambleService = $assistantRambleService;
        $this->assistantLlmService = $assistantLlmService;
        $this->assistantTranscriptionService = $assistantTranscriptionService;
    }

    //  ================================================================================
    //  ==============================   METHODS   =====================================
    //  ================================================================================

    public function getAll(Request $request)
    {
        AssistantAuthorization::authorizeRead();
        $list = $this->assistantRambleService->getRambles();
        return $this->respond(['data' => $list]);
    }

    public function getCount(Request $request)
    {
        AssistantAuthorization::authorizeRead();
        $count = $this->assistantRambleService->countRambles();
        return $this->respond(['count' => $count]);
    }

    public function create(Request $request)
    {
        AssistantAuthorization::authorizeCreate();
        AssistantValidation::validateCreate($request);
        $ramble = $this->assistantRambleService->createRamble($request);
        return $this->respond(['data' => $ramble]);
    }

    public function getRambleVoice(Request $request)
    {
        AssistantAuthorization::authorizeRead();
        return $this->assistantRambleService->getVoiceResponse($request->id);
    }

    public function deleteRamble(Request $request)
    {
        AssistantAuthorization::authorizeDelete();
        $deleted = $this->assistantRambleService->deleteRamble($request->id);
        return $this->respond(['deleted' => $deleted]);
    }

    public function deleteRambles(Request $request)
    {
        AssistantAuthorization::authorizeDelete();
        AssistantValidation::validateDeleteRambles($request);
        $deleted = $this->assistantRambleService->deleteRambles($request->input('ids'));
        return $this->respond(['deleted' => $deleted]);
    }

    public function interpretTransactions(Request $request)
    {
        AssistantAuthorization::authorizeUse();
        AssistantValidation::validateInterpretTransactions($request);
        $result = $this->assistantLlmService->interpretTransactions($request->input('payload'), $request->input('context'));
        return $this->respond($result);
    }

    public function testLlm(Request $request)
    {
        AssistantAuthorization::authorizeUse();
        $result = $this->assistantLlmService->testConfiguration();
        return $this->respond($result);
    }

    public function testTranscription(Request $request)
    {
        AssistantAuthorization::authorizeUse();
        $this->assistantTranscriptionService->testConfiguration();
        return $this->respond(['success' => true]);
    }
}
