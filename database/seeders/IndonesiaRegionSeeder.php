<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class IndonesiaRegionSeeder extends Seeder
{
    public function run(): void
    {
        DB::disableQueryLog();
        $path = database_path('seeders/data/indonesia.json');

        if (! file_exists($path)) {
            throw new RuntimeException("File data wilayah tidak ditemukan: {$path}");
        }

        $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        $this->seedTable('provinces', $data['provinces'] ?? [], ['code', 'name']);
        $this->seedTable('regencies', $data['regencies'] ?? [], ['code', 'province_code', 'name', 'type']);
        $this->seedTable('districts', $data['districts'] ?? [], ['code', 'regency_code', 'name']);
        $this->seedTable('villages', $data['villages'] ?? [], ['code', 'district_code', 'name', 'type', 'postal_code']);
    }

    private function seedTable(string $table, array $rows, array $columns): void
    {
        if (! $rows) {
            return;
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            $payload = array_map(
                fn ($row) => array_intersect_key($row, array_flip($columns)),
                $chunk
            );

            DB::table($table)->upsert($payload, ['code']);
        }
    }
}
