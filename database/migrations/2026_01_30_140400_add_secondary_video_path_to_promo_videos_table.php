<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promo_videos', function (Blueprint $table) {
            $table->string('secondary_video_path')->nullable()->after('image_path');
        });
    }

    public function down(): void
    {
        Schema::table('promo_videos', function (Blueprint $table) {
            $table->dropColumn('secondary_video_path');
        });
    }
};
