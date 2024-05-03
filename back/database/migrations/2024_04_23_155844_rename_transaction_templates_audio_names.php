<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::rename('transaction_template_audio_names', 'transaction_template_extra_names');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('transaction_template_extra_names', 'transaction_template_audio_names');
    }
};
