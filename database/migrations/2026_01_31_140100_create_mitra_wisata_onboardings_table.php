<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('current_step')->default(1);

            $table->string('responsible_name')->nullable();
            $table->string('responsible_phone')->nullable();
            $table->enum('responsible_role', ['owner', 'manager', 'pokdarwis', 'staff'])->nullable();

            $table->string('destination_name')->nullable();
            $table->enum('destination_type', ['alam', 'edukasi', 'budaya', 'wahana', 'event'])->nullable();
            $table->string('description', 1000)->nullable();
            $table->string('highlights', 1000)->nullable();

            $table->char('province_code', 2)->nullable();
            $table->char('city_code', 4)->nullable();
            $table->string('address_full')->nullable();
            $table->string('maps_pin_url')->nullable();

            $table->json('open_days')->nullable();
            $table->string('open_time', 8)->nullable();
            $table->string('close_time', 8)->nullable();
            $table->string('holiday_notes', 255)->nullable();

            $table->json('facilities')->nullable();

            $table->string('photo_gate_path')->nullable();
            $table->string('photo_area_path')->nullable();
            $table->string('photo_ticket_path')->nullable();

            $table->string('contact_phone')->nullable();
            $table->string('contact_hours')->nullable();

            $table->string('ktp_path')->nullable();
            $table->string('selfie_ktp_path')->nullable();
            $table->enum('legal_doc_type', ['nib', 'sk_desa', 'surat_pokdarwis', 'izin_wisata', 'dokumen_kawasan'])->nullable();
            $table->string('legal_doc_number')->nullable();
            $table->string('legal_doc_path')->nullable();

            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();

            $table->enum('verification_status', ['draft', 'pending', 'verified', 'rejected'])->default('draft');
            $table->text('verification_reason')->nullable();
            $table->enum('payout_status', ['draft', 'pending', 'verified', 'rejected'])->default('draft');
            $table->text('payout_reason')->nullable();

            $table->timestamps();

            $table->index('province_code');
            $table->index('city_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mitra_wisata_onboardings');
    }
};
