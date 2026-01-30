<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('mitra_onboardings')) {
            return;
        }

        Schema::create('mitra_onboardings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('current_step')->default(1);

            // Step 1: Data Hotel (Ringkas)
            $table->string('hotel_name')->nullable();
            $table->enum('property_type', ['hotel', 'guest_house', 'homestay', 'kost_harian'])->nullable();
            $table->char('city_code', 4)->nullable();
            $table->string('address_short')->nullable();
            $table->unsignedInteger('estimated_room_count')->nullable();

            // Step 2: Verifikasi Hotel
            $table->string('responsible_name')->nullable();
            $table->string('responsible_nik', 32)->nullable();
            $table->enum('responsible_role', ['owner', 'manager', 'admin'])->nullable();
            $table->string('ktp_path')->nullable();
            $table->string('selfie_ktp_path')->nullable();

            $table->enum('legal_doc_type', ['nib', 'siup', 'tdp', 'surat_izin_daerah', 'surat_rt_rw', 'akta_pendirian'])->nullable();
            $table->string('legal_doc_number')->nullable();
            $table->string('legal_doc_path')->nullable();

            $table->string('photo_front_path')->nullable();
            $table->string('photo_lobby_path')->nullable();
            $table->string('photo_room_path')->nullable();

            $table->string('address_full')->nullable();
            $table->string('maps_pin_url')->nullable();
            $table->string('reception_phone')->nullable();
            $table->string('operational_hours')->nullable();
            $table->string('reservation_pic')->nullable();

            $table->enum('verification_status', ['draft', 'pending', 'verified', 'rejected'])->default('draft');
            $table->text('verification_reason')->nullable();

            // Step 3: Setup Finansial
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('tax_npwp')->nullable();
            $table->enum('tax_type', ['pribadi', 'badan'])->nullable();
            $table->enum('payout_status', ['draft', 'pending', 'verified', 'rejected'])->default('draft');
            $table->text('payout_reason')->nullable();

            $table->timestamps();

            $table->index('city_code');
            $table->foreign('city_code')
                ->references('code')
                ->on('regencies')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mitra_onboardings');
    }
};
