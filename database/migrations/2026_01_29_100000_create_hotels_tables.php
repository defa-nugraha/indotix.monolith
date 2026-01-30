<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->char('city_id', 4);
            $table->string('address');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->unsignedTinyInteger('star_rating')->nullable();
            $table->time('check_in_time')->nullable();
            $table->time('check_out_time')->nullable();
            $table->string('status', 16)->default('draft');
            $table->timestamps();

            $table->index(['status', 'city_id']);
            $table->foreign('city_id')
                ->references('code')
                ->on('regencies')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        Schema::create('hotel_facilities', function (Blueprint $table) {
            $table->foreignId('hotel_id')->constrained('hotels')->cascadeOnDelete();
            $table->string('facility_code', 32);

            $table->primary(['hotel_id', 'facility_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_facilities');
        Schema::dropIfExists('hotels');
    }
};
