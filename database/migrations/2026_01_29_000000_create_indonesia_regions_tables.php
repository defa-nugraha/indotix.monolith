<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->char('code', 2)->primary();
            $table->string('name');
        });

        Schema::create('regencies', function (Blueprint $table) {
            $table->char('code', 4)->primary();
            $table->char('province_code', 2);
            $table->string('name');
            $table->string('type', 16)->nullable();

            $table->index('province_code');
            $table->foreign('province_code')
                ->references('code')
                ->on('provinces')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->char('code', 6)->primary();
            $table->char('regency_code', 4);
            $table->string('name');

            $table->index('regency_code');
            $table->foreign('regency_code')
                ->references('code')
                ->on('regencies')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });

        Schema::create('villages', function (Blueprint $table) {
            $table->char('code', 10)->primary();
            $table->char('district_code', 6);
            $table->string('name');
            $table->string('type', 16)->nullable();
            $table->string('postal_code', 10)->nullable();

            $table->index('district_code');
            $table->foreign('district_code')
                ->references('code')
                ->on('districts')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('villages');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regencies');
        Schema::dropIfExists('provinces');
    }
};
