<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PagePermission;

class PagePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = PagePermission::getAvailablePermissions();

        foreach ($permissions as $permission) {
            PagePermission::firstOrCreate(
                ['name' => $permission['name']],
                [
                    'display_name' => $permission['display_name'],
                    'description' => $permission['description'],
                ]
            );
        }

        $this->command->info('Page permissions created successfully!');
    }
}
