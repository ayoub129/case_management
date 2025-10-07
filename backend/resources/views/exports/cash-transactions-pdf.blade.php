<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport des Transactions de Caisse</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #7c3aed;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #7c3aed;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            background: #faf5ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #7c3aed;
        }
        .summary h3 {
            margin: 0 0 10px 0;
            color: #7c3aed;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .summary-item .value {
            font-size: 18px;
            font-weight: bold;
            color: #7c3aed;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
        }
        th {
            background: #7c3aed;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
            background: #f9fafb;
        }
        .total-row {
            background: #fef3c7 !important;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .amount {
            text-align: right;
        }
        .center {
            text-align: center;
        }
        .type-income {
            color: #059669;
            font-weight: bold;
        }
        .type-expense {
            color: #dc2626;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Rapport des Transactions de Caisse</h1>
        @if($startDate && $endDate)
            <p>Période: {{ date('d/m/Y', strtotime($startDate)) }} - {{ date('d/m/Y', strtotime($endDate)) }}</p>
        @endif
        <p>Généré le: {{ $generatedAt }}</p>
    </div>

    <div class="summary">
        <h3>📊 Résumé</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">Total des Revenus</div>
                <div class="value">{{ number_format($totalIncome, 2) }} MAD</div>
            </div>
            <div class="summary-item">
                <div class="label">Total des Dépenses</div>
                <div class="value">{{ number_format($totalExpenses, 2) }} MAD</div>
            </div>
            <div class="summary-item">
                <div class="label">Solde Net</div>
                <div class="value">{{ number_format($netAmount, 2) }} MAD</div>
            </div>
            <div class="summary-item">
                <div class="label">Nombre de Transactions</div>
                <div class="value">{{ $transactions->count() }}</div>
            </div>
        </div>
    </div>

    @if($transactions->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Référence</th>
                    <th>Méthode de Paiement</th>
                    <th class="amount">Montant</th>
                </tr>
            </thead>
            <tbody>
                @foreach($transactions as $transaction)
                    <tr>
                        <td>{{ date('d/m/Y', strtotime($transaction->transaction_date)) }}</td>
                        <td class="center">
                            <span class="type-{{ $transaction->type }}">
                                {{ $transaction->type === 'income' ? 'Revenu' : 'Dépense' }}
                            </span>
                        </td>
                        <td>{{ $transaction->description }}</td>
                        <td>{{ $transaction->reference ?? '-' }}</td>
                        <td>{{ $transaction->payment_method ?? '-' }}</td>
                        <td class="amount">{{ number_format($transaction->amount, 2) }} MAD</td>
                    </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="5"><strong>Total</strong></td>
                    <td class="amount"><strong>{{ number_format($transactions->sum('amount'), 2) }} MAD</strong></td>
                </tr>
            </tbody>
        </table>
    @else
        <div style="text-align: center; padding: 40px; color: #666;">
            <h3>Aucune transaction trouvée pour cette période</h3>
        </div>
    @endif

    <div class="footer">
        <p>Rapport généré automatiquement par le système de gestion de caisse</p>
        <p>© {{ date('Y') }} - Tous droits réservés</p>
    </div>
</body>
</html> 