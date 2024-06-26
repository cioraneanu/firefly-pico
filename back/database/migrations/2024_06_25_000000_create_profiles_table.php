<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->string("auth_token_hash")->primary();
            $table->timestamps();

            $table->jsonb('settings')->default('{}');
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};