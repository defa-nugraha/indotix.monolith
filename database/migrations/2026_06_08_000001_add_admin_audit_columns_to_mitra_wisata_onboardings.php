<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            if (! Schema::hasColumn('mitra_wisata_onboardings', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('mitra_wisata_onboardings', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            if (Schema::hasColumn('mitra_wisata_onboardings', 'updated_by')) {
                $table->dropConstrainedForeignId('updated_by');
            }

            if (Schema::hasColumn('mitra_wisata_onboardings', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });
    }
};
