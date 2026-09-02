<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    private const STAT_KEYS = [
        'home_part_of_stat_1_icon',
        'home_part_of_stat_1_value',
        'home_part_of_stat_1_label',
        'home_part_of_stat_2_icon',
        'home_part_of_stat_2_value',
        'home_part_of_stat_2_label',
        'home_part_of_stat_3_icon',
        'home_part_of_stat_3_value',
        'home_part_of_stat_3_label',
        'home_part_of_stat_4_icon',
        'home_part_of_stat_4_value',
        'home_part_of_stat_4_label',
    ];

    public function up(): void
    {
        DB::table('system_settings')
            ->whereIn('key', self::STAT_KEYS)
            ->delete();
    }

    public function down(): void
    {
        // Intentionally left empty. The removed home stats are retired content.
    }
};
