<?php

namespace App\Validations;

use Illuminate\Http\Request;


class AssistantValidation
{
    public static function validateCreate(Request $request)
    {
        $request->validate([
            'voice' => ['nullable', 'file', 'mimes:mp3,mpga,wav,m4a,mp4,aac,ogg,oga,opus,webm,flac', 'max:25600'],
        ]);
    }

    public static function validateDeleteRambles(Request $request)
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);
    }

    public static function validateInterpretTransactions(Request $request)
    {
        $request->validate([
            'payload' => ['required', 'array'],
            'payload.messages' => ['required', 'array'],
        ]);
    }
}
