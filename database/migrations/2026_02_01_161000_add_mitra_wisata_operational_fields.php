<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->boolean('is_temporarily_closed')->default(false);
            $table->string('closure_note', 255)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->dropColumn(['is_temporarily_closed', 'closure_note']);
        });
    }
};
