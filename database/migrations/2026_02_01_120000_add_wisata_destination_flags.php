<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->boolean('is_live')->default(false)->after('payout_reason');
            $table->boolean('is_suspended')->default(false)->after('is_live');
            $table->text('suspended_reason')->nullable()->after('is_suspended');
            $table->timestamp('suspended_at')->nullable()->after('suspended_reason');
        });
    }

    public function down(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->dropColumn(['is_live', 'is_suspended', 'suspended_reason', 'suspended_at']);
        });
    }
};
