<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->enum('stay_status', ['reserved', 'checked_in', 'checked_out', 'no_show'])
                ->default('reserved')
                ->after('status');
            $table->timestamp('checked_in_at')->nullable()->after('stay_status');
            $table->timestamp('checked_out_at')->nullable()->after('checked_in_at');
            $table->timestamp('no_show_at')->nullable()->after('checked_out_at');
            $table->text('internal_notes')->nullable()->after('special_request');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'stay_status',
                'checked_in_at',
                'checked_out_at',
                'no_show_at',
                'internal_notes',
            ]);
        });
    }
};
