<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wisata_tickets', function (Blueprint $table) {
            $table->boolean('is_entry_ticket')
                ->default(true)
                ->after('ticket_kind')
                ->index();
        });
    }

    public function down(): void
    {
        Schema::table('wisata_tickets', function (Blueprint $table) {
            $table->dropColumn('is_entry_ticket');
        });
    }
};
