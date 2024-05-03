<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Category;


class CategoryController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/categories", Category::class);
    }

    // ---------------------------


}
