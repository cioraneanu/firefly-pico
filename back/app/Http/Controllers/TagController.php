<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Tag;


class TagController extends BaseControllerFirefly
{

    public function __construct()
    {
        parent::__construct("/api/v1/tags", Tag::class);
    }

    // ---------------------------


    protected function onPostSave($item)
    {
        $id = fget($item, 'data.id');
        $find = ['id' => $id];

        // We should only have 1 tag marked as to-do. Clear any old ones...
        if (request()->is_todo) {
            Tag::where('is_todo', true)->update(['is_todo' => false]);
        }

        $fill = [
            'icon' => request()->icon,
            'parent_id' => request()->parent_id,
            'is_todo' => request()->is_todo,
        ];
        Tag::updateOrCreate($find, $fill);


        foreach ($fill as $key => $value) {
            fset($item, "data.attributes.$key", $value);
        }
        return $item;
    }

}
