<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport des Achats</title>
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
            border-bottom: 2px solid #059669;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #059669;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #059669;
        }
        .summary h3 {
            margin: 0 0 10px 0;
            color: #059669;
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
            color: #059669;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
        }
        th {
            background: #059669;
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
        .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }
        .status.pending {
            background: #fef3c7;
            color: #92400e;
        }
        .status.received {
            background: #d1fae5;
            color: #065f46;
        }
        .status.cancelled {
            background: #fee2e2;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 Rapport des Achats</h1>
        @if($startDate && $endDate)
            <p>Période: {{ date('d/m/Y', strtotime($startDate)) }} - {{ date('d/m/Y', strtotime($endDate)) }}</p>
        @endif
        <p>Généré le: {{ $generatedAt }}</p>
    </div>

    <div class="summary">
        <h3>📈 Résumé</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="label">Total des Achats</div>
                <div class="value">{{ $totalPurchases }}</div>
            </div>
            <div class="summary-item">
                <div class="label">Montant Total</div>
                <div class="value">{{ number_format($totalAmount, 2) }} MAD</div>
            </div>
            <div class="summary-item">
                <div class="label">Moyenne par Achat</div>
                <div class="value">{{ $totalPurchases > 0 ? number_format($totalAmount / $totalPurchases, 2) : '0.00' }} MAD</div>
            </div>
        </div>
    </div>

    @if($purchases->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>N° Achat</th>
                    <th>Date</th>
                    <th>Fournisseur</th>
                    <th>Produit</th>
                    <th class="center">Quantité</th>
                    <th class="amount">Coût Unitaire</th>
                    <th class="amount">Frais Livraison</th>
                    <th class="amount">Taxe</th>
                    <th class="amount">Coût Final</th>
                    <th class="center">Statut</th>
                </tr>
            </thead>
            <tbody>
                @foreach($purchases as $purchase)
                    <tr>
                        <td>{{ $purchase->purchase_number }}</td>
                        <td>{{ date('d/m/Y', strtotime($purchase->order_date)) }}</td>
                        <td>{{ $purchase->supplier->name ?? 'N/A' }}</td>
                        <td>{{ $purchase->product->name ?? 'N/A' }}</td>
                        <td class="center">{{ $purchase->quantity }}</td>
                        <td class="amount">{{ number_format($purchase->unit_cost, 2) }} MAD</td>
                        <td class="amount">{{ number_format($purchase->shipping_cost, 2) }} MAD</td>
                        <td class="amount">{{ number_format($purchase->tax, 2) }} MAD</td>
                        <td class="amount">{{ number_format($purchase->final_cost, 2) }} MAD</td>
                        <td class="center">
                            <span class="status {{ $purchase->status }}">
                                @switch($purchase->status)
                                    @case('pending')
                                        En attente
                                        @break
                                    @case('received')
                                        Reçu
                                        @break
                                    @case('cancelled')
                                        Annulé
                                        @break
                                    @default
                                        {{ ucfirst($purchase->status) }}
                                @endswitch
                            </span>
                        </td>
                    </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="8"><strong>Total</strong></td>
                    <td class="amount"><strong>{{ number_format($totalAmount, 2) }} MAD</strong></td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    @else
        <div style="text-align: center; padding: 40px; color: #666;">
            <h3>Aucun achat trouvé pour cette période</h3>
        </div>
    @endif

    <div class="footer">
        <p>Rapport généré automatiquement par le système de gestion de caisse</p>
        <p>© {{ date('Y') }} - Tous droits réservés</p>
    </div>
</body>
</html> 