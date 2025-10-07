<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\PagePermission;

class AssignPagePermissionsToExistingUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users
        $users = User::all();
        
        // Get all page permissions
        $pagePermissions = PagePermission::all();
        
        if ($pagePermissions->isEmpty()) {
            $this->command->warn('No page permissions found. Please run the PagePermissionSeeder first.');
            return;
        }
        
        // Get permission IDs
        $permissionIds = $pagePermissions->pluck('id')->toArray();
        
        // Assign all permissions to each user
        foreach ($users as $user) {
            $user->assignPagePermissions($permissionIds);
        }
        
        $this->command->info('All page permissions assigned to existing users successfully!');
    }
}
