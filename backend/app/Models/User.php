<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Get the page permissions for the user.
     */
    public function pagePermissions(): BelongsToMany
    {
        return $this->belongsToMany(PagePermission::class, 'user_page_permissions');
    }

    /**
     * Check if user has a specific page permission
     */
    public function hasPagePermission(string $permissionName): bool
    {
        // Admin users have all permissions
        if ($this->hasRole('admin')) {
            return true;
        }

        return $this->pagePermissions()->where('name', $permissionName)->exists();
    }

    /**
     * Check if user has any of the given page permissions
     */
    public function hasAnyPagePermission(array $permissionNames): bool
    {
        // Admin users have all permissions
        if ($this->hasRole('admin')) {
            return true;
        }

        return $this->pagePermissions()->whereIn('name', $permissionNames)->exists();
    }

    /**
     * Get user's page permission names as array
     */
    public function getPagePermissionNames(): array
    {
        return $this->pagePermissions()->pluck('name')->toArray();
    }

    /**
     * Assign page permissions to user
     */
    public function assignPagePermissions(array $permissionIds): void
    {
        $this->pagePermissions()->sync($permissionIds);
    }
}
