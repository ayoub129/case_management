<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    /**
     * Display a listing of purchases
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Purchase::with(['product', 'supplier']);

            // Apply search filter
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('purchase_number', 'like', "%{$search}%")
                      ->orWhere('customer_name', 'like', "%{$search}%")
                      ->orWhereHas('product', function ($productQuery) use ($search) {
                          $productQuery->where('name', 'like', "%{$search}%");
                      })
                      ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                          $supplierQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // Apply supplier filter
            if ($request->filled('supplier_id')) {
                $query->where('supplier_id', $request->supplier_id);
            }

            // Apply status filter
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Apply date filters
            if ($request->filled('start_date')) {
                $query->where('order_date', '>=', $request->start_date);
            }

            if ($request->filled('end_date')) {
                $query->where('order_date', '<=', $request->end_date);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'order_date');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $purchases = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $purchases
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des achats: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created purchase
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'product_id' => 'required|exists:products,id',
                'supplier_id' => 'required|exists:suppliers,id',
                'quantity' => 'required|integer|min:1',
                'unit_cost' => 'required|numeric|min:0',
                'total_cost' => 'required|numeric|min:0',
                'shipping_cost' => 'nullable|numeric|min:0',
                'tax' => 'nullable|numeric|min:0',
                'final_cost' => 'required|numeric|min:0',
                'payment_method' => 'required|string|max:50',
                'status' => 'required|string|max:50',
                'order_date' => 'required|date',
                'expected_delivery_date' => 'nullable|date',
                'notes' => 'nullable|string',
            ]);

            // Generate purchase number
            $purchaseNumber = 'PUR-' . date('Ymd') . '-' . str_pad(Purchase::count() + 1, 4, '0', STR_PAD_LEFT);

            $purchase = Purchase::create([
                ...$request->all(),
                'purchase_number' => $purchaseNumber,
                'products' => null, // Single product purchase
                'purchase_type' => 'single',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Achat créé avec succès',
                'data' => $purchase->load(['product', 'supplier'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified purchase
     */
    public function show($id): JsonResponse
    {
        try {
            $purchase = Purchase::with(['product', 'supplier'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $purchase
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Achat non trouvé'
            ], 404);
        }
    }

    /**
     * Update the specified purchase
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $purchase = Purchase::findOrFail($id);

            $request->validate([
                'product_id' => 'sometimes|required|exists:products,id',
                'supplier_id' => 'sometimes|required|exists:suppliers,id',
                'quantity' => 'sometimes|required|integer|min:1',
                'unit_cost' => 'sometimes|required|numeric|min:0',
                'total_cost' => 'sometimes|required|numeric|min:0',
                'shipping_cost' => 'nullable|numeric|min:0',
                'tax' => 'nullable|numeric|min:0',
                'final_cost' => 'sometimes|required|numeric|min:0',
                'payment_method' => 'sometimes|required|string|max:50',
                'status' => 'sometimes|required|string|max:50',
                'order_date' => 'sometimes|required|date',
                'expected_delivery_date' => 'nullable|date',
                'received_date' => 'nullable|date',
                'notes' => 'nullable|string',
            ]);

            $purchase->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Achat mis à jour avec succès',
                'data' => $purchase->load(['product', 'supplier'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified purchase
     */
    public function destroy($id): JsonResponse
    {
        try {
            $purchase = Purchase::findOrFail($id);
            $purchase->delete();

            return response()->json([
                'success' => true,
                'message' => 'Achat supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Receive a purchase (mark as received)
     */
    public function receive($id): JsonResponse
    {
        try {
            $purchase = Purchase::findOrFail($id);

            if ($purchase->status === 'received') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet achat a déjà été reçu'
                ], 400);
            }

            // Update purchase status
            $purchase->update([
                'status' => 'received',
                'received_date' => now(),
            ]);

            // Update product stock
            $product = Product::find($purchase->product_id);
            if ($product) {
                $product->increment('stock_quantity', $purchase->quantity);
            }

            return response()->json([
                'success' => true,
                'message' => 'Achat reçu avec succès',
                'data' => $purchase->load(['product', 'supplier'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réception: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get purchase reports
     */
    public function reports(Request $request): JsonResponse
    {
        try {
            $startDate = $request->get('start_date', now()->startOfMonth());
            $endDate = $request->get('end_date', now()->endOfMonth());

            $reports = [
                'total_purchases' => Purchase::whereBetween('order_date', [$startDate, $endDate])->count(),
                'total_amount' => Purchase::whereBetween('order_date', [$startDate, $endDate])->sum('final_cost'),
                'pending_purchases' => Purchase::where('status', 'pending')->count(),
                'received_purchases' => Purchase::where('status', 'received')->count(),
                'top_suppliers' => Purchase::with('supplier')
                    ->whereBetween('order_date', [$startDate, $endDate])
                    ->select('supplier_id', DB::raw('COUNT(*) as purchase_count'), DB::raw('SUM(final_cost) as total_spent'))
                    ->groupBy('supplier_id')
                    ->orderBy('total_spent', 'desc')
                    ->limit(5)
                    ->get(),
                'monthly_totals' => Purchase::whereBetween('order_date', [$startDate, $endDate])
                    ->select(DB::raw('DATE_FORMAT(order_date, "%Y-%m") as month'), DB::raw('SUM(final_cost) as total'))
                    ->groupBy('month')
                    ->orderBy('month')
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
     * Export purchases
     */
    public function export(Request $request)
    {
        try {
            $format = $request->get('format', 'pdf');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            $query = Purchase::with(['product', 'supplier']);

            if ($startDate && $endDate) {
                $query->whereBetween('order_date', [$startDate, $endDate]);
            }

            $purchases = $query->orderBy('order_date', 'desc')->get();

            if ($format === 'pdf') {
                return $this->exportToPdf($purchases, $startDate, $endDate);
            } else {
                return $this->exportToExcel($purchases, $startDate, $endDate);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export purchases to PDF
     */
    private function exportToPdf($purchases, $startDate = null, $endDate = null)
    {
        $totalAmount = $purchases->sum('final_cost');
        $totalPurchases = $purchases->count();

        $html = view('exports.purchases-pdf', [
            'purchases' => $purchases,
            'totalAmount' => $totalAmount,
            'totalPurchases' => $totalPurchases,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'generatedAt' => now()->format('d/m/Y H:i:s')
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');

        $filename = 'purchases_report_' . date('Y-m-d_H-i-s') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Export purchases to Excel
     */
    private function exportToExcel($purchases, $startDate = null, $endDate = null)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $sheet->setCellValue('A1', 'Rapport des Achats');
        $sheet->mergeCells('A1:I1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        // Date range
        if ($startDate && $endDate) {
            $sheet->setCellValue('A2', 'Période: ' . date('d/m/Y', strtotime($startDate)) . ' - ' . date('d/m/Y', strtotime($endDate)));
            $sheet->mergeCells('A2:I2');
        }

        // Column headers
        $headers = ['N° Achat', 'Date', 'Fournisseur', 'Produit', 'Quantité', 'Coût Unitaire', 'Frais Livraison', 'Taxe', 'Coût Final', 'Statut'];
        $col = 'A';
        $row = 4;
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $row, $header);
            $sheet->getStyle($col . $row)->getFont()->setBold(true);
            $col++;
        }

        // Data rows
        $row = 5;
        foreach ($purchases as $purchase) {
            $sheet->setCellValue('A' . $row, $purchase->purchase_number);
            $sheet->setCellValue('B' . $row, date('d/m/Y', strtotime($purchase->order_date)));
            $sheet->setCellValue('C' . $row, $purchase->supplier->name ?? 'N/A');
            $sheet->setCellValue('D' . $row, $purchase->product->name ?? 'N/A');
            $sheet->setCellValue('E' . $row, $purchase->quantity);
            $sheet->setCellValue('F' . $row, number_format($purchase->unit_cost, 2));
            $sheet->setCellValue('G' . $row, number_format($purchase->shipping_cost, 2));
            $sheet->setCellValue('H' . $row, number_format($purchase->tax, 2));
            $sheet->setCellValue('I' . $row, number_format($purchase->final_cost, 2));
            $sheet->setCellValue('J' . $row, $purchase->status);
            $row++;
        }

        // Summary
        $row++;
        $sheet->setCellValue('A' . $row, 'Total des Achats:');
        $sheet->setCellValue('B' . $row, $purchases->count());
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);

        $row++;
        $sheet->setCellValue('A' . $row, 'Montant Total:');
        $sheet->setCellValue('B' . $row, number_format($purchases->sum('final_cost'), 2) . ' MAD');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);

        // Auto-size columns
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $filename = 'purchases_report_' . date('Y-m-d_H-i-s') . '.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer->save('php://output');
        exit;
    }

    /**
     * Bulk create purchases
     */
    public function bulkCreate(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'purchases' => 'required|array|min:1',
                'purchases.*.product_id' => 'required|exists:products,id',
                'purchases.*.supplier_id' => 'required|exists:suppliers,id',
                'purchases.*.quantity' => 'required|integer|min:1',
                'purchases.*.unit_cost' => 'required|numeric|min:0',
                'purchases.*.payment_method' => 'required|string|max:50',
                'purchases.*.order_date' => 'required|date',
            ]);

            // Prepare products data
            $products = [];
            $totalFinalCost = 0;

            foreach ($request->purchases as $index => $purchaseData) {
                $product = Product::find($purchaseData['product_id']);
                
                // Calculate amounts
                $totalCost = $purchaseData['unit_cost'] * $purchaseData['quantity'];
                $shippingCost = $purchaseData['shipping_cost'] ?? 0;
                $tax = $purchaseData['tax'] ?? 0;
                $finalCost = $totalCost + $shippingCost + $tax;
                $totalFinalCost += $finalCost;

                $products[] = [
                    'product_id' => $purchaseData['product_id'],
                    'product_name' => $product->name,
                    'quantity' => $purchaseData['quantity'],
                    'unit_cost' => $purchaseData['unit_cost'],
                    'total_cost' => $totalCost,
                    'shipping_cost' => $shippingCost,
                    'tax' => $tax,
                    'final_cost' => $finalCost,
                ];
            }

            // Get supplier info from first purchase
            $firstPurchase = $request->purchases[0];
            $supplier = \App\Models\Supplier::find($firstPurchase['supplier_id']);

            // Generate purchase number
            $purchaseNumber = 'PUR-' . date('Ymd') . '-' . str_pad(Purchase::count() + 1, 4, '0', STR_PAD_LEFT);

            $purchase = Purchase::create([
                'purchase_number' => $purchaseNumber,
                'product_id' => $products[0]['product_id'], // Main product for compatibility
                'products' => $products, // All products as JSON
                'purchase_type' => 'bulk',
                'supplier_id' => $firstPurchase['supplier_id'],
                'quantity' => array_sum(array_column($products, 'quantity')), // Total quantity
                'unit_cost' => $products[0]['unit_cost'], // Main product cost for compatibility
                'total_cost' => array_sum(array_column($products, 'total_cost')), // Total cost
                'shipping_cost' => array_sum(array_column($products, 'shipping_cost')), // Total shipping
                'tax' => array_sum(array_column($products, 'tax')), // Total tax
                'final_cost' => $totalFinalCost, // Total final cost
                'payment_method' => $firstPurchase['payment_method'],
                'status' => 'pending',
                'order_date' => $firstPurchase['order_date'],
                'expected_delivery_date' => $firstPurchase['expected_delivery_date'] ?? null,
                'notes' => $firstPurchase['notes'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Achat en lot créé avec succès',
                'data' => $purchase->load(['product', 'supplier'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création en lot: ' . $e->getMessage()
            ], 500);
        }
    }
}
