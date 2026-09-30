<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasDuplicateProviderTransaction = DB::table('wisata_payments')
            ->whereNotNull('transaction_id')
            ->select(['provider', 'transaction_id'])
            ->groupBy(['provider', 'transaction_id'])
            ->havingRaw('COUNT(*) > 1')
            ->exists();
        if ($hasDuplicateProviderTransaction) {
            throw new RuntimeException(
                'Duplicate provider transaction IDs must be reconciled before the payment migration can run.',
            );
        }

        Schema::table('wisata_payments', function (Blueprint $table) {
            $table->string('internal_status', 32)->default('pending')->after('status');
            $table->string('provider_reference_id')->nullable()->after('transaction_id');
            $table->unsignedInteger('provider_amount')->nullable()->after('gross_amount');
            $table->unsignedInteger('fee')->nullable()->after('provider_amount');
            $table->string('payment_channel')->nullable()->after('payment_type');
            $table->text('payment_url')->nullable()->after('provider_reference_id');
            $table->timestamp('expires_at')->nullable()->after('payment_url');
            $table->timestamp('paid_at')->nullable()->after('expires_at');
            $table->timestamp('failed_at')->nullable()->after('paid_at');

            $table->unique(['provider', 'transaction_id'], 'wisata_payment_provider_transaction_unique');
            $table->index(['provider', 'internal_status'], 'wisata_payment_provider_internal_idx');
        });

        DB::table('wisata_payments')->whereIn('status', ['settlement', 'capture'])->update([
            'internal_status' => 'paid',
        ]);
        DB::table('wisata_payments')->whereIn('status', ['cancel'])->update([
            'internal_status' => 'cancelled',
        ]);
        DB::table('wisata_payments')->whereIn('status', ['expire'])->update([
            'internal_status' => 'expired',
        ]);
        DB::table('wisata_payments')->whereIn('status', ['deny', 'failed'])->update([
            'internal_status' => 'failed',
        ]);
        DB::table('wisata_payments')->whereIn('status', ['refund', 'partial_refund'])->update([
            'internal_status' => 'refunded',
        ]);
        DB::table('wisata_payments')->whereIn('status', ['initiating'])->update([
            'internal_status' => 'initiating',
        ]);
        DB::table('wisata_payments')->whereIn('status', [
            'unknown',
            'cancellation_unknown',
            'expiry_unknown',
        ])->update(['internal_status' => 'unknown']);

        Schema::create('payment_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 32);
            $table->string('event_key', 128);
            $table->string('external_id')->nullable();
            $table->string('payload_hash', 64);
            $table->foreignId('wisata_payment_id')->nullable()->constrained('wisata_payments')->nullOnDelete();
            $table->string('reference_id')->nullable();
            $table->string('provider_transaction_id')->nullable();
            $table->string('status', 32)->default('received');
            $table->string('rejection_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'event_key'], 'payment_webhook_provider_event_unique');
            $table->unique(['provider', 'payload_hash'], 'payment_webhook_provider_payload_unique');
            $table->index(['provider', 'reference_id'], 'payment_webhook_provider_reference_idx');
            $table->index(['provider', 'provider_transaction_id'], 'payment_webhook_provider_transaction_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_webhook_events');

        Schema::table('wisata_payments', function (Blueprint $table) {
            $table->dropUnique('wisata_payment_provider_transaction_unique');
            $table->dropIndex('wisata_payment_provider_internal_idx');
            $table->dropColumn([
                'internal_status',
                'provider_reference_id',
                'provider_amount',
                'fee',
                'payment_channel',
                'payment_url',
                'expires_at',
                'paid_at',
                'failed_at',
            ]);
        });
    }
};
