<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\PagePermission;

class AssignPagePermissionsToUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:assign-all-page-permissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign all page permissions to existing users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to assign page permissions to existing users...');

        // Get all users
        $users = User::all();
        $this->info("Found {$users->count()} users");

        // Get all page permissions
        $pagePermissions = PagePermission::all();
        $this->info("Found {$pagePermissions->count()} page permissions");

        if ($pagePermissions->isEmpty()) {
            $this->error('No page permissions found. Please run the PagePermissionSeeder first.');
            return 1;
        }

        $permissionIds = $pagePermissions->pluck('id')->toArray();
        $bar = $this->output->createProgressBar($users->count());

        // Assign all permissions to each user
        foreach ($users as $user) {
            $user->assignPagePermissions($permissionIds);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('All page permissions assigned to existing users successfully!');

        return 0;
    }
}
