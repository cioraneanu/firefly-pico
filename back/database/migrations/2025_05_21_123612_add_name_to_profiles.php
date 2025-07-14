<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string("name")->nullable();
            $table->dropUnique(['auth_token_hash']);
            $table->softDeletes();
        });
    }


    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn("name");
            $table->string("auth_token_hash")->unique()->change();
            $table->dropSoftDeletes();
        });
    }
};
