<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseController;
use App\Models\Profile;
use Illuminate\Http\Request;

class ProfileController extends BaseController
{
    public function get(Request $request)
    {
        $auth_token_hash = hash('sha256', $request->bearerToken());
        $settings = Profile::find($auth_token_hash);

        $result = ['data' => $settings];
        return $this->respondSuccessWithData($result);
    }

    public function createOrUpdate(Request $request) 
    {
        $auth_token_hash = hash('sha256', $request->bearerToken());
        $settings = Profile::findOrNew($auth_token_hash)
            ->fill([
                'auth_token_hash' => $auth_token_hash,
                'settings' => $request->settings
            ])
            ->save();

        // Refresh it
        $settings = Profile::find($auth_token_hash);
        
        $result = ['data' => $settings];
        return $this->respondSuccessWithData($result);
    }
}
