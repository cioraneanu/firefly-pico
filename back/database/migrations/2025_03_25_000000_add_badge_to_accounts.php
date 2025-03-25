<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->string("badge", 3)->nullable()->default(null);
        });
    }


    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn("badge");
        });
    }
};
