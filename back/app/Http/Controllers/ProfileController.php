<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Exceptions\GeneralException;
use App\Http\Controllers\Base\BaseController;
use App\Models\Profile;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

class ProfileController extends BaseController
{

    public function getQuery()
    {
        return QueryBuilder::for(Profile::class);
    }

    public function getOne(Request $request)
    {
        BaseAuthorization::checkUser();

        $profile = Profile::where('auth_token_hash', getAuthTokenHash())->find($request->id);
        $result = ['data' => $profile];
        return $this->respondSuccessWithData($result);
    }
    public function getAll(Request $request)
    {
        BaseAuthorization::checkUser();

        $profiles = Profile::where('auth_token_hash', getAuthTokenHash())->get();
        $result = ['data' => $profiles];
        return $this->respondSuccessWithData($result);
    }


    public function create(Request $request)
    {
        BaseAuthorization::checkUser();

        $profile = Profile::create([
            'auth_token_hash' => getAuthTokenHash(),
            'name' => $request->name,
            'settings' => $request->settings,
        ]);
        return $this->respondSuccessWithData(['data' => $profile]);
    }

    public function update(Request $request)
    {
        BaseAuthorization::checkUser();

        $profile = Profile::where('id', $request->id)->update([
            'auth_token_hash' => getAuthTokenHash(),
            'name' => $request->name,
            'settings' => $request->settings,
        ]);
        return $this->respondSuccessWithData(['data' => $profile]);
    }

    public function delete(Request $request)
    {
        BaseAuthorization::checkUser();

        $profile = Profile::where('auth_token_hash', getAuthTokenHash())->where('id', $request->id)->first();
        $profile ? $profile->delete() : null;
        return $this->respondSuccessWithData(['data' => $profile]);
    }




}
