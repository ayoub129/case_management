<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Électronique',
                'description' => 'Produits électroniques et gadgets',
                'color' => '#3B82F6',
            ],
            [
                'name' => 'Vêtements',
                'description' => 'Vêtements et accessoires',
                'color' => '#EF4444',
            ],
            [
                'name' => 'Alimentation',
                'description' => 'Produits alimentaires et boissons',
                'color' => '#10B981',
            ],
            [
                'name' => 'Maison',
                'description' => 'Articles pour la maison et le jardin',
                'color' => '#F59E0B',
            ],
            [
                'name' => 'Sport',
                'description' => 'Équipements et vêtements de sport',
                'color' => '#8B5CF6',
            ],
            [
                'name' => 'Livres',
                'description' => 'Livres et publications',
                'color' => '#06B6D4',
            ],
            [
                'name' => 'Beauté',
                'description' => 'Produits de beauté et cosmétiques',
                'color' => '#EC4899',
            ],
            [
                'name' => 'Automobile',
                'description' => 'Pièces et accessoires automobiles',
                'color' => '#6B7280',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
