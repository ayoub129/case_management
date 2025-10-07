<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\CashTransaction;
use App\Models\StockAlert;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get dashboard daily statistics with comparisons
     */
    public function getDailyStats(): JsonResponse
    {
        try {
            $today = Carbon::today();
            $yesterday = Carbon::yesterday();

            // Get today's cash income
            $cashToday = CashTransaction::where('type', 'income')
                ->whereDate('transaction_date', $today)
                ->sum('amount');

            // Get yesterday's cash income
            $cashYesterday = CashTransaction::where('type', 'income')
                ->whereDate('transaction_date', $yesterday)
                ->sum('amount');

            // Get today's sales count
            $salesToday = Sale::whereDate('sale_date', $today)->count();

            // Get yesterday's sales count
            $salesYesterday = Sale::whereDate('sale_date', $yesterday)->count();

            // Get total products count
            $totalProducts = Product::count();

            // Get stock alerts count (active alerts)
            $stockAlertsToday = Product::where('stock_quantity', '<=', \DB::raw('minimum_stock'))
                ->where('stock_quantity', '>', 0)
                ->count() + Product::where('stock_quantity', '=', 0)->count();

            // For yesterday's stock alerts, we'll use the same count since product stock doesn't change drastically
            $stockAlertsYesterday = $stockAlertsToday;

            return response()->json([
                'success' => true,
                'data' => [
                    'cashToday' => (float) $cashToday,
                    'cashYesterday' => (float) $cashYesterday,
                    'salesToday' => $salesToday,
                    'salesYesterday' => $salesYesterday,
                    'totalProducts' => $totalProducts,
                    'totalProductsYesterday' => $totalProducts, // Products count rarely changes daily
                    'stockAlertsToday' => $stockAlertsToday,
                    'stockAlertsYesterday' => $stockAlertsYesterday,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get general dashboard statistics
     */
    public function getStats(): JsonResponse
    {
        try {
            // Calculate cash statistics
            $totalIncome = CashTransaction::where('type', 'income')->sum('amount');
            $totalExpenses = CashTransaction::where('type', 'expense')->sum('amount');
            $currentBalance = $totalIncome - $totalExpenses;
            
            $stats = [
                'total_products' => Product::count(),
                'total_sales' => Sale::count(),
                'total_revenue' => Sale::sum('final_amount'),
                'total_income' => $totalIncome,
                'total_expenses' => $totalExpenses,
                'current_balance' => $currentBalance,
                'low_stock_products' => Product::where('stock_quantity', '<=', \DB::raw('minimum_stock'))
                    ->where('stock_quantity', '>', 0)->count(),
                'out_of_stock_products' => Product::where('stock_quantity', '=', 0)->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent activities
     */
    public function getRecentActivities(): JsonResponse
    {
        try {
            $activities = [];

            // Recent sales
            $recentSales = Sale::with('product')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($sale) {
                    return [
                        'id' => $sale->id,
                        'type' => 'sale',
                        'description' => 'Vente: ' . ($sale->product->name ?? 'Produit supprimé'),
                        'amount' => number_format($sale->final_amount, 2) . ' MAD',
                        'created_at' => $sale->created_at->toISOString(),
                        'status' => $sale->status ?? 'completed'
                    ];
                });

            // Recent cash transactions
            $recentCash = CashTransaction::orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'type' => 'cash',
                        'description' => ucfirst($transaction->type) . ': ' . $transaction->description,
                        'amount' => number_format($transaction->amount, 2) . ' MAD',
                        'created_at' => $transaction->created_at->toISOString(),
                        'status' => 'completed'
                    ];
                });

            // Combine and sort by date
            $activities = $recentSales->concat($recentCash)
                ->sortByDesc('created_at')
                ->take(10)
                ->values();

            return response()->json([
                'success' => true,
                'data' => $activities
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des activités: ' . $e->getMessage()
            ], 500);
        }
    }
}