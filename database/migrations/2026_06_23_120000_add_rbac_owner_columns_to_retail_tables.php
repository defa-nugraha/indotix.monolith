<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('souvenir_categories', function (Blueprint $table) {
            if (! Schema::hasColumn('souvenir_categories', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('is_active')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('souvenir_categories', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('souvenir_promotions', function (Blueprint $table) {
            if (! Schema::hasColumn('souvenir_promotions', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('special_program_id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('souvenir_promotions', 'updated_by')) {
                $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('souvenir_promotions', function (Blueprint $table) {
            if (Schema::hasColumn('souvenir_promotions', 'updated_by')) {
                $table->dropConstrainedForeignId('updated_by');
            }
            if (Schema::hasColumn('souvenir_promotions', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });

        Schema::table('souvenir_categories', function (Blueprint $table) {
            if (Schema::hasColumn('souvenir_categories', 'updated_by')) {
                $table->dropConstrainedForeignId('updated_by');
            }
            if (Schema::hasColumn('souvenir_categories', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });
    }
};
