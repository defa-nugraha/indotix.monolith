<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wisata_payments', function (Blueprint $table) {
            $table->string('active_key')->nullable()->unique()->after('order_id');
            $table->unsignedInteger('reconciliation_attempts')->default(0)->after('active_key');
            $table->timestamp('last_reconciled_at')->nullable()->after('reconciliation_attempts');
            $table->text('last_gateway_error')->nullable()->after('last_reconciled_at');
            $table->timestamp('notification_dispatched_at')->nullable()->after('last_gateway_error');
        });

        Schema::create('wisata_refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wisata_booking_id')->constrained('wisata_bookings')->cascadeOnDelete();
            $table->foreignId('wisata_payment_id')->constrained('wisata_payments')->cascadeOnDelete();
            $table->string('refund_key')->unique();
            $table->unsignedInteger('amount');
            $table->string('status')->default('initiating');
            $table->string('provider_action')->default('refund');
            $table->string('provider_refund_id')->nullable();
            $table->json('provider_payload')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->foreignId('created_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['wisata_booking_id', 'status']);
        });

        Schema::table('wisata_payouts', function (Blueprint $table) {
            $table->string('idempotency_key')->nullable()->unique()->after('mitra_wisata_onboarding_id');
            $table->unsignedInteger('gross_refund_amount')->default(0)->after('total_gmv');
            $table->unsignedInteger('prior_adjustment_amount')->default(0)->after('commission_amount');
        });

        Schema::create('wisata_payout_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mitra_wisata_onboarding_id')->constrained('mitra_wisata_onboardings')->cascadeOnDelete();
            $table->foreignId('wisata_booking_id')->constrained('wisata_bookings')->cascadeOnDelete();
            $table->foreignId('wisata_refund_id')->unique()->constrained('wisata_refunds')->cascadeOnDelete();
            $table->unsignedInteger('amount');
            $table->unsignedInteger('applied_amount')->default(0);
            $table->string('status')->default('pending');
            $table->foreignId('applied_payout_id')->nullable()->constrained('wisata_payouts')->nullOnDelete();
            $table->timestamps();

            $table->index(['mitra_wisata_onboarding_id', 'status'], 'wisata_payout_adj_mitra_status_idx');
        });

        Schema::table('wisata_affiliate_payouts', function (Blueprint $table) {
            $table->string('idempotency_key')->nullable()->unique()->after('affiliate_id');
        });
    }

    public function down(): void
    {
        Schema::table('wisata_affiliate_payouts', function (Blueprint $table) {
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn('idempotency_key');
        });

        Schema::dropIfExists('wisata_payout_adjustments');

        Schema::table('wisata_payouts', function (Blueprint $table) {
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn(['idempotency_key', 'gross_refund_amount', 'prior_adjustment_amount']);
        });

        Schema::dropIfExists('wisata_refunds');

        Schema::table('wisata_payments', function (Blueprint $table) {
            $table->dropUnique(['active_key']);
            $table->dropColumn([
                'active_key',
                'reconciliation_attempts',
                'last_reconciled_at',
                'last_gateway_error',
                'notification_dispatched_at',
            ]);
        });
    }
};
