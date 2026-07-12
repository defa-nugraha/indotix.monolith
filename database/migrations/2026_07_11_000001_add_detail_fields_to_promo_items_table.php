<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('promo_items', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('title');
            $table->string('category')->default('wisata')->after('slug');
            $table->text('excerpt')->nullable()->after('category');
            $table->longText('description')->nullable()->after('excerpt');
            $table->longText('terms')->nullable()->after('description');
            $table->date('starts_at')->nullable()->after('sort_order');
            $table->date('ends_at')->nullable()->after('starts_at');
        });

        DB::table('promo_items')
            ->orderBy('id')
            ->get(['id', 'title'])
            ->each(function ($promo) {
                $baseSlug = Str::slug($promo->title ?: 'promo-indotix-'.$promo->id);
                $slug = $baseSlug;
                $counter = 2;

                while (
                    DB::table('promo_items')
                        ->where('slug', $slug)
                        ->where('id', '!=', $promo->id)
                        ->exists()
                ) {
                    $slug = "{$baseSlug}-{$counter}";
                    $counter++;
                }

                DB::table('promo_items')
                    ->where('id', $promo->id)
                    ->update([
                        'slug' => $slug,
                        'category' => 'wisata',
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('promo_items', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn([
                'slug',
                'category',
                'excerpt',
                'description',
                'terms',
                'starts_at',
                'ends_at',
            ]);
        });
    }
};
