<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    public function up(): void
    {
        Schema::table('transaction_templates', function (Blueprint $table) {
            $table->integer("budget_id")->nullable();
        });
    }


    public function down(): void
    {
        Schema::table('transaction_templates', function (Blueprint $table) {
            $table->dropColumn("budget_id");
        });
    }
};
