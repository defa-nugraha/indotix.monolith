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
            ];

            if ($canSetRole) {
                $payload['role'] = $user['role'];
            }

            User::query()->updateOrCreate(['email' => $user['email']], $payload);
        }
    }
}
