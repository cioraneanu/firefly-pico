<?php

namespace App\Http\Controllers;

use App\Authorizations\BaseAuthorization;
use App\Http\Controllers\Base\BaseControllerFirefly;
use App\Models\Tag;
use App\Services\TagService;
use Illuminate\Http\Request;


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
        $tag = Tag::updateOrCreate($find, $fill);

        $fill['total_amount'] = $tag->total_amount;
        $fill['total_currency_id'] = $tag->total_currency_id;

        foreach ($fill as $key => $value) {
            fset($item, "data.attributes.$key", $value);
        }
        return $item;
    }

    // ---------------------------

    public function computeTotal(Request $request)
    {
        BaseAuthorization::checkUser();
        return $this->respond(['data' => app(TagService::class)->computeTotal($request->id)]);
    }

}
