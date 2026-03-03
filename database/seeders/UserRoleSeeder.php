<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class UserRoleSeeder extends Seeder
{
    public function run(): void
    {
        $fillable = (new User())->getFillable();
        $canSetRole = Schema::hasColumn('users', 'role') && in_array('role', $fillable, true);

        $users = [
            [
                'name' => 'Admin Indotix',
                'email' => 'admin@indotix.id',
                'password' => 'password',
                'role' => 'admin',
            ],
            [
                'name' => 'Admin Academy',
                'email' => 'admin.academy@indotix.id',
                'password' => 'password',
                'role' => 'admin_academy',
            ],
            [
                'name' => 'Admin Retail Shop',
                'email' => 'admin.retail@indotix.id',
                'password' => 'password',
                'role' => 'admin_retail',
            ],
            [
                'name' => 'Admin Special Program',
                'email' => 'admin.special@indotix.id',
                'password' => 'password',
                'role' => 'admin_special_program',
            ],
            [
                'name' => 'Mitra Indotix',
                'email' => 'mitra@indotix.id',
                'password' => 'password',
                'role' => 'mitra',
            ],
            [
                'name' => 'User Indotix',
                'email' => 'user@indotix.id',
                'password' => 'password',
                'role' => 'user',
            ],
        ];

        foreach ($users as $user) {
            $payload = [
                'name' => $user['name'],
                'email' => $user['email'],
                'password' => $user['password'],
                'email_verified_at' => now(),
            ];

            if ($canSetRole) {
                $payload['role'] = $user['role'];
            }

            User::query()->updateOrCreate(['email' => $user['email']], $payload);
        }
    }
}
