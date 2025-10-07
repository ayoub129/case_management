<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'alert_type',
        'current_stock',
        'threshold_stock',
        'priority',
        'is_resolved',
        'resolved_at',
        'notes',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'threshold_stock' => 'integer',
        'is_resolved' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
