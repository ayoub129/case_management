<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    /**
     * Display a listing of suppliers
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Supplier::withCount('purchases as orders_count')
                ->withSum('purchases as total_spent', 'final_cost');

            // Apply search filter
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('contact_person', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Apply status filter
            if ($request->filled('status')) {
                if ($request->status === 'active') {
                    $query->where('is_active', true);
                } elseif ($request->status === 'inactive') {
                    $query->where('is_active', false);
                }
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'name');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            $suppliers = $query->paginate($request->get('per_page', 15));

            // Calculate statistics
            $stats = [
                'total' => Supplier::count(),
                'active' => Supplier::where('is_active', true)->count(),
                'inactive' => Supplier::where('is_active', false)->count(),
                'total_orders' => Purchase::count(),
                'total_spent' => Purchase::sum('final_cost'),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'suppliers' => $suppliers,
                    'statistics' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des fournisseurs: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created supplier
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'contact_person' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'city' => 'nullable|string|max:255',
                'country' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'notes' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $supplier = Supplier::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Fournisseur créé avec succès',
                'data' => $supplier
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified supplier
     */
    public function show($id): JsonResponse
    {
        try {
            $supplier = Supplier::withCount('purchases as orders_count')
                ->withSum('purchases as total_spent', 'final_cost')
                ->with(['purchases' => function ($query) {
                    $query->orderBy('order_date', 'desc')->limit(10);
                }])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $supplier
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Fournisseur non trouvé'
            ], 404);
        }
    }

    /**
     * Update the specified supplier
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $supplier = Supplier::findOrFail($id);

            $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'contact_person' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'city' => 'nullable|string|max:255',
                'country' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:20',
                'notes' => 'nullable|string',
                'is_active' => 'boolean',
            ]);

            $supplier->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Fournisseur mis à jour avec succès',
                'data' => $supplier
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified supplier
     */
    public function destroy($id): JsonResponse
    {
        try {
            $supplier = Supplier::findOrFail($id);

            // Check if supplier has any purchases
            if ($supplier->purchases()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce fournisseur car il a des commandes associées'
                ], 400);
            }

            $supplier->delete();

            return response()->json([
                'success' => true,
                'message' => 'Fournisseur supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get products supplied by a specific supplier
     */
    public function getProducts($id): JsonResponse
    {
        try {
            $supplier = Supplier::findOrFail($id);
            $products = $supplier->products()->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $products
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des produits: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get purchase history for a specific supplier
     */
    public function getPurchaseHistory($id): JsonResponse
    {
        try {
            $supplier = Supplier::findOrFail($id);
            $purchases = $supplier->purchases()
                ->with('product')
                ->orderBy('order_date', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $purchases
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de l\'historique: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle supplier active status
     */
    public function toggleStatus($id): JsonResponse
    {
        try {
            $supplier = Supplier::findOrFail($id);
            $supplier->update(['is_active' => !$supplier->is_active]);

            $status = $supplier->is_active ? 'activé' : 'désactivé';

            return response()->json([
                'success' => true,
                'message' => "Fournisseur {$status} avec succès",
                'data' => $supplier
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get supplier statistics
     */
    public function getStatistics(): JsonResponse
    {
        try {
            $stats = [
                'total_suppliers' => Supplier::count(),
                'active_suppliers' => Supplier::where('is_active', true)->count(),
                'inactive_suppliers' => Supplier::where('is_active', false)->count(),
                'total_orders' => Purchase::count(),
                'total_spent' => Purchase::sum('final_cost'),
                'top_suppliers' => Supplier::withCount('purchases')
                    ->withSum('purchases as total_spent', 'final_cost')
                    ->orderBy('purchases_count', 'desc')
                    ->limit(5)
                    ->get(),
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
}
