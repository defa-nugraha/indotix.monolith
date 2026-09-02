<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE mitra_wisata_onboardings MODIFY destination_type VARCHAR(80) NULL');
            DB::statement('ALTER TABLE mitra_wisata_onboardings MODIFY responsible_role VARCHAR(80) NULL');
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE mitra_wisata_onboardings ALTER COLUMN destination_type TYPE VARCHAR(80)');
            DB::statement('ALTER TABLE mitra_wisata_onboardings ALTER COLUMN responsible_role TYPE VARCHAR(80)');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE mitra_wisata_onboardings SET destination_type = NULL WHERE destination_type IS NOT NULL AND destination_type NOT IN ('alam', 'edukasi', 'budaya', 'wahana', 'event')");
            DB::statement("UPDATE mitra_wisata_onboardings SET responsible_role = NULL WHERE responsible_role IS NOT NULL AND responsible_role NOT IN ('owner', 'manager', 'pokdarwis', 'staff')");
            DB::statement("ALTER TABLE mitra_wisata_onboardings MODIFY destination_type ENUM('alam', 'edukasi', 'budaya', 'wahana', 'event') NULL");
            DB::statement("ALTER TABLE mitra_wisata_onboardings MODIFY responsible_role ENUM('owner', 'manager', 'pokdarwis', 'staff') NULL");
        }
    }
};
