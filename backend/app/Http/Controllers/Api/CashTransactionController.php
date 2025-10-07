<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CashTransactionController extends Controller
{
    /**
     * Display a listing of cash transactions
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = CashTransaction::query();

            // Apply search filter
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                      ->orWhere('reference', 'like', "%{$search}%")
                      ->orWhere('payment_method', 'like', "%{$search}%")
                      ->orWhere('notes', 'like', "%{$search}%");
                });
            }

            // Apply type filter
            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            // Apply date filters
            if ($request->filled('start_date')) {
                $query->where('transaction_date', '>=', $request->start_date);
            }

            if ($request->filled('end_date')) {
                $query->where('transaction_date', '<=', $request->end_date);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'transaction_date');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $perPage = $request->get('per_page', 20);
            $transactions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des transactions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created cash transaction
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:income,expense',
                'amount' => 'required|numeric|min:0',
                'description' => 'required|string|max:255',
                'reference' => 'nullable|string|max:255',
                'payment_method' => 'nullable|string|max:50',
                'transaction_date' => 'required|date',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $transaction = CashTransaction::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Transaction créée avec succès',
                'data' => $transaction
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified cash transaction
     */
    public function show($id): JsonResponse
    {
        try {
            $transaction = CashTransaction::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction non trouvée'
            ], 404);
        }
    }

    /**
     * Update the specified cash transaction
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $transaction = CashTransaction::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|required|in:income,expense',
                'amount' => 'sometimes|required|numeric|min:0',
                'description' => 'sometimes|required|string|max:255',
                'reference' => 'nullable|string|max:255',
                'payment_method' => 'nullable|string|max:50',
                'transaction_date' => 'sometimes|required|date',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreurs de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $transaction->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Transaction mise à jour avec succès',
                'data' => $transaction
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified cash transaction
     */
    public function destroy($id): JsonResponse
    {
        try {
            $transaction = CashTransaction::findOrFail($id);
            $transaction->delete();

            return response()->json([
                'success' => true,
                'message' => 'Transaction supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cash balance summary with month-over-month comparisons
     */
    public function balance(): JsonResponse
    {
        try {
            // Current month data
            $currentMonth = Carbon::now()->startOfMonth();
            $currentMonthEnd = Carbon::now()->endOfMonth();
            
            $currentMonthIncome = CashTransaction::where('type', 'income')
                ->whereBetween('transaction_date', [$currentMonth, $currentMonthEnd])
                ->sum('amount');
                
            $currentMonthExpenses = CashTransaction::where('type', 'expense')
                ->whereBetween('transaction_date', [$currentMonth, $currentMonthEnd])
                ->sum('amount');
                
            $currentMonthBalance = $currentMonthIncome - $currentMonthExpenses;

            // Last month data
            $lastMonth = Carbon::now()->subMonth()->startOfMonth();
            $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth();
            
            $lastMonthIncome = CashTransaction::where('type', 'income')
                ->whereBetween('transaction_date', [$lastMonth, $lastMonthEnd])
                ->sum('amount');
                
            $lastMonthExpenses = CashTransaction::where('type', 'expense')
                ->whereBetween('transaction_date', [$lastMonth, $lastMonthEnd])
                ->sum('amount');
                
            $lastMonthBalance = $lastMonthIncome - $lastMonthExpenses;

            // All time totals
            $totalIncome = CashTransaction::where('type', 'income')->sum('amount');
            $totalExpenses = CashTransaction::where('type', 'expense')->sum('amount');
            $currentBalance = $totalIncome - $totalExpenses;

            // Calculate percentage changes
            $incomeChange = $lastMonthIncome > 0 ? (($currentMonthIncome - $lastMonthIncome) / $lastMonthIncome) * 100 : 0;
            $expensesChange = $lastMonthExpenses > 0 ? (($currentMonthExpenses - $lastMonthExpenses) / $lastMonthExpenses) * 100 : 0;
            $balanceChange = $lastMonthBalance != 0 ? (($currentMonthBalance - $lastMonthBalance) / abs($lastMonthBalance)) * 100 : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    // Frontend expects these fields directly in data
                    'total_income' => $totalIncome,
                    'total_expenses' => $totalExpenses,
                    'current_balance' => $currentBalance,
                    'changes' => [
                        'income_percentage' => round($incomeChange, 1),
                        'expenses_percentage' => round($expensesChange, 1),
                        'balance_percentage' => round($balanceChange, 1),
                    ],
                    // Keep detailed data for potential future use
                    'current_month' => [
                        'income' => $currentMonthIncome,
                        'expenses' => $currentMonthExpenses,
                        'balance' => $currentMonthBalance,
                    ],
                    'last_month' => [
                        'income' => $lastMonthIncome,
                        'expenses' => $lastMonthExpenses,
                        'balance' => $lastMonthBalance,
                    ],
                    'total' => [
                        'income' => $totalIncome,
                        'expenses' => $totalExpenses,
                        'balance' => $currentBalance,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul du solde: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get cash transaction reports with detailed analytics
     */
    public function reports(Request $request): JsonResponse
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
            $endDate = $request->get('end_date', Carbon::now()->endOfMonth());

            $query = CashTransaction::query();

            if ($startDate && $endDate) {
                $query->whereBetween('transaction_date', [$startDate, $endDate]);
            }

            $transactions = $query->orderBy('transaction_date', 'desc')->get();

            $totalIncome = $transactions->where('type', 'income')->sum('amount');
            $totalExpenses = $transactions->where('type', 'expense')->sum('amount');
            $netAmount = $totalIncome - $totalExpenses;

            // Monthly breakdown
            $monthlyData = CashTransaction::whereBetween('transaction_date', [$startDate, $endDate])
                ->select(
                    DB::raw('DATE_FORMAT(transaction_date, "%Y-%m") as month'),
                    DB::raw('SUM(CASE WHEN type = "income" THEN amount ELSE 0 END) as income'),
                    DB::raw('SUM(CASE WHEN type = "expense" THEN amount ELSE 0 END) as expenses')
                )
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            // Payment method breakdown
            $paymentMethodData = CashTransaction::whereBetween('transaction_date', [$startDate, $endDate])
                ->select('payment_method', DB::raw('SUM(amount) as total'))
                ->groupBy('payment_method')
                ->orderBy('total', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'transactions' => $transactions,
                    'summary' => [
                        'total_income' => $totalIncome,
                        'total_expenses' => $totalExpenses,
                        'net_amount' => $netAmount,
                        'transaction_count' => $transactions->count(),
                    ],
                    'monthly_breakdown' => $monthlyData,
                    'payment_methods' => $paymentMethodData,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des rapports: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export cash transactions
     */
    public function export(Request $request)
    {
        try {
            $format = $request->get('format', 'excel');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            $query = CashTransaction::query();

            if ($startDate && $endDate) {
                $query->whereBetween('transaction_date', [$startDate, $endDate]);
            }

            $transactions = $query->orderBy('transaction_date', 'desc')->get();

            if ($format === 'pdf') {
                return $this->exportToPdf($transactions, $startDate, $endDate);
            } else {
                return $this->exportToExcel($transactions, $startDate, $endDate);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export cash transactions to PDF
     */
    private function exportToPdf($transactions, $startDate = null, $endDate = null)
    {
        $totalIncome = $transactions->where('type', 'income')->sum('amount');
        $totalExpenses = $transactions->where('type', 'expense')->sum('amount');
        $netAmount = $totalIncome - $totalExpenses;

        $html = view('exports.cash-transactions-pdf', [
            'transactions' => $transactions,
            'totalIncome' => $totalIncome,
            'totalExpenses' => $totalExpenses,
            'netAmount' => $netAmount,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'generatedAt' => now()->format('d/m/Y H:i:s')
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');

        $filename = 'cash_transactions_report_' . date('Y-m-d_H-i-s') . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Export cash transactions to Excel
     */
    private function exportToExcel($transactions, $startDate = null, $endDate = null)
    {
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $sheet->setCellValue('A1', 'Rapport des Transactions de Caisse');
        $sheet->mergeCells('A1:F1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        // Date range
        if ($startDate && $endDate) {
            $sheet->setCellValue('A2', 'Période: ' . date('d/m/Y', strtotime($startDate)) . ' - ' . date('d/m/Y', strtotime($endDate)));
            $sheet->mergeCells('A2:F2');
        }

        // Column headers
        $headers = ['Date', 'Type', 'Description', 'Référence', 'Méthode de Paiement', 'Montant'];
        $col = 'A';
        $row = 4;
        foreach ($headers as $header) {
            $sheet->setCellValue($col . $row, $header);
            $sheet->getStyle($col . $row)->getFont()->setBold(true);
            $col++;
        }

        // Data rows
        $row = 5;
        foreach ($transactions as $transaction) {
            $sheet->setCellValue('A' . $row, date('d/m/Y', strtotime($transaction->transaction_date)));
            $sheet->setCellValue('B' . $row, $transaction->type === 'income' ? 'Revenu' : 'Dépense');
            $sheet->setCellValue('C' . $row, $transaction->description);
            $sheet->setCellValue('D' . $row, $transaction->reference ?? '');
            $sheet->setCellValue('E' . $row, $transaction->payment_method ?? '');
            $sheet->setCellValue('F' . $row, number_format($transaction->amount, 2));
            $row++;
        }

        // Summary
        $row++;
        $sheet->setCellValue('A' . $row, 'Total des Revenus:');
        $sheet->setCellValue('B' . $row, number_format($transactions->where('type', 'income')->sum('amount'), 2) . ' MAD');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);

        $row++;
        $sheet->setCellValue('A' . $row, 'Total des Dépenses:');
        $sheet->setCellValue('B' . $row, number_format($transactions->where('type', 'expense')->sum('amount'), 2) . ' MAD');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);

        $row++;
        $sheet->setCellValue('A' . $row, 'Solde Net:');
        $sheet->setCellValue('B' . $row, number_format($transactions->where('type', 'income')->sum('amount') - $transactions->where('type', 'expense')->sum('amount'), 2) . ' MAD');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);

        // Auto-size columns
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $filename = 'cash_transactions_report_' . date('Y-m-d_H-i-s') . '.xlsx';

        // Set proper headers for file download
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        header('Cache-Control: max-age=1');
        header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
        header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
        header('Cache-Control: cache, must-revalidate');
        header('Pragma: public');

        // Output the file
        $writer->save('php://output');
        exit;
    }
}
