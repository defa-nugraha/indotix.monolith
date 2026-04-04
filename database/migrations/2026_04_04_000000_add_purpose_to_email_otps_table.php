<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_otps', function (Blueprint $table) {
            $table->string('purpose', 50)->default('verify_email')->after('email');
            $table->index(['user_id', 'purpose']);
        });
    }

    public function down(): void
    {
        Schema::table('email_otps', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'purpose']);
            $table->dropColumn('purpose');
        });
    }
};
