<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('wisata_tickets', 'is_weekend')) {
            Schema::table('wisata_tickets', function (Blueprint $table) {
                $table->boolean('is_weekend')->default(false)->after('is_closed')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('wisata_tickets', 'is_weekend')) {
            Schema::table('wisata_tickets', function (Blueprint $table) {
                $table->dropIndex(['is_weekend']);
                $table->dropColumn('is_weekend');
            });
        }
    }
};
