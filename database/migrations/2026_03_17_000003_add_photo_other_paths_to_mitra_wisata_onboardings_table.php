<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->json('photo_other_paths')->nullable()->after('photo_ticket_path');
        });
    }

    public function down(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->dropColumn('photo_other_paths');
        });
    }
};
