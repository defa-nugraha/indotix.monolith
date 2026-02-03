<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mitra_event_onboardings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('current_step')->default(1);

            $table->string('responsible_name')->nullable();
            $table->string('responsible_phone')->nullable();
            $table->enum('responsible_role', ['owner', 'project_manager', 'ketua_panitia', 'admin_eo'])->nullable();

            $table->string('eo_name')->nullable();
            $table->enum('organizer_type', ['eo_profesional', 'komunitas', 'kampus', 'individu'])->nullable();
            $table->unsignedSmallInteger('founded_year')->nullable();
            $table->string('eo_description', 1000)->nullable();

            $table->enum('legal_doc_type', ['nib_siup_akta', 'surat_eo_komunitas', 'surat_kampus_ukm', 'surat_pernyataan'])->nullable();
            $table->string('legal_doc_number')->nullable();
            $table->string('legal_doc_path')->nullable();

            $table->string('ktp_path')->nullable();
            $table->string('selfie_ktp_path')->nullable();

            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->enum('bank_account_relation', ['pribadi', 'organisasi', 'perusahaan'])->nullable();

            $table->string('operational_phone')->nullable();
            $table->string('operational_email')->nullable();
            $table->string('operational_hours')->nullable();

            $table->enum('verification_status', ['draft', 'pending', 'verified', 'rejected'])->default('draft');
            $table->text('verification_reason')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mitra_event_onboardings');
    }
};
