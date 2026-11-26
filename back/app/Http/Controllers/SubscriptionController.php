<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Subscription;


class SubscriptionController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/bills", Subscription::class);
    }

}
