<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table): void {
            if (! Schema::hasColumn('mitra_wisata_onboardings', 'photo_product_path')) {
                $table->string('photo_product_path')->nullable()->after('photo_ticket_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table): void {
            if (Schema::hasColumn('mitra_wisata_onboardings', 'photo_product_path')) {
                $table->dropColumn('photo_product_path');
            }
        });
    }
};
