<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('transaction_template_audio_names', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->bigInteger("transaction_template_id")->unsigned();
            $table->string("name", 1000);
            $table->foreign('transaction_template_id')->references('id')->on('transaction_templates')->onDelete('cascade');
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('transaction_template_audio_names');
    }
};
