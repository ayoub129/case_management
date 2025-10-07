<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'barcode',
        'address',
        'is_loyalty',
        'loyalty_card_number',
        'loyalty_start_date',
        'loyalty_points',
        'notes',
    ];

    protected $casts = [
        'is_loyalty' => 'boolean',
        'loyalty_start_date' => 'date',
        'loyalty_points' => 'integer',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function getTotalPurchasesAttribute(): int
    {
        return $this->sales()->count();
    }

    public function getTotalSpentAttribute(): float
    {
        return $this->sales()->sum('final_amount');
    }

    public function scopeLoyalty($query)
    {
        return $query->where('is_loyalty', true);
    }

    public function scopeNonLoyalty($query)
    {
        return $query->where('is_loyalty', false);
    }

    public function generateLoyaltyCardNumber(): string
    {
        $prefix = 'LOY';
        $year = date('Y');
        $random = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        return $prefix . $year . $random;
    }

    public function generateBarcode(): string
    {
        $prefix = 'CUST';
        $year = date('Y');
        $random = str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT);
        return $prefix . $year . $random;
    }

    public function addLoyaltyPoints(int $points): void
    {
        $this->increment('loyalty_points', $points);
    }

    public function useLoyaltyPoints(int $points): bool
    {
        if ($this->loyalty_points >= $points) {
            $this->decrement('loyalty_points', $points);
            return true;
        }
        return false;
    }
} 