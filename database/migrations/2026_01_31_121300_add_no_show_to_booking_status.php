<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE bookings MODIFY status ENUM('draft','pending_payment','paid','expired','cancelled','completed','no_show') DEFAULT 'pending_payment'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE bookings MODIFY status ENUM('draft','pending_payment','paid','expired','cancelled','completed') DEFAULT 'pending_payment'");
    }
};
