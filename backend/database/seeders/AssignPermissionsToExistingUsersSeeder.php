<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Permission;

class AssignPermissionsToExistingUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users
        $users = User::all();
        
        // Get all permissions
        $permissions = Permission::all();
        
        // Assign all permissions to each user
        foreach ($users as $user) {
            $permissionIds = $permissions->pluck('id')->toArray();
            $user->assignPermissions($permissionIds);
        }
        
        $this->command->info('All permissions assigned to existing users successfully!');
    }
}
