<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Recurrence;


class RecurrenceController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/recurrences", Recurrence::class);
    }

}
