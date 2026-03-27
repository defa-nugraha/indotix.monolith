<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('special_program_bookings', function (Blueprint $table) {
            $table->foreignId('special_program_variant_id')
                ->nullable()
                ->after('special_program_id')
                ->constrained('special_program_variants')
                ->nullOnDelete();
            $table->text('notes')->nullable()->after('guest_phone');
        });
    }

    public function down(): void
    {
        Schema::table('special_program_bookings', function (Blueprint $table) {
            $table->dropForeign(['special_program_variant_id']);
            $table->dropColumn(['special_program_variant_id', 'notes']);
        });
    }
};
