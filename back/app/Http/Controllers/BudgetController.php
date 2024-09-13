<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Budget;
use App\Models\Category;


class BudgetController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/budgets", Budget::class);
    }

    // ---------------------------


}
