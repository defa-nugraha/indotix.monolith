<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('wisata_tickets', 'weekend_price')) {
            Schema::table('wisata_tickets', function (Blueprint $table) {
                $table->unsignedInteger('weekend_price')->nullable()->after('is_weekend');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('wisata_tickets', 'weekend_price')) {
            Schema::table('wisata_tickets', function (Blueprint $table) {
                $table->dropColumn('weekend_price');
            });
        }
    }
};
