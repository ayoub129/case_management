<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Permission;

class AssignPermissionsToUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:assign-all-permissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign all permissions to existing users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to assign permissions to existing users...');

        // Get all users
        $users = User::all();
        $this->info("Found {$users->count()} users");

        // Get all permissions
        $permissions = Permission::all();
        $this->info("Found {$permissions->count()} permissions");

        if ($permissions->isEmpty()) {
            $this->error('No permissions found. Please run the PermissionSeeder first.');
            return 1;
        }

        $permissionIds = $permissions->pluck('id')->toArray();
        $bar = $this->output->createProgressBar($users->count());

        // Assign all permissions to each user
        foreach ($users as $user) {
            $user->assignPermissions($permissionIds);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('All permissions assigned to existing users successfully!');

        return 0;
    }
}
