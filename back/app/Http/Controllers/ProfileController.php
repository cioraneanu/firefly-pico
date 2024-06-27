<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseController;
use App\Models\Profile;
use Illuminate\Http\Request;

class ProfileController extends BaseController
{
    public function get(Request $request)
    {
        $authTokenHash = $this->getAuthTokenHash();
        $profile = Profile::where('auth_token_hash', $authTokenHash)->first();
        $result = ['data' => $profile];
        return $this->respondSuccessWithData($result);
    }

    public function createOrUpdate(Request $request)
    {
        $authTokenHash = $this->getAuthTokenHash();
        $profile = Profile::updateOrCreate(
            ['auth_token_hash' => $authTokenHash],
            ['settings' => $request->settings]
        );
        $result = ['data' => $profile];
        return $this->respondSuccessWithData($result);
    }

    // -----

    private function getAuthTokenHash()
    {
        $token = request()->bearerToken();
        return hash('sha256', $token);
    }


}
