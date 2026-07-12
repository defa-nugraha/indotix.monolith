<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partner_terms_documents', function (Blueprint $table) {
            $table->id();
            $table->string('business_type', 20)->unique();
            $table->string('title');
            $table->string('file_path');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('partner_terms_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_terms_document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('business_type', 20);
            $table->string('signer_name');
            $table->timestamp('signed_at');
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamps();

            $table->unique(['partner_terms_document_id', 'user_id'], 'partner_terms_user_unique');
            $table->index(['user_id', 'business_type'], 'partner_terms_user_type_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partner_terms_signatures');
        Schema::dropIfExists('partner_terms_documents');
    }
};
