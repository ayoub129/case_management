<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_number',
        'product_id',
        'products',
        'purchase_type',
        'supplier_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'shipping_cost',
        'tax',
        'final_cost',
        'payment_method',
        'status',
        'order_date',
        'expected_delivery_date',
        'received_date',
        'notes',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'tax' => 'decimal:2',
        'final_cost' => 'decimal:2',
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'received_date' => 'date',
        'products' => 'array',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get all products for bulk purchases
     */
    public function getProductsAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }

    /**
     * Set products for bulk purchases
     */
    public function setProductsAttribute($value)
    {
        $this->attributes['products'] = json_encode($value);
    }
}
