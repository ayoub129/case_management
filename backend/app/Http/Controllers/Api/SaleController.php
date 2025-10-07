<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    /**
     * Generate a unique invoice number
     */
    private function generateUniqueInvoiceNumber(): string
    {
        $date = date('Ymd');
        $prefix = 'INV-' . $date . '-';
        
        // Get the highest invoice number for today
        $lastInvoice = Sale::where('invoice_number', 'like', $prefix . '%')
            ->orderBy('invoice_number', 'desc')
            ->first();
        
        if ($lastInvoice) {
            // Extract the number part and increment
            $lastNumber = (int) substr($lastInvoice->invoice_number, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            // First invoice of the day
            $nextNumber = 1;
        }
        
        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
    /**
     * Display a listing of sales
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Sale::with(['product']);

            // Apply search filter
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                      ->orWhere('customer_name', 'like', "%{$search}%")
                      ->orWhere('customer_email', 'like', "%{$search}%")
                      ->orWhere('customer_phone', 'like', "%{$search}%")
                      ->orWhereHas('product', function ($productQuery) use ($search) {
                          $productQuery->where('name', 'like', "%{$search}%");
                      });
                });
            }

            // Apply status filter
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Apply date filters
            if ($request->filled('start_date')) {
                $query->where('sale_date', '>=', $request->start_date);
            }

            if ($request->filled('end_date')) {
                $query->where('sale_date', '<=', $request->end_date);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'sale_date');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $sales = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
                'data' => $sales
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des ventes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created sale
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'customer_id' => 'nullable|exists:customers,id',
                'product_id' => 'required|exists:products,id',
                'quantity' => 'required|integer|min:1',
                'unit_price' => 'required|numeric|min:0',
                'total_amount' => 'required|numeric|min:0',
                'discount' => 'nullable|numeric|min:0',
                'tax' => 'nullable|numeric|min:0',
                'final_amount' => 'required|numeric|min:0',
                'customer_name' => 'required|string|max:255',
                'customer_email' => 'nullable|email',
                'customer_phone' => 'nullable|string|max:20',
                'payment_method' => 'required|string|max:50',
                'status' => 'required|string|max:50',
                'sale_date' => 'required|date',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check product stock
            $product = Product::find($request->product_id);
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produit non trouvé'
                ], 404);
            }

            if ($product->stock_quantity < $request->quantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock insuffisant. Stock disponible: ' . $product->stock_quantity
                ], 400);
            }

            // Handle customer loyalty pricing
            $unitPrice = $request->unit_price;
            $totalAmount = $request->total_amount;
            $finalAmount = $request->final_amount;

            if ($request->customer_id) {
                $customer = \App\Models\Customer::find($request->customer_id);
                if ($customer && $customer->is_loyalty && $product->loyalty_price) {
                    // Use loyalty price instead of regular price
                    $unitPrice = $product->loyalty_price;
                    $totalAmount = $unitPrice * $request->quantity;
                    $discount = $request->discount ?? 0;
                    $tax = $request->tax ?? 0;
                    $finalAmount = $totalAmount - $discount + $tax;

                    // Add loyalty points (1 point per MAD spent)
                    $pointsToAdd = (int)($finalAmount);
                    $customer->addLoyaltyPoints($pointsToAdd);
                }
            }

            // Generate unique invoice number
            $invoiceNumber = $this->generateUniqueInvoiceNumber();

            $sale = Sale::create([
                'invoice_number' => $invoiceNumber,
                'customer_id' => $request->customer_id,
                'product_id' => $request->product_id,
                'products' => null, // Single product sale
                'sale_type' => 'single',
                'quantity' => $request->quantity,
                'unit_price' => $unitPrice,
                'total_amount' => $totalAmount,
                'discount' => $request->discount ?? 0,
                'tax' => $request->tax ?? 0,
                'final_amount' => $finalAmount,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'payment_method' => $request->payment_method,
                'status' => $request->status,
                'sale_date' => $request->sale_date,
                'notes' => $request->notes,
            ]);

            // Update product stock
            $product->decrement('stock_quantity', $request->quantity);

            return response()->json([
                'success' => true,
                'message' => 'Vente créée avec succès',
                'data' => $sale->load(['product', 'customer'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified sale
     */
    public function show($id): JsonResponse
    {
        try {
            $sale = Sale::with('product')->findOrFail($id);

        return response()->json([
            'success' => true,
                'data' => $sale
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vente non trouvée'
            ], 404);
        }
    }

    /**
     * Update the specified sale
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $sale = Sale::findOrFail($id);

        $validator = Validator::make($request->all(), [
                'product_id' => 'sometimes|required|exists:products,id',
                'quantity' => 'sometimes|required|integer|min:1',
                'unit_price' => 'sometimes|required|numeric|min:0',
                'total_amount' => 'sometimes|required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
                'final_amount' => 'sometimes|required|numeric|min:0',
                'customer_name' => 'sometimes|required|string|max:255',
            'customer_email' => 'nullable|email',
            'customer_phone' => 'nullable|string|max:20',
                'payment_method' => 'sometimes|required|string|max:50',
                'status' => 'sometimes|required|string|max:50',
                'sale_date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                    'message' => 'Erreurs de validation',
                'errors' => $validator->errors()
            ], 422);
        }

            // Handle stock adjustment if quantity changed
            if ($request->has('quantity') && $request->quantity != $sale->quantity) {
                $product = Product::find($sale->product_id);
                if ($product) {
                    // Restore old quantity
                    $product->increment('stock_quantity', $sale->quantity);
                    // Deduct new quantity
                    $product->decrement('stock_quantity', $request->quantity);
                }
            }

        $sale->update($request->all());

        return response()->json([
            'success' => true,
                'message' => 'Vente mise à jour avec succès',
                'data' => $sale->load('product')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified sale
     */
    public function destroy($id): JsonResponse
    {
        try {
            $sale = Sale::findOrFail($id);

            // Restore product stock
            $product = Product::find($sale->product_id);
            if ($product) {
                $product->increment('stock_quantity', $sale->quantity);
            }

        $sale->delete();

        return response()->json([
            'success' => true,
                'message' => 'Vente supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sales reports
     */
    public function reports(Request $request): JsonResponse
    {
        try {
            $startDate = $request->get('start_date', now()->startOfMonth());
            $endDate = $request->get('end_date', now()->endOfMonth());

            $reports = [
                'total_sales' => Sale::whereBetween('sale_date', [$startDate, $endDate])->count(),
                'total_revenue' => Sale::whereBetween('sale_date', [$startDate, $endDate])->sum('final_amount'),
                'total_discounts' => Sale::whereBetween('sale_date', [$startDate, $endDate])->sum('discount'),
                'total_taxes' => Sale::whereBetween('sale_date', [$startDate, $endDate])->sum('tax'),
                'completed_sales' => Sale::where('status', 'completed')->count(),
                'pending_sales' => Sale::where('status', 'pending')->count(),
                'top_products' => Sale::with('product')
                    ->whereBetween('sale_date', [$startDate, $endDate])
                    ->select('product_id', DB::raw('COUNT(*) as sale_count'), DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(final_amount) as total_revenue'))
                    ->groupBy('product_id')
                    ->orderBy('total_revenue', 'desc')
                    ->limit(5)
                    ->get(),
                'monthly_totals' => Sale::whereBetween('sale_date', [$startDate, $endDate])
                    ->select(DB::raw('DATE_FORMAT(sale_date, "%Y-%m") as month'), DB::raw('SUM(final_amount) as total'))
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
     * Export sales
     */
    public function export(Request $request)
    {
        try {
            $format = $request->get('format', 'pdf');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = Sale::with('product');

            if ($startDate && $endDate) {
                $query->whereBetween('sale_date', [$startDate, $endDate]);
        }

        $sales = $query->orderBy('sale_date', 'desc')->get();

            if ($format === 'pdf') {
                return $this->exportToPdf($sales, $startDate, $endDate);
            } else {
                return $this->exportToExcel($sales, $startDate, $endDate);
            }

        } catch (\Exception $e) {
        return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export sales to PDF
     */
    private function exportToPdf($sales, $startDate = null, $endDate = null)
    {
        $totalAmount = $sales->sum('final_amount');
        $totalSales = $sales->count();

        $html = view('exports.sales-pdf', [
                'sales' => $sales,
            'totalAmount' => $totalAmount,
            'totalSales' => $totalSales,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'generatedAt' => now()->format('d/m/Y H:i:s')
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');

        $filename = 'sales_report_' . date('Y-m-d_H-i-s') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Export sales to Excel
     */
    private function exportToExcel($sales, $startDate = null, $endDate = null)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $sheet->setCellValue('A1', 'Rapport des Ventes');
        $sheet->mergeCells('A1:H1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        // Date range
        if ($startDate && $endDate) {
            $sheet->setCellValue('A2', 'Période: ' . date('d/m/Y', strtotime($startDate)) . ' - ' . date('d/m/Y', strtotime($endDate)));
            $sheet->mergeCells('A2:H2');
        }

        // Column headers
        $headers = ['N° Facture', 'Date', 'Client', 'Produit', 'Quantité', 'Prix Unitaire', 'Remise', 'Taxe', 'Montant Final'];
        $col = 'A';
        $row = 4;
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $row, $header);
            $sheet->getStyle($col . $row)->getFont()->setBold(true);
            $col++;
        }

        // Data rows
        $row = 5;
        foreach ($sales as $sale) {
            $sheet->setCellValue('A' . $row, $sale->invoice_number);
            $sheet->setCellValue('B' . $row, date('d/m/Y', strtotime($sale->sale_date)));
            $sheet->setCellValue('C' . $row, $sale->customer_name);
            $sheet->setCellValue('D' . $row, $sale->product->name ?? 'N/A');
            $sheet->setCellValue('E' . $row, $sale->quantity);
            $sheet->setCellValue('F' . $row, number_format($sale->unit_price, 2));
            $sheet->setCellValue('G' . $row, number_format($sale->discount, 2));
            $sheet->setCellValue('H' . $row, number_format($sale->tax, 2));
            $sheet->setCellValue('I' . $row, number_format($sale->final_amount, 2));
            $row++;
        }

        // Summary
        $row++;
        $sheet->setCellValue('A' . $row, 'Total des Ventes:');
        $sheet->setCellValue('B' . $row, $sales->count());
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);

        $row++;
        $sheet->setCellValue('A' . $row, 'Montant Total:');
        $sheet->setCellValue('B' . $row, number_format($sales->sum('final_amount'), 2) . ' MAD');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);

        // Auto-size columns
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $filename = 'sales_report_' . date('Y-m-d_H-i-s') . '.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');

        $writer->save('php://output');
        exit;
    }

    /**
     * Bulk create sales
     */
    public function bulkCreate(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $request->validate([
                'sales' => 'required|array|min:1',
                'sales.*.product_id' => 'required|exists:products,id',
                'sales.*.quantity' => 'required|integer|min:1',
                'sales.*.unit_price' => 'required|numeric|min:0',
                'sales.*.customer_id' => 'nullable|integer',
                'sales.*.payment_method' => 'required|string|max:50',
                'sales.*.sale_date' => 'required|date',
                'sales.*.total_amount' => 'required|numeric|min:0',
                'sales.*.discount' => 'nullable|numeric|min:0',
                'sales.*.tax' => 'nullable|numeric|min:0',
            ]);

            // Validate customer_id exists if provided
            foreach ($request->sales as $index => $saleData) {
                if (isset($saleData['customer_id']) && $saleData['customer_id']) {
                    $customer = \App\Models\Customer::find($saleData['customer_id']);
                    if (!$customer) {
                        return response()->json([
                            'success' => false,
                            'message' => "Le client avec l'ID {$saleData['customer_id']} n'existe pas (vente " . ($index + 1) . ")"
                        ], 400);
                    }
                }
            }

            // Check all products stock first
            $stockErrors = [];
            $products = [];
            $totalFinalAmount = 0;

            foreach ($request->sales as $index => $saleData) {
                $product = Product::find($saleData['product_id']);
                if ($product->stock_quantity < $saleData['quantity']) {
                    $stockErrors[] = "Ligne " . ($index + 1) . ": Stock insuffisant pour " . $product->name;
                }

                // Use amounts from frontend
                $totalAmount = $saleData['total_amount'];
                $discount = $saleData['discount'] ?? 0;
                $tax = $saleData['tax'] ?? 0;
                $finalAmount = $totalAmount; // total_amount from frontend already includes discount and tax
                $totalFinalAmount += $finalAmount;

                $products[] = [
                    'product_id' => $saleData['product_id'],
                    'product_name' => $product->name,
                    'quantity' => $saleData['quantity'],
                    'unit_price' => $saleData['unit_price'],
                    'total_amount' => $totalAmount,
                    'discount' => $discount,
                    'tax' => $tax,
                    'final_amount' => $finalAmount,
                ];
            }

            if (!empty($stockErrors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de stock: ' . implode(', ', $stockErrors)
                ], 400);
            }

            // Get customer info from first sale
            $firstSale = $request->sales[0];
            $customerId = $firstSale['customer_id'] ?? null;
            $customer = $customerId ? \App\Models\Customer::find($customerId) : null;

            // Generate unique invoice number
            $invoiceNumber = $this->generateUniqueInvoiceNumber();

            $sale = Sale::create([
                'invoice_number' => $invoiceNumber,
                'customer_id' => $customerId,
                'product_id' => $products[0]['product_id'], // Main product for compatibility
                'products' => $products, // All products as JSON
                'sale_type' => 'bulk',
                'quantity' => array_sum(array_column($products, 'quantity')), // Total quantity
                'unit_price' => $products[0]['unit_price'], // Main product price for compatibility
                'total_amount' => array_sum(array_column($products, 'total_amount')), // Total amount
                'discount' => array_sum(array_column($products, 'discount')), // Total discount
                'tax' => array_sum(array_column($products, 'tax')), // Total tax
                'final_amount' => $totalFinalAmount, // Total final amount
                'customer_name' => $customer ? $customer->name : 'Client anonyme',
                'customer_email' => $customer ? $customer->email : null,
                'customer_phone' => $customer ? $customer->phone : null,
                'payment_method' => $firstSale['payment_method'],
                'status' => 'completed',
                'sale_date' => $firstSale['sale_date'],
                'notes' => $firstSale['notes'] ?? null,
            ]);

            // Update stock for all products
            foreach ($request->sales as $saleData) {
                $product = Product::find($saleData['product_id']);
                $product->decrement('stock_quantity', $saleData['quantity']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Vente en lot créée avec succès',
                'data' => $sale->load(['product', 'customer'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création en lot: ' . $e->getMessage()
            ], 500);
        }
    }
}
