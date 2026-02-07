<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('wisata_affiliates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->enum('type', ['individu', 'komunitas', 'media'])->default('individu');
            $table->string('platform')->nullable();
            $table->enum('status', ['draft', 'pending_review', 'active', 'suspended', 'terminated'])->default('draft');
            $table->text('notes')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->timestamps();
        });

        Schema::create('wisata_affiliate_commissions', function (Blueprint $table) {
            $table->id();
            $table->enum('scope_type', ['global', 'wisata', 'campaign'])->default('global');
            $table->unsignedBigInteger('wisata_id')->nullable();
            $table->unsignedBigInteger('campaign_id')->nullable();
            $table->enum('type', ['percentage', 'nominal'])->default('percentage');
            $table->unsignedInteger('value');
            $table->enum('source', ['platform', 'subsidi_promo'])->default('platform');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });

        Schema::create('wisata_affiliate_links', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('affiliate_id');
            $table->string('code')->unique();
            $table->string('token');
            $table->string('landing_url')->nullable();
            $table->enum('status', ['active', 'disabled'])->default('active');
            $table->enum('attribution_model', ['last_click', 'first_click'])->default('last_click');
            $table->unsignedSmallInteger('cookie_days')->default(7);
            $table->timestamps();

            $table->foreign('affiliate_id')->references('id')->on('wisata_affiliates')->onDelete('cascade');
        });

        Schema::create('wisata_affiliate_clicks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('affiliate_link_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('ip')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->foreign('affiliate_link_id')->references('id')->on('wisata_affiliate_links')->onDelete('cascade');
        });

        Schema::create('wisata_affiliate_commission_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('affiliate_id');
            $table->unsignedBigInteger('wisata_booking_id')->nullable();
            $table->unsignedInteger('commission_amount');
            $table->enum('status', ['pending', 'approved', 'cancelled'])->default('pending');
            $table->string('reason')->nullable();
            $table->timestamps();

            $table->foreign('affiliate_id')->references('id')->on('wisata_affiliates')->onDelete('cascade');
        });

        Schema::create('wisata_affiliate_payouts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('affiliate_id');
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->unsignedInteger('total_commission')->default(0);
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid'])->default('pending');
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('affiliate_id')->references('id')->on('wisata_affiliates')->onDelete('cascade');
        });

        Schema::create('wisata_affiliate_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->enum('status', ['draft', 'active', 'paused', 'ended'])->default('draft');
            $table->enum('bonus_type', ['percentage', 'nominal'])->nullable();
            $table->unsignedInteger('bonus_value')->nullable();
            $table->boolean('leaderboard_enabled')->default(false);
            $table->timestamps();
        });

        Schema::create('wisata_affiliate_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admin_id')->nullable();
            $table->string('action');
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('wisata_affiliate_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('cookie_days')->default(7);
            $table->enum('attribution_model', ['last_click', 'first_click'])->default('last_click');
            $table->unsignedInteger('min_payout')->default(0);
            $table->unsignedSmallInteger('payout_cutoff_days')->default(7);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wisata_affiliate_settings');
        Schema::dropIfExists('wisata_affiliate_audit_logs');
        Schema::dropIfExists('wisata_affiliate_campaigns');
        Schema::dropIfExists('wisata_affiliate_payouts');
        Schema::dropIfExists('wisata_affiliate_commission_items');
        Schema::dropIfExists('wisata_affiliate_clicks');
        Schema::dropIfExists('wisata_affiliate_links');
        Schema::dropIfExists('wisata_affiliate_commissions');
        Schema::dropIfExists('wisata_affiliates');
    }
};
