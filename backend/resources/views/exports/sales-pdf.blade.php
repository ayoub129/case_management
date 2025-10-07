<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport des Ventes</title>
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
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #2563eb;
        }
        .summary h3 {
            margin: 0 0 10px 0;
            color: #2563eb;
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
            color: #2563eb;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
        }
        th {
            background: #2563eb;
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
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Rapport des Ventes</h1>
        @if($startDate && $endDate)
            <p>Période: {{ date('d/m/Y', strtotime($startDate)) }} - {{ date('d/m/Y', strtotime($endDate)) }}</p>
        @endif
        <p>Généré le: {{ $generatedAt }}</p>
    </div>

    <div class="summary">
        <h3>📈 Résumé</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">Total des Ventes</div>
                <div class="value">{{ $totalSales }}</div>
            </div>
            <div class="summary-item">
                <div class="label">Montant Total</div>
                <div class="value">{{ number_format($totalAmount, 2) }} MAD</div>
            </div>
            <div class="summary-item">
                <div class="label">Moyenne par Vente</div>
                <div class="value">{{ $totalSales > 0 ? number_format($totalAmount / $totalSales, 2) : '0.00' }} MAD</div>
            </div>
        </div>
    </div>

    @if($sales->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>N° Facture</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Produit</th>
                    <th class="center">Quantité</th>
                    <th class="amount">Prix Unitaire</th>
                    <th class="amount">Remise</th>
                    <th class="amount">Taxe</th>
                    <th class="amount">Montant Final</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sales as $sale)
                    <tr>
                        <td>{{ $sale->invoice_number }}</td>
                        <td>{{ date('d/m/Y', strtotime($sale->sale_date)) }}</td>
                        <td>{{ $sale->customer_name }}</td>
                        <td>{{ $sale->product->name ?? 'N/A' }}</td>
                        <td class="center">{{ $sale->quantity }}</td>
                        <td class="amount">{{ number_format($sale->unit_price, 2) }} MAD</td>
                        <td class="amount">{{ number_format($sale->discount, 2) }} MAD</td>
                        <td class="amount">{{ number_format($sale->tax, 2) }} MAD</td>
                        <td class="amount">{{ number_format($sale->final_amount, 2) }} MAD</td>
                    </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="8"><strong>Total</strong></td>
                    <td class="amount"><strong>{{ number_format($totalAmount, 2) }} MAD</strong></td>
                </tr>
            </tbody>
        </table>
    @else
        <div style="text-align: center; padding: 40px; color: #666;">
            <h3>Aucune vente trouvée pour cette période</h3>
        </div>
    @endif

    <div class="footer">
        <p>Rapport généré automatiquement par le système de gestion de caisse</p>
        <p>© {{ date('Y') }} - Tous droits réservés</p>
    </div>
</body>
</html> 