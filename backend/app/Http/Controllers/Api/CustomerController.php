<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Customer::query();

            // Apply search filter
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('loyalty_card_number', 'like', "%{$search}%");
                });
            }

            // Apply loyalty filter
            if ($request->filled('loyalty')) {
                if ($request->loyalty === 'true') {
                    $query->loyalty();
                } else {
                    $query->nonLoyalty();
                }
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'name');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            $customers = $query->withCount('sales')->withSum('sales', 'final_amount')->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $customers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des clients: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created customer
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|unique:customers,email',
                'phone' => 'nullable|string|max:20',
                'barcode' => 'nullable|string|unique:customers,barcode',
                'is_loyalty' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            
            // Clean up empty email, phone, and barcode
            if (empty($data['email'])) {
                $data['email'] = null;
            }
            if (empty($data['phone'])) {
                $data['phone'] = null;
            }
            if (empty($data['barcode'])) {
                $data['barcode'] = null;
            }

            // Generate barcode if not provided
            if (empty($data['barcode'])) {
                $customer = new Customer();
                $data['barcode'] = $customer->generateBarcode();
            }

            // Generate loyalty card number if loyalty is enabled
            if ($data['is_loyalty']) {
                $customer = new Customer();
                $data['loyalty_card_number'] = $customer->generateLoyaltyCardNumber();
                $data['loyalty_start_date'] = now();
                $data['loyalty_points'] = 0;
            }

            $customer = Customer::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Client créé avec succès',
                'data' => $customer->load('sales')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified customer
     */
    public function show($id): JsonResponse
    {
        try {
            $customer = Customer::with(['sales.product'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $customer
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Client non trouvé'
            ], 404);
        }
    }

    /**
     * Update the specified customer
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $customer = Customer::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'nullable|email|unique:customers,email,' . $id,
                'phone' => 'nullable|string|max:20',
                'barcode' => 'nullable|string|unique:customers,barcode,' . $id,
                'is_loyalty' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            
            // Clean up empty email, phone, and barcode
            if (empty($data['email'])) {
                $data['email'] = null;
            }
            if (empty($data['phone'])) {
                $data['phone'] = null;
            }
            if (empty($data['barcode'])) {
                $data['barcode'] = null;
            }

            // Handle loyalty card number generation
            if ($data['is_loyalty'] && !$customer->loyalty_card_number) {
                $data['loyalty_card_number'] = $customer->generateLoyaltyCardNumber();
                $data['loyalty_start_date'] = now();
            }

            $customer->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Client mis à jour avec succès',
                'data' => $customer->load('sales')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified customer
     */
    public function destroy($id): JsonResponse
    {
        try {
            $customer = Customer::findOrFail($id);

            // Check if customer has sales
            if ($customer->sales()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce client car il a des ventes associées'
                ], 400);
            }

            $customer->delete();

            return response()->json([
                'success' => true,
                'message' => 'Client supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle loyalty status
     */
    public function toggleLoyalty($id): JsonResponse
    {
        try {
            $customer = Customer::findOrFail($id);
            
            $customer->is_loyalty = !$customer->is_loyalty;
            
            if ($customer->is_loyalty && !$customer->loyalty_card_number) {
                $customer->loyalty_card_number = $customer->generateLoyaltyCardNumber();
                $customer->loyalty_start_date = now();
            }
            
            $customer->save();

            return response()->json([
                'success' => true,
                'message' => 'Statut de fidélité mis à jour avec succès',
                'data' => $customer
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add loyalty points
     */
    public function addPoints(Request $request, $id): JsonResponse
    {
        try {
            $request->validate([
                'points' => 'required|integer|min:1'
            ]);

            $customer = Customer::findOrFail($id);
            $customer->addLoyaltyPoints($request->points);

            return response()->json([
                'success' => true,
                'message' => 'Points ajoutés avec succès',
                'data' => $customer->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout des points: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Find customer by barcode
     */
    public function findByBarcode($barcode): JsonResponse
    {
        try {
            $customer = Customer::where('barcode', $barcode)->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client non trouvé pour ce code-barres'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $customer
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la recherche: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_customers' => Customer::count(),
                'loyalty_customers' => Customer::loyalty()->count(),
                'non_loyalty_customers' => Customer::nonLoyalty()->count(),
                'total_loyalty_points' => Customer::loyalty()->sum('loyalty_points'),
                'top_customers' => Customer::withCount('sales')
                    ->withSum('sales', 'final_amount')
                    ->orderBy('sales_sum_final_amount', 'desc')
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
