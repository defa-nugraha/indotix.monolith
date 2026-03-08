<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('title');
        });

        Schema::table('special_programs', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name');
        });

        Schema::table('academy_classes', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('title');
        });

        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('destination_name');
        });

        $this->fillSlugs('hotels', 'name', 'hotel');
        $this->fillSlugs('events', 'title', 'event', ['booking']);
        $this->fillSlugs('special_programs', 'name', 'program', ['booking']);
        $this->fillSlugs('academy_classes', 'title', 'academy', ['booking']);
        $this->fillSlugs('mitra_wisata_onboardings', 'destination_name', 'wisata', ['booking', 'history']);

        Schema::table('hotels', function (Blueprint $table) {
            $table->unique('slug');
        });
        Schema::table('events', function (Blueprint $table) {
            $table->unique('slug');
        });
        Schema::table('special_programs', function (Blueprint $table) {
            $table->unique('slug');
        });
        Schema::table('academy_classes', function (Blueprint $table) {
            $table->unique('slug');
        });
        Schema::table('mitra_wisata_onboardings', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
        Schema::table('events', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
        Schema::table('special_programs', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
        Schema::table('academy_classes', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
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
