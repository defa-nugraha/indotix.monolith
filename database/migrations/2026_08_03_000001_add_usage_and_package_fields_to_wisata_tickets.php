<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('wisata_booking_items', function (Blueprint $table) {
            $table->unsignedInteger('used_quantity')->default(0)->after('quantity');
        });

        Schema::table('wisata_ticket_scans', function (Blueprint $table) {
            $table->foreignId('wisata_booking_item_id')
                ->nullable()
                ->after('wisata_booking_id')
                ->constrained('wisata_booking_items')
                ->nullOnDelete();
            $table->foreignId('user_id')
                ->nullable()
                ->after('wisata_booking_item_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->unsignedInteger('quantity')->default(1)->after('user_id');
            $table->string('scan_source', 40)->default('mitra_qr')->after('quantity');
        });

        Schema::table('wisata_tickets', function (Blueprint $table) {
            $table->string('ticket_kind', 20)->default('single')->after('ticket_type');
            $table->json('package_items')->nullable()->after('ticket_kind');
        });
    }

    public function down(): void
    {
        Schema::table('wisata_tickets', function (Blueprint $table) {
            $table->dropColumn(['ticket_kind', 'package_items']);
        });

        Schema::table('wisata_ticket_scans', function (Blueprint $table) {
            $table->dropConstrainedForeignId('wisata_booking_item_id');
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['quantity', 'scan_source']);
        });

        Schema::table('wisata_booking_items', function (Blueprint $table) {
            $table->dropColumn('used_quantity');
        });
    }
};
