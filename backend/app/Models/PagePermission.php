<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PagePermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_page_permissions');
    }

    /**
     * Get all available page permissions
     */
    public static function getAvailablePermissions(): array
    {
        return [
            ['name' => 'dashboard', 'display_name' => 'Tableau de bord', 'description' => 'Accès au tableau de bord'],
            ['name' => 'products', 'display_name' => 'Produits', 'description' => 'Gestion des produits'],
            ['name' => 'categories', 'display_name' => 'Catégories', 'description' => 'Gestion des catégories'],
            ['name' => 'cash', 'display_name' => 'Caisse', 'description' => 'Gestion de la caisse'],
            ['name' => 'sales', 'display_name' => 'Ventes', 'description' => 'Gestion des ventes'],
            ['name' => 'suppliers', 'display_name' => 'Fournisseurs', 'description' => 'Gestion des fournisseurs'],
            ['name' => 'customers', 'display_name' => 'Clients', 'description' => 'Gestion des clients'],
            ['name' => 'stock', 'display_name' => 'Alertes de stock', 'description' => 'Gestion des alertes de stock'],
            ['name' => 'inventory', 'display_name' => 'Inventaire', 'description' => 'Gestion de l\'inventaire'],
            ['name' => 'users', 'display_name' => 'Utilisateurs', 'description' => 'Gestion des utilisateurs'],
            ['name' => 'profile', 'display_name' => 'Profil', 'description' => 'Accès au profil utilisateur'],
        ];
    }
}
