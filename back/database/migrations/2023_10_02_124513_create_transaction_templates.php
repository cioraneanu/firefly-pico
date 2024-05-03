<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transaction_templates', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->string("name")->nullable();
            $table->double("amount")->nullable();
            $table->integer("account_source_id")->nullable();
            $table->integer("account_destination_id")->nullable();
            $table->integer("category_id")->nullable();
//            $table->date("date");
            $table->string("type")->nullable();
            $table->string("notes")->nullable();
            $table->string("description")->nullable();
        });

        Schema::create('transaction_template_tags', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->integer("transaction_template_id");
            $table->integer("tag_id");

            $table->foreign('transaction_template_id')->references('id')->on('transaction_templates')->onDelete('cascade');
        });


        Schema::create('icons', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->string("name")->nullable();
            $table->string("description")->nullable();
        });

        Schema::create('transaction', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->integer("firefly_id")->nullable();
            $table->float("latitude")->nullable();
            $table->float("longitude")->nullable();
        });

        // TODO: Implement proper implementation later...
//        Schema::create('transaction_template_voice_names', function (Blueprint $table) {
//            $table->id();
//            $table->timestamps();
//
//            $table->integer("transaction_template_id");
//            $table->string("name")->nullable();
//        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_templates');
    }
};
