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
        Schema::table('assistant_rambles', function (Blueprint $table) {
            $table->text('text')->nullable()->change();
            $table->string('voice_path')->nullable();
            $table->boolean('is_transcribed')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assistant_rambles', function (Blueprint $table) {
            $table->dropColumn(['voice_path', 'is_transcribed']);
            $table->text('text')->nullable(false)->change();
        });
    }
};
