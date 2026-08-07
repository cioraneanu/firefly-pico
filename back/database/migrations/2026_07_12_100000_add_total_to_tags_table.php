<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->decimal("total_amount", 20, 2)->nullable();
            $table->integer("total_currency_id")->nullable();
        });
    }


    public function down(): void
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->dropColumn("total_amount");
            $table->dropColumn("total_currency_id");
        });
    }
};
