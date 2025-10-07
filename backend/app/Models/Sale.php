<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'customer_id',
        'product_id',
        'products',
        'sale_type',
        'quantity',
        'unit_price',
        'total_amount',
        'discount',
        'tax',
        'final_amount',
        'customer_name',
        'customer_email',
        'customer_phone',
        'payment_method',
        'status',
        'sale_date',
        'notes',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'final_amount' => 'decimal:2',
        'sale_date' => 'date',
        'products' => 'array',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get all products for bulk sales
     */
    public function getProductsAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }

    /**
     * Set products for bulk sales
     */
    public function setProductsAttribute($value)
    {
        $this->attributes['products'] = json_encode($value);
    }
}
