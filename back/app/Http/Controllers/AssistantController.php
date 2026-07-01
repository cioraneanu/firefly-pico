<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Http\Controllers\Base\BaseController;
use App\Models\AssistantRamble;
use App\Models\Profile;
use App\Services\RambleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AssistantController extends BaseController
{


    public function getAll(Request $request)
    {
        $list = AssistantRamble::query()->allowed()->orderBy('created_at')->get();
        return $this->respond(['data' => $list,]);
    }

    public function getCount(Request $request)
    {
        $list = AssistantRamble::query()->allowed()->count();
        return $this->respond(['count' => $list,]);
    }


    public function create(Request $request)
    {
        BaseAuthorization::checkUser();
        $text = $request->get('text');

        if (!$text) {
            return $this->setStatusCode(self::HTTP_CODE_UNPROCESSABLE_ENTITY)->respond([
                'message' => 'Ramble text is required.',
            ]);
        }

        $ramble = AssistantRamble::create([
            'text' => $text,
            'auth_token_hash' => getAuthTokenHash()
        ]);

        return $this->respond([
            'data' => $ramble,
        ]);
    }

    public function deleteRamble(Request $request)
    {
        $ramble = AssistantRamble::query()->findOrFail($request->id);
        $ramble->delete();

        return $this->respond([
            'deleted' => 1,
        ]);
    }

    public function deleteRambles(Request $request)
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deleted = AssistantRamble::query()
            ->whereIn('id', $request->input('ids'))
            ->delete();

        return $this->respond([
            'deleted' => $deleted,
        ]);
    }

    public function interpretTransactions(Request $request)
    {

    }


}
