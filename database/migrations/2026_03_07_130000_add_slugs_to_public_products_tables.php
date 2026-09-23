<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('destination_name');
        });

        $this->fillSlugs('mitra_wisata_onboardings', 'destination_name', 'wisata', ['booking', 'history']);

        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }

    private function fillSlugs(string $table, string $nameColumn, string $fallbackPrefix, array $reserved = []): void
    {
        $existing = [];
        $rows = DB::table($table)
            ->select('id', $nameColumn)
            ->orderBy('id')
            ->get();

        foreach ($rows as $row) {
            $name = (string) ($row->{$nameColumn} ?? '');
            $base = Str::slug($name);
            if ($base === '') {
                $base = $fallbackPrefix.'-'.$row->id;
            }
            if (in_array($base, $reserved, true)) {
                $base .= '-'.$fallbackPrefix;
            }

            $candidate = $base;
            $suffix = 1;
            while (in_array($candidate, $reserved, true) || in_array($candidate, $existing, true)) {
                $candidate = $base.'-'.$suffix;
                $suffix++;
            }

            DB::table($table)
                ->where('id', $row->id)
                ->update(['slug' => $candidate]);

            $existing[] = $candidate;
        }
    }
};
