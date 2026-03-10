<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('academy_bookings', function (Blueprint $table) {
            $table->dropForeign(['academy_class_id']);
            $table->dropForeign(['academy_ticket_id']);
        });

        DB::statement('ALTER TABLE academy_bookings MODIFY academy_class_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE academy_bookings MODIFY academy_ticket_id BIGINT UNSIGNED NULL');

        Schema::table('academy_bookings', function (Blueprint $table) {
            $table->foreign('academy_class_id')->references('id')->on('academy_classes')->nullOnDelete();
            $table->foreign('academy_ticket_id')->references('id')->on('academy_tickets')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('academy_bookings', function (Blueprint $table) {
            $table->dropForeign(['academy_class_id']);
            $table->dropForeign(['academy_ticket_id']);
        });

        DB::statement('ALTER TABLE academy_bookings MODIFY academy_class_id BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE academy_bookings MODIFY academy_ticket_id BIGINT UNSIGNED NOT NULL');

        Schema::table('academy_bookings', function (Blueprint $table) {
            $table->foreign('academy_class_id')->references('id')->on('academy_classes')->cascadeOnDelete();
            $table->foreign('academy_ticket_id')->references('id')->on('academy_tickets')->cascadeOnDelete();
        });
    }
};
