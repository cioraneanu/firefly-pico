<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->boolean("is_todo")->default(false);
        });
    }


    public function down(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->dropColumn("is_todo");
        });
    }
};
