<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles if they don't exist
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $cashierRole = Role::firstOrCreate(['name' => 'cashier']);

        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'email' => 'admin@example.com',
                'password' => Hash::make('admin123'),
                'phone' => '+1234567890',
                'address' => '123 Admin Street, City, Country',
            ]
        );
        $admin->assignRole($adminRole);

        // Create cashier user
        $cashier = User::firstOrCreate(
            ['email' => 'cashier@example.com'],
            [
                'name' => 'Cashier User',
                'email' => 'cashier@example.com',
                'password' => Hash::make('cashier123'),
                'phone' => '+0987654321',
                'address' => '456 Cashier Avenue, City, Country',
            ]
        );
        $cashier->assignRole($cashierRole);

        $this->command->info('Test users created successfully!');
        $this->command->info('Admin: admin@example.com / admin123');
        $this->command->info('Cashier: cashier@example.com / cashier123');
    }
} 