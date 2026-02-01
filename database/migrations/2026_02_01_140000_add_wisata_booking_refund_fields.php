<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('wisata_bookings', function (Blueprint $table) {
            $table->text('cancel_reason')->nullable()->after('status');
            $table->timestamp('cancelled_at')->nullable()->after('cancel_reason');
            $table->foreignId('cancelled_by_admin_id')->nullable()->after('cancelled_at')->constrained('users')->nullOnDelete();
            $table->enum('refund_status', ['none', 'pending', 'processed', 'rejected'])->default('none')->after('cancelled_by_admin_id');
            $table->unsignedInteger('refund_amount')->nullable()->after('refund_status');
            $table->text('refund_reason')->nullable()->after('refund_amount');
            $table->timestamp('refund_processed_at')->nullable()->after('refund_reason');
        });
    }

    public function down(): void
    {
        Schema::table('wisata_bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cancelled_by_admin_id');
            $table->dropColumn([
                'cancel_reason',
                'cancelled_at',
                'refund_status',
                'refund_amount',
                'refund_reason',
                'refund_processed_at',
            ]);
        });
    }
};
