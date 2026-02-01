<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('wisata_tickets', function (Blueprint $table) {
            $table->enum('ticket_type', ['perorangan', 'grup'])->default('perorangan')->after('quota');
            $table->unsignedInteger('daily_quota')->nullable()->after('ticket_type');
            $table->date('valid_from')->nullable()->after('daily_quota');
            $table->date('valid_until')->nullable()->after('valid_from');
            $table->string('refund_policy')->nullable()->after('valid_until');
            $table->boolean('is_closed')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('wisata_tickets', function (Blueprint $table) {
            $table->dropColumn([
                'ticket_type',
                'daily_quota',
                'valid_from',
                'valid_until',
                'refund_policy',
                'is_closed',
            ]);
        });
    }
};
