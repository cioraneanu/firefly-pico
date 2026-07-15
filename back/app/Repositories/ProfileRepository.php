<?php

namespace App\Repositories;


use App\Models\Profile;

class ProfileRepository extends BaseRepository
{
    public function model()
    {
        return Profile::class;
    }

    public function getProfile($request)
    {
        return Profile::where('auth_token_hash', getAuthTokenHash())->find($request->id);
    }

    public function getProfiles()
    {
        // If we are logged it but don't have a profile yet create a default one
        $profilesCount = Profile::where('auth_token_hash', getAuthTokenHash())->count();
        if ($profilesCount === 0) {
            Profile::create([
                'auth_token_hash' => getAuthTokenHash(),
                'name' => "Default profile",
            ]);
        }

        return Profile::where('auth_token_hash', getAuthTokenHash())->orderBy('created_at', 'desc')->get();
    }

    public function createProfile($request)
    {
        return Profile::create([
            'auth_token_hash' => getAuthTokenHash(),
            'name' => $request->name,
            'settings' => $request->settings,
        ]);
    }

    public function updateProfile($request)
    {
        Profile::where('id', $request->id)->update([
            'auth_token_hash' => getAuthTokenHash(),
            'name' => $request->name,
            'settings' => $request->settings,
        ]);
        return Profile::find($request->id);
    }

    public function deleteProfile($request)
    {
        $profile = Profile::where('auth_token_hash', getAuthTokenHash())->where('id', $request->id)->first();
        $profile ? $profile->delete() : null;
        return $profile;
    }
}
