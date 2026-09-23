<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call(UserRoleSeeder::class);
        $this->call(IndonesiaRegionSeeder::class);
        $this->call(MitraDemoUserSeeder::class);
        $this->call(WisataBookingSeeder::class);
        $this->call(BlogSeeder::class);
        $this->call(FaqSeeder::class);
        $this->call(PrivacyPolicySeeder::class);
        $this->call(AboutPageSeeder::class);
        $this->call(VoucherSeeder::class);
    }
}
