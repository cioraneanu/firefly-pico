<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A user's own assistant connections. When a group is switched to "own", its endpoint, key and model
     * replace the server's ASSISTANT_* environment variables for that user only.
     */
    public function up(): void
    {
        Schema::create('assistant_user_settings', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->unique();

            $table->boolean('llm_use_own')->default(false);
            $table->string('llm_endpoint', 500)->nullable();
            $table->string('llm_model')->nullable();
            $table->text('llm_api_key')->nullable();

            $table->boolean('transcription_use_own')->default(false);
            $table->string('transcription_endpoint', 500)->nullable();
            $table->string('transcription_model')->nullable();
            $table->text('transcription_api_key')->nullable();
            $table->string('transcription_language', 20)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_user_settings');
    }
};
