<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'loyalty_price',
        'cost_price',
        'barcode',
        'sku',
        'stock_quantity',
        'minimum_stock',
        'category_id',
        'supplier_id',
        'is_active',
        'photo_path',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'loyalty_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'minimum_stock' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = ['photo_url'];

    /**
     * Get the category that owns the product.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the sales for the product.
     */
    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * Get the purchases for the product.
     */
    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * Get the stock alerts for the product.
     */
    public function stockAlerts()
    {
        return $this->hasMany(StockAlert::class);
    }

    /**
     * Get the inventory movements for the product.
     */
    public function inventoryMovements()
    {
        return $this->hasMany(Inventory::class);
    }

    /**
     * Get the photo URL attribute.
     */
    public function getPhotoUrlAttribute()
    {
        if ($this->photo_path) {
            return secure_asset('storage/' . $this->photo_path);
        }
        return secure_asset('images/placeholder.jpg');
    }

    /**
     * Check if product has low stock.
     */
    public function hasLowStock()
    {
        return $this->stock_quantity <= $this->minimum_stock;
    }

    /**
     * Check if product is out of stock.
     */
    public function isOutOfStock()
    {
        return $this->stock_quantity <= 0;
    }
}
