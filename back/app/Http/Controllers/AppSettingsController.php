<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseController;
use App\Models\AppSettings;
use Illuminate\Http\Request;

class AppSettingsController extends BaseController
{
    public function get(Request $request)
    {
        $auth_token_hash = hash('sha256', $request->auth_token);
        $settings = AppSettings::find($auth_token_hash);

        $result = ['data' => $settings];
        return $this->respondSuccessWithData($result);
    }

    public function createOrUpdate(Request $request) 
    {
        $auth_token_hash = hash('sha256', $request->auth_token);
        $settings = AppSettings::findOrNew($auth_token_hash)
            ->fill(['auth_token_hash' => $auth_token_hash])
            ->fill($request->all())
            ->save();

        // Refresh it
        $settings = AppSettings::find($auth_token_hash);
        
        $result = ['data' => $settings];
        return $this->respondSuccessWithData($result);
    }
}
