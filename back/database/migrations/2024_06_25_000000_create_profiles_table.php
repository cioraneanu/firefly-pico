<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->string("auth_token_hash")->unique();
            $table->jsonb('settings')->default('{}');
            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
