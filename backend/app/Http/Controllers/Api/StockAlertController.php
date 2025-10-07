<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockAlert;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StockAlertController extends Controller
{
    /**
     * Display stock alerts overview
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Product::with('category')
                ->select('id', 'name', 'category_id', 'stock_quantity', 'minimum_stock', 'price')
                ->where(function ($q) {
                    $q->where('stock_quantity', '<=', DB::raw('minimum_stock'))
                      ->orWhere('stock_quantity', 0);
                });

            // Apply search filter
            if ($request->filled('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            // Apply category filter
            if ($request->filled('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Apply status filter
            if ($request->filled('status')) {
                switch ($request->status) {
                    case 'critical':
                        $query->where('stock_quantity', 0);
                        break;
                    case 'low':
                        $query->where('stock_quantity', '>', 0)
                              ->where('stock_quantity', '<=', DB::raw('minimum_stock'));
                        break;
                    case 'normal':
                        $query->where('stock_quantity', '>', DB::raw('minimum_stock'));
                        break;
                }
            }

            $products = $query->orderBy('stock_quantity', 'asc')
                             ->paginate($request->get('per_page', 15));

            // Calculate statistics
            $stats = [
                'critical' => Product::where('stock_quantity', 0)->count(),
                'low' => Product::where('stock_quantity', '>', 0)
                               ->where('stock_quantity', '<=', DB::raw('minimum_stock'))
                               ->count(),
                'normal' => Product::where('stock_quantity', '>', DB::raw('minimum_stock'))->count(),
                'total' => Product::count(),
            ];

            // Transform products to include status
            $products->getCollection()->transform(function ($product) {
                $product->status = $this->getStockStatus($product->stock_quantity, $product->minimum_stock);
                return $product;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'products' => $products,
                    'statistics' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des alertes de stock: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active stock alerts
     */
    public function active(Request $request): JsonResponse
    {
        try {
            $activeAlerts = Product::with('category')
                ->where(function ($q) {
                    $q->where('stock_quantity', '<=', DB::raw('minimum_stock'))
                      ->orWhere('stock_quantity', 0);
                })
                ->orderBy('stock_quantity', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($product) {
                    $product->status = $this->getStockStatus($product->stock_quantity, $product->minimum_stock);
                    return $product;
                });

            return response()->json([
                'success' => true,
                'data' => $activeAlerts
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des alertes actives: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resolve a stock alert
     */
    public function resolve(Request $request, $id): JsonResponse
    {
        try {
            $product = Product::findOrFail($id);
            
            // Update the product's minimum stock to resolve the alert
            $product->update([
                'minimum_stock' => $product->stock_quantity - 1
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Alerte de stock résolue avec succès',
                'data' => $product->load('category')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la résolution de l\'alerte: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check for new stock alerts
     */
    public function checkAlerts(Request $request): JsonResponse
    {
        try {
            $alerts = Product::with('category')
                ->where(function ($q) {
                    $q->where('stock_quantity', '<=', DB::raw('minimum_stock'))
                      ->orWhere('stock_quantity', 0);
                })
                ->get()
                ->map(function ($product) {
                    $product->status = $this->getStockStatus($product->stock_quantity, $product->minimum_stock);
                    return $product;
                });

            $criticalCount = $alerts->where('status', 'critical')->count();
            $lowCount = $alerts->where('status', 'low')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'alerts' => $alerts,
                    'summary' => [
                        'critical' => $criticalCount,
                        'low' => $lowCount,
                        'total' => $alerts->count()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification des alertes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'product_id' => 'required|exists:products,id',
                'alert_type' => 'required|in:low_stock,out_of_stock',
                'threshold_stock' => 'required|integer|min:0',
                'priority' => 'required|in:low,medium,high',
                'notes' => 'nullable|string',
            ]);

            $stockAlert = StockAlert::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Alerte de stock créée avec succès',
                'data' => $stockAlert->load('product')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id): JsonResponse
    {
        try {
            $stockAlert = StockAlert::with('product.category')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $stockAlert
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Alerte de stock non trouvée'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $stockAlert = StockAlert::findOrFail($id);
            
            $request->validate([
                'alert_type' => 'sometimes|in:low_stock,out_of_stock',
                'threshold_stock' => 'sometimes|integer|min:0',
                'priority' => 'sometimes|in:low,medium,high',
                'notes' => 'nullable|string',
            ]);

            $stockAlert->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Alerte de stock mise à jour avec succès',
                'data' => $stockAlert->load('product')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $stockAlert = StockAlert::findOrFail($id);
            $stockAlert->delete();

            return response()->json([
                'success' => true,
                'message' => 'Alerte de stock supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stock status based on current and minimum stock
     */
    private function getStockStatus(int $currentStock, int $minimumStock): string
    {
        if ($currentStock === 0) {
            return 'critical';
        } elseif ($currentStock <= $minimumStock) {
            return 'low';
        } else {
            return 'normal';
        }
    }
}
