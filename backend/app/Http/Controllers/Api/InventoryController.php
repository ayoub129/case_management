<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Barryvdh\DomPDF\Facade\Pdf;

class InventoryController extends Controller
{
    /**
     * Display inventory overview and statistics
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get inventory statistics by category
            $inventoryStats = Category::with(['products' => function ($query) {
                $query->select('id', 'category_id', 'name', 'stock_quantity', 'price', 'minimum_stock');
            }])
            ->get()
            ->map(function ($category) {
                $products = $category->products;
                $totalItems = $products->count();
                $totalValue = $products->sum(function ($product) {
                    return $product->stock_quantity * $product->price;
                });
                $lowStock = $products->where('stock_quantity', '<=', DB::raw('minimum_stock'))->count();

                return [
                    'category' => $category->name,
                    'totalItems' => $totalItems,
                    'totalValue' => round($totalValue, 2),
                    'lowStock' => $lowStock,
                ];
            })
            ->filter(function ($stat) {
                return $stat['totalItems'] > 0; // Only show categories with products
            })
            ->values();

            // Calculate overall statistics
            $totalValue = $inventoryStats->sum('totalValue');
            $totalItems = $inventoryStats->sum('totalItems');
            $totalLowStock = $inventoryStats->sum('lowStock');

            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => $inventoryStats,
                    'summary' => [
                        'totalValue' => $totalValue,
                        'totalItems' => $totalItems,
                        'totalLowStock' => $totalLowStock,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de l\'inventaire: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inventory movements
     */
    public function movements(Request $request): JsonResponse
    {
        try {
            $query = Inventory::with('product.category')
                ->orderBy('movement_date', 'desc');

            // Apply filters
            if ($request->filled('product_id')) {
                $query->where('product_id', $request->product_id);
            }

            if ($request->filled('movement_type')) {
                $query->where('movement_type', $request->movement_type);
            }

            if ($request->filled('start_date')) {
                $query->where('movement_date', '>=', $request->start_date);
            }

            if ($request->filled('end_date')) {
                $query->where('movement_date', '<=', $request->end_date);
            }

            $movements = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $movements
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des mouvements: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inventory reports
     */
    public function reports(Request $request): JsonResponse
    {
        try {
            $reports = [
                'low_stock_products' => Product::where('stock_quantity', '<=', DB::raw('minimum_stock'))
                    ->with('category')
                    ->get(),
                'out_of_stock_products' => Product::where('stock_quantity', 0)
                    ->with('category')
                    ->get(),
                'category_summary' => Category::withCount('products')
                    ->withSum('products', 'stock_quantity')
                    ->get(),
                'recent_movements' => Inventory::with('product')
                    ->orderBy('movement_date', 'desc')
                    ->limit(10)
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data' => $reports
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des rapports: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export inventory data
     */
    public function export(Request $request): JsonResponse
    {
        try {
            $format = $request->get('format', 'excel');
            $type = $request->get('type', 'overview');

            if ($format === 'excel') {
                return $this->exportToExcel($type);
            } else {
                return $this->exportToPdf($type);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create inventory adjustment
     */
    public function adjustment(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'product_id' => 'required|exists:products,id',
                'quantity' => 'required|integer',
                'reason' => 'required|string|max:255',
                'movement_date' => 'required|date',
                'notes' => 'nullable|string',
            ]);

            $product = Product::findOrFail($request->product_id);
            $previousStock = $product->stock_quantity;
            $newStock = $previousStock + $request->quantity;

            // Create inventory movement record
            $inventory = Inventory::create([
                'product_id' => $request->product_id,
                'movement_type' => $request->quantity > 0 ? 'adjustment_in' : 'adjustment_out',
                'quantity' => abs($request->quantity),
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reference' => 'ADJUSTMENT',
                'reference_type' => 'manual',
                'reason' => $request->reason,
                'movement_date' => $request->movement_date,
                'notes' => $request->notes,
            ]);

            // Update product stock
            $product->update(['stock_quantity' => $newStock]);

            return response()->json([
                'success' => true,
                'message' => 'Ajustement d\'inventaire créé avec succès',
                'data' => $inventory->load('product')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajustement: ' . $e->getMessage()
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
                'movement_type' => 'required|in:in,out,adjustment_in,adjustment_out',
                'quantity' => 'required|integer|min:1',
                'reference' => 'nullable|string|max:255',
                'reference_type' => 'nullable|string|max:255',
                'reason' => 'nullable|string|max:255',
                'movement_date' => 'required|date',
                'notes' => 'nullable|string',
            ]);

            $product = Product::findOrFail($request->product_id);
            $previousStock = $product->stock_quantity;
            
            // Calculate new stock based on movement type
            $newStock = $previousStock;
            if (in_array($request->movement_type, ['in', 'adjustment_in'])) {
                $newStock += $request->quantity;
            } else {
                $newStock -= $request->quantity;
            }

            // Validate stock can't go negative
            if ($newStock < 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le stock ne peut pas être négatif'
                ], 400);
            }

            $inventory = Inventory::create([
                'product_id' => $request->product_id,
                'movement_type' => $request->movement_type,
                'quantity' => $request->quantity,
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'reference' => $request->reference,
                'reference_type' => $request->reference_type,
                'reason' => $request->reason,
                'movement_date' => $request->movement_date,
                'notes' => $request->notes,
            ]);

            // Update product stock
            $product->update(['stock_quantity' => $newStock]);

            return response()->json([
                'success' => true,
                'message' => 'Mouvement d\'inventaire créé avec succès',
                'data' => $inventory->load('product')
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
            $inventory = Inventory::with('product.category')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $inventory
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Mouvement d\'inventaire non trouvé'
            ], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $inventory = Inventory::findOrFail($id);
            
            $request->validate([
                'notes' => 'nullable|string',
                'reason' => 'nullable|string|max:255',
            ]);

            $inventory->update($request->only(['notes', 'reason']));

            return response()->json([
                'success' => true,
                'message' => 'Mouvement d\'inventaire mis à jour avec succès',
                'data' => $inventory->load('product')
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
            $inventory = Inventory::findOrFail($id);
            $inventory->delete();

            return response()->json([
                'success' => true,
                'message' => 'Mouvement d\'inventaire supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export to Excel
     */
    private function exportToExcel(string $type): JsonResponse
    {
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            if ($type === 'overview') {
                $this->generateExcelOverview($sheet);
            } else {
                $this->generateExcelMovements($sheet);
            }

            $writer = new Xlsx($spreadsheet);
            $filename = 'inventory_' . $type . '_' . date('Y-m-d_H-i-s') . '.xlsx';
            $path = storage_path('app/public/exports/' . $filename);
            
            // Ensure directory exists
            if (!file_exists(dirname($path))) {
                mkdir(dirname($path), 0755, true);
            }
            
            $writer->save($path);

            return response()->json([
                'success' => true,
                'message' => 'Export Excel généré avec succès',
                'data' => [
                    'filename' => $filename,
                    'download_url' => url('storage/exports/' . $filename)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export Excel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export to PDF
     */
    private function exportToPdf(string $type): JsonResponse
    {
        try {
            if ($type === 'overview') {
                $data = $this->getOverviewData();
                $view = 'exports.inventory-overview';
            } else {
                $data = $this->getMovementsData();
                $view = 'exports.inventory-movements';
            }

            $pdf = PDF::loadView($view, $data);
            $filename = 'inventory_' . $type . '_' . date('Y-m-d_H-i-s') . '.pdf';
            $path = storage_path('app/public/exports/' . $filename);
            
            // Ensure directory exists
            if (!file_exists(dirname($path))) {
                mkdir(dirname($path), 0755, true);
            }
            
            $pdf->save($path);

            return response()->json([
                'success' => true,
                'message' => 'Export PDF généré avec succès',
                'data' => [
                    'filename' => $filename,
                    'download_url' => url('storage/exports/' . $filename)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export PDF: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate Excel overview sheet
     */
    private function generateExcelOverview($sheet): void
    {
        $sheet->setCellValue('A1', 'Rapport d\'Inventaire - ' . date('d/m/Y'));
        $sheet->setCellValue('A3', 'Catégorie');
        $sheet->setCellValue('B3', 'Nombre d\'articles');
        $sheet->setCellValue('C3', 'Valeur totale (DH)');
        $sheet->setCellValue('D3', 'Stock faible');

        $stats = Category::with(['products' => function ($query) {
            $query->select('id', 'category_id', 'name', 'stock_quantity', 'price', 'minimum_stock');
        }])
        ->get()
        ->map(function ($category) {
            $products = $category->products;
            return [
                'category' => $category->name,
                'totalItems' => $products->count(),
                'totalValue' => $products->sum(function ($product) {
                    return $product->stock_quantity * $product->price;
                }),
                'lowStock' => $products->where('stock_quantity', '<=', DB::raw('minimum_stock'))->count(),
            ];
        })
        ->filter(function ($stat) {
            return $stat['totalItems'] > 0;
        });

        $row = 4;
        foreach ($stats as $stat) {
            $sheet->setCellValue('A' . $row, $stat['category']);
            $sheet->setCellValue('B' . $row, $stat['totalItems']);
            $sheet->setCellValue('C' . $row, number_format($stat['totalValue'], 2));
            $sheet->setCellValue('D' . $row, $stat['lowStock']);
            $row++;
        }
    }

    /**
     * Generate Excel movements sheet
     */
    private function generateExcelMovements($sheet): void
    {
        $sheet->setCellValue('A1', 'Mouvements d\'Inventaire - ' . date('d/m/Y'));
        $sheet->setCellValue('A3', 'Date');
        $sheet->setCellValue('B3', 'Produit');
        $sheet->setCellValue('C3', 'Type');
        $sheet->setCellValue('D3', 'Quantité');
        $sheet->setCellValue('E3', 'Stock précédent');
        $sheet->setCellValue('F3', 'Nouveau stock');
        $sheet->setCellValue('G3', 'Raison');

        $movements = Inventory::with('product')
            ->orderBy('movement_date', 'desc')
            ->get();

        $row = 4;
        foreach ($movements as $movement) {
            $sheet->setCellValue('A' . $row, $movement->movement_date->format('d/m/Y'));
            $sheet->setCellValue('B' . $row, $movement->product->name);
            $sheet->setCellValue('C' . $row, $movement->movement_type);
            $sheet->setCellValue('D' . $row, $movement->quantity);
            $sheet->setCellValue('E' . $row, $movement->previous_stock);
            $sheet->setCellValue('F' . $row, $movement->new_stock);
            $sheet->setCellValue('G' . $row, $movement->reason);
            $row++;
        }
    }

    /**
     * Get overview data for PDF
     */
    private function getOverviewData(): array
    {
        return [
            'date' => date('d/m/Y'),
            'stats' => Category::with(['products' => function ($query) {
                $query->select('id', 'category_id', 'name', 'stock_quantity', 'price', 'minimum_stock');
            }])
            ->get()
            ->map(function ($category) {
                $products = $category->products;
                return [
                    'category' => $category->name,
                    'totalItems' => $products->count(),
                    'totalValue' => $products->sum(function ($product) {
                        return $product->stock_quantity * $product->price;
                    }),
                    'lowStock' => $products->where('stock_quantity', '<=', DB::raw('minimum_stock'))->count(),
                ];
            })
            ->filter(function ($stat) {
                return $stat['totalItems'] > 0;
            })
        ];
    }

    /**
     * Get movements data for PDF
     */
    private function getMovementsData(): array
    {
        return [
            'date' => date('d/m/Y'),
            'movements' => Inventory::with('product')
                ->orderBy('movement_date', 'desc')
                ->get()
        ];
    }
}
