<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('souvenir_products', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        $existing = [];
        $products = DB::table('souvenir_products')
            ->select('id', 'name')
            ->orderBy('id')
            ->get();

        foreach ($products as $product) {
            $base = Str::slug((string) $product->name);
            if ($base === '') {
                $base = 'produk-'.$product->id;
            }
            if (in_array($base, ['cart', 'checkout', 'booking'], true)) {
                $base .= '-produk';
            }

            $candidate = $base;
            $suffix = 1;
            while (in_array($candidate, $existing, true)) {
                $suffix++;
                $candidate = $base.'-'.$suffix;
            }

            DB::table('souvenir_products')
                ->where('id', $product->id)
                ->update(['slug' => $candidate]);

            $existing[] = $candidate;
        }

        Schema::table('souvenir_products', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('souvenir_products', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
