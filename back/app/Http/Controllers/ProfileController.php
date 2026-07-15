<?php

namespace App\Http\Controllers;

use App\Authorizations\ProfileAuthorization;
use App\Http\Controllers\Base\BaseController;
use App\Models\Profile;
use App\Repositories\ProfileRepository;
use App\Validations\ProfileValidation;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

class ProfileController extends BaseController
{
    //  ================================================================================
    //  ==============================   FIELDS   ======================================
    //  ================================================================================

    protected ProfileRepository $profileRepository;

    //  ================================================================================
    //  ============================   CONSTRUCTOR   ===================================
    //  ================================================================================

    public function __construct(ProfileRepository $profileRepository)
    {
        $this->profileRepository = $profileRepository;
    }

    //  ================================================================================
    //  ==============================   METHODS   =====================================
    //  ================================================================================

    public function getQuery()
    {
        return QueryBuilder::for(Profile::class);
    }

    public function getOne(Request $request)
    {
        ProfileAuthorization::authorizeRead();
        $profile = $this->profileRepository->getProfile($request);
        return $this->respondSuccessWithData(['data' => $profile]);
    }

    public function getAll(Request $request)
    {
        ProfileAuthorization::authorizeRead();
        $profiles = $this->profileRepository->getProfiles();
        return $this->respondSuccessWithData(['data' => $profiles]);
    }

    public function create(Request $request)
    {
        ProfileAuthorization::authorizeCreate();
        ProfileValidation::validateCreate($request);
        $profile = $this->profileRepository->createProfile($request);
        return $this->respondSuccessWithData(['data' => $profile]);
    }

    public function update(Request $request)
    {
        ProfileAuthorization::authorizeUpdate();
        ProfileValidation::validateUpdate($request);
        $profile = $this->profileRepository->updateProfile($request);
        return $this->respondSuccessWithData(['data' => $profile]);
    }

    public function delete(Request $request)
    {
        ProfileAuthorization::authorizeDelete();
        ProfileValidation::validateDelete($request);
        $profile = $this->profileRepository->deleteProfile($request);
        return $this->respondSuccessWithData(['data' => $profile]);
    }
}
