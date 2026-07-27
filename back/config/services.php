<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'assistant_llm' => [
        'endpoint' => env('ASSISTANT_LLM_ENDPOINT'),
        'model' => env('ASSISTANT_LLM_MODEL'),
        'api_key' => env('ASSISTANT_LLM_API_KEY'),
        'context' => env('ASSISTANT_LLM_CONTEXT'),
        'defaults' => [
            'endpoint' => 'https://api.openai.com/v1/chat/completions',
            'model' => 'gpt-4o-mini',
        ],
    ],

    'assistant_transcription' => [
        'endpoint' => env('ASSISTANT_TRANSCRIPTION_ENDPOINT'),
        'model' => env('ASSISTANT_TRANSCRIPTION_MODEL'),
        'api_key' => env('ASSISTANT_TRANSCRIPTION_API_KEY'),
        'language' => env('ASSISTANT_TRANSCRIPTION_LANGUAGE'),
        'defaults' => [
            'endpoint' => 'https://api.openai.com/v1/audio/transcriptions',
            'model' => 'gpt-4o-mini-transcribe',
        ],
    ],

];
