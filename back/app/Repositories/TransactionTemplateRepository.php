<?php

namespace App\Repositories;


use App\Models\TransactionTemplate;
use App\Models\TransactionTemplateExtraName;
use App\Models\TransactionTemplateTag;

class TransactionTemplateRepository extends BaseRepository
{
    public function model()
    {
        return TransactionTemplate::class;
    }

    public function createTransactionTemplate($request)
    {
        $template = TransactionTemplate::create($request->all());

        $this->saveTags($template);
        $this->saveAliases($template);

        // Refresh it
        $template = TransactionTemplate::find($template->id);
        return $template;
    }

    public function updateTransactionTemplate($request)
    {
        $template = TransactionTemplate::findOrFail($request->id);
        $template->fill($request->all())->save();

        $this->saveTags($template);
        $this->saveAliases($template);

        // Refresh it
        $template = TransactionTemplate::find($template->id);
        return $template;
    }

    public function deleteTransactionTemplate($request)
    {
        $program = TransactionTemplate::findOrFail($request->id);
        $program->delete();
        return $program;
    }

    // ---


    private function saveTags($template)
    {
        $tags = collect(request()->tags ?? [])->map(fn($tagId) => new TransactionTemplateTag([
                'transaction_template_id' => $template->id,
                'tag_id' => $tagId
            ]
        ));
        $template->tags()->delete();
        $template->tags()->saveMany($tags);
    }

    private function saveAliases($template)
    {
        $extraNames = collect(request()->extra_names ?? [])->map(fn($extraName) => new TransactionTemplateExtraName([
                'transaction_template_id' => $template->id,
                'name' => $extraName
            ]
        ));
        $template->extraNames()->delete();
        $template->extraNames()->saveMany($extraNames);
    }
}
