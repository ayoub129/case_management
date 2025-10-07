"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, TrendingDown, DollarSign, Loader2, Search, Download, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { cashTransactionsAPI } from "@/lib/api"
import { toast } from "sonner"
import { TransactionFlow } from "./transaction-flow"
import { productsAPI } from "@/lib/api"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface Product {
  id: number
  name: string
  description?: string
  price: number | string
  stock_quantity: number
  minimum_stock: number
  category_id: number
}

interface CashTransaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  description: string
  reference?: string
  payment_method?: string
  transaction_date: string
  notes?: string
  created_at: string
}

interface CashBalance {
  total_income: number
  total_expenses: number
  current_balance: number
  changes?: {
    income_percentage: number;
    expenses_percentage: number;
    balance_percentage: number;
  };
}

interface PaginationData {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export function CashManagement() {
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<CashTransaction[]>([])
  const [balance, setBalance] = useState<CashBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [showTransactionFlow, setShowTransactionFlow] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null)
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null)
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'all'>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    reference: '',
    payment_method: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when searching
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchCashData()
  }, [currentPage, perPage, debouncedSearchTerm, viewMode, selectedDate, selectedMonth])

  // Barcode scanning effect for main page
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Handle barcode scanning from main page
      if (event.key.length === 1 && event.key.match(/[0-9]/)) {
        setIsScanning(true);
        setBarcodeInput(prev => prev + event.key);
        
        // Clear previous timeout
        if (scanTimeout) {
          clearTimeout(scanTimeout);
        }
        
        // Set new timeout to process barcode after scanning stops
        const timeout = setTimeout(() => {
          processBarcodeFromMain(barcodeInput + event.key);
          setBarcodeInput("");
          setIsScanning(false);
        }, 100); // 100ms delay to detect end of scan
        
        setScanTimeout(timeout);
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, [barcodeInput, scanTimeout]);

  const processBarcodeFromMain = async (barcode: string) => {
    if (barcode.length < 8) return; // Minimum barcode length
    
    try {
      // Search for product by barcode
      const response = await productsAPI.findByBarcode(barcode);
      const product = response.data.data;
      
      if (product) {
        toast.success(`✅ ${product.name} trouvé! Ouverture du panier...`);
        // Store the scanned product and open cart page directly
        setScannedProduct(product);
        setShowTransactionFlow(true);
      } else {
        toast.error(`❌ Aucun produit trouvé pour le code: ${barcode}`);
      }
    } catch (error) {
      toast.error(`❌ Erreur: Code-barres ${barcode} non trouvé`);
    }
  };

  const fetchCashData = async () => {
    try {
      setLoading(true)
      
      // Prepare date filters based on view mode
      const dateFilter = viewMode === 'daily' 
        ? { date: selectedDate }
        : viewMode === 'monthly'
        ? { month: selectedMonth }
        : {} // No date filter for 'all' mode
      
      const [transactionsResponse, balanceResponse] = await Promise.all([
        cashTransactionsAPI.getAll({ 
          page: currentPage, 
          per_page: perPage,
          search: debouncedSearchTerm || undefined,
          ...dateFilter
        }),
        cashTransactionsAPI.getBalance({
          view_mode: viewMode,
          ...dateFilter
        })
      ])

      console.log('Cash Transactions API Response:', transactionsResponse.data)
      
      // Handle paginated transactions data
      let transactionsData = transactionsResponse.data.data || []
      if (transactionsData && transactionsData.data) {
        transactionsData = transactionsData.data
      }
      
      if (Array.isArray(transactionsData)) {
        setTransactions(transactionsData)
      } else {
        console.error('Transactions data is not an array:', transactionsData)
        setTransactions([])
      }

      // Set pagination data
      if (transactionsResponse.data.data && transactionsResponse.data.data.pagination) {
        setPagination(transactionsResponse.data.data.pagination)
      } else if (transactionsResponse.data.data) {
        // Handle Laravel pagination structure
        const paginationData = transactionsResponse.data.data
        setPagination({
          current_page: paginationData.current_page || 1,
          last_page: paginationData.last_page || 1,
          per_page: paginationData.per_page || 20,
          total: paginationData.total || 0,
          from: paginationData.from || 0,
          to: paginationData.to || 0
        })
      }
      
      console.log('Cash Balance API Response:', balanceResponse.data)
      setBalance(balanceResponse.data.data)
    } catch (error: any) {
      console.error('Error fetching cash data:', error)
      toast.error('Erreur lors du chargement des données')
      setTransactions([]) // Ensure we always have an array
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await cashTransactionsAPI.create({
        ...formData,
        type: 'expense',
        amount: parseFloat(formData.amount)
      })
      
      toast.success('Dépense ajoutée avec succès')
      setIsDialogOpen(false)
      resetForm()
      fetchCashData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout de la transaction')
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      reference: '',
      payment_method: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }


  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      return
    }

    try {
      await cashTransactionsAPI.delete(id)
      toast.success('Transaction supprimée avec succès')
      fetchCashData() // Refresh the data
    } catch (error: any) {
      console.error('Delete transaction error:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la transaction')
    }
  }

  const fetchAllTransactionsForExport = async () => {
    try {
      const response = await cashTransactionsAPI.getAll({ 
        per_page: 1000000, // Get a large number to get all data
        search: debouncedSearchTerm || undefined
      })
      
      let allTransactionsData = response.data.data || []
      if (allTransactionsData && allTransactionsData.data) {
        allTransactionsData = allTransactionsData.data
      }
      
      return allTransactionsData
    } catch (error) {
      console.error('Error fetching all transactions for export:', error)
      return []
    }
  }

  const exportToPDF = async () => {
    // Fetch ALL transactions data for export, not just current page
    const allTransactions = await fetchAllTransactionsForExport()
    
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Rapport des Transactions de Caisse', 14, 22)
    
    // Add company info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('SEASON CONTROL', 14, 30)
    doc.text('Tél: +212 61 007 0143', 14, 35)
    doc.text('R.C.7399 / TP 53506169 / IF 53655471', 14, 40)
    doc.text('ICE 003253489000064', 14, 45)
    doc.text('site: seasoncontrol.ma', 14, 50)
    
    // Add generation date
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 60)
    
    // Add summary
    if (balance) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Résumé', 14, 75)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Revenus totaux: ${formatCurrency(balance.total_income)}`, 14, 85)
      doc.text(`Dépenses totales: ${formatCurrency(balance.total_expenses)}`, 14, 90)
      doc.text(`Solde actuel: ${formatCurrency(balance.current_balance)}`, 14, 95)
    }
    
    // Prepare table data
    const tableData = allTransactions.map((transaction: any) => [
      formatDate(transaction.transaction_date),
      transaction.description,
      transaction.reference || '-',
      transaction.payment_method || '-',
      `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}`,
      transaction.type === 'income' ? 'Revenu' : 'Dépense'
    ])
    
    // Add table
    autoTable(doc, {
      head: [['Date', 'Description', 'Référence', 'Méthode', 'Montant', 'Type']],
      body: tableData,
      startY: balance ? 105 : 75,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        4: { halign: 'right' },
      },
    })
    
    // Add footer
    const finalY = (doc as any).lastAutoTable.finalY || 100
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Merci pour votre confiance!', 14, finalY + 20)
    
    // Save the PDF
    const filename = `cash_transactions_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  }

  const exportToExcel = async () => {
    // Fetch ALL transactions data for export, not just current page
    const allTransactions = await fetchAllTransactionsForExport()
    
    // Prepare worksheet data
    const worksheetData = allTransactions.map((transaction: any) => ({
      'Date': formatDate(transaction.transaction_date),
      'Description': transaction.description,
      'Référence': transaction.reference || '',
      'Méthode de Paiement': transaction.payment_method || '',
      'Montant': transaction.amount,
      'Type': transaction.type === 'income' ? 'Revenu' : 'Dépense',
      'Notes': transaction.notes || ''
    }))
    
    // Add summary rows
    if (balance) {
      const summaryData = [
        {
          'Date': '',
          'Description': 'TOTAL REVENUS',
          'Référence': '',
          'Méthode de Paiement': '',
          'Montant': balance.total_income,
          'Type': 'Revenu',
          'Notes': ''
        },
        {
          'Date': '',
          'Description': 'TOTAL DÉPENSES',
          'Référence': '',
          'Méthode de Paiement': '',
          'Montant': balance.total_expenses,
          'Type': 'Dépense',
          'Notes': ''
        },
        {
          'Date': '',
          'Description': 'SOLDE ACTUEL',
          'Référence': '',
          'Méthode de Paiement': '',
          'Montant': balance.current_balance,
          'Type': 'Solde',
          'Notes': ''
        }
      ]
      
      worksheetData.push(...summaryData)
    }
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Date
      { wch: 25 }, // Description
      { wch: 15 }, // Référence
      { wch: 15 }, // Méthode de Paiement
      { wch: 15 }, // Montant
      { wch: 10 }, // Type
      { wch: 30 }  // Notes
    ]
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
    
    // Generate and download file
    const filename = `cash_transactions_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  const handleExport = async () => {
    try {
      await exportToExcel()
      toast.success('Export Excel généré avec succès')
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error('Erreur lors de l\'export Excel')
    }
  }

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "0,00 MAD";
    }
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2
    }).format(amount) + ' ';
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getStatsTitle = (type: 'income' | 'expenses' | 'balance') => {
    const baseTitle = type === 'income' ? 'Revenus totaux' : 
                     type === 'expenses' ? 'Dépenses totales' : 'Solde'
    if (viewMode === 'daily') return `${baseTitle} du jour`
    if (viewMode === 'monthly') return `${baseTitle} du mois`
    return `${baseTitle} total`
  }

  const getComparisonText = () => {
    if (viewMode === 'daily') return 'depuis hier'
    if (viewMode === 'monthly') return 'depuis le mois dernier'
    return 'toutes périodes'
  }

  const stats = [
    {
      title: getStatsTitle('income'),
      value: formatCurrency(balance?.total_income),
      change: balance?.changes?.income_percentage !== undefined ? 
        `${balance.changes.income_percentage > 0 ? '+' : ''}${balance.changes.income_percentage}% ${getComparisonText()}` : 
        "Aucune donnée précédente",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: getStatsTitle('expenses'),
      value: formatCurrency(balance?.total_expenses),
      change: balance?.changes?.expenses_percentage !== undefined ? 
        `${balance.changes.expenses_percentage > 0 ? '+' : ''}${balance.changes.expenses_percentage}% ${getComparisonText()}` : 
        "Aucune donnée précédente",
      icon: TrendingDown,
      color: "text-red-600",
    },
    {
      title: getStatsTitle('balance'),
      value: formatCurrency(balance?.current_balance),
      change: balance?.changes?.balance_percentage !== undefined ? 
        `${balance.changes.balance_percentage > 0 ? '+' : ''}${balance.changes.balance_percentage}% ${getComparisonText()}` : 
        "Aucune donnée précédente",
      icon: DollarSign,
      color: "text-blue-600",
    },
  ]

  if (showTransactionFlow) {
    return (
      <TransactionFlow 
        onSaleComplete={() => {
          setShowTransactionFlow(false);
          setScannedProduct(null); // Reset scanned product
        }} 
        initialProduct={scannedProduct}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("cash.title")}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gestion des transactions de caisse et suivi des finances</p>
          </div>
          
          {/* View Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vue:</span>
              <Select value={viewMode} onValueChange={(value: 'daily' | 'monthly' | 'all') => setViewMode(value)}>
                <SelectTrigger className="w-36 bg-white dark:bg-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">📅 Quotidien</SelectItem>
                  <SelectItem value="monthly">📊 Mensuel</SelectItem>
                  <SelectItem value="all">📋 Tout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {viewMode === 'daily' ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date:</span>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-44 bg-white dark:bg-gray-700"
                />
              </div>
            ) : viewMode === 'monthly' ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mois:</span>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-44 bg-white dark:bg-gray-700"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={async () => {
            try {
              await exportToPDF()
              toast.success('Export PDF généré avec succès')
            } catch (error: any) {
              console.error('Export error:', error)
              toast.error('Erreur lors de l\'export PDF')
            }
          }}>
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowTransactionFlow(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle vente
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center space-x-2 rtl:space-x-reverse"
                onClick={() => {
                  resetForm()
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Nouvelle Dépense</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nouvelle Dépense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Référence</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Méthode de paiement</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="card">Carte</SelectItem>
                      <SelectItem value="bank_transfer">Virement</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction_date">Date de transaction</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit">
                    {t("common.save")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${index === 0 ? 'bg-green-100 dark:bg-green-900/20' : index === 1 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="flex items-center space-x-2">
                  <div className={`text-sm font-medium ${stat.color}`}>
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Transactions Table */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                {viewMode === 'daily' ? 'Transactions du jour' : 'Transactions du mois'}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {viewMode === 'daily' 
                  ? `Transactions pour le ${new Date(selectedDate).toLocaleDateString('fr-FR')}`
                  : `Transactions pour ${new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-white dark:bg-gray-700"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Par page:</span>
                <Select value={perPage.toString()} onValueChange={(value) => {
                  setPerPage(parseInt(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20 bg-white dark:bg-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Date</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Description</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Référence</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Méthode</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Montant</TableHead>
                      <TableHead className="text-center font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction, index) => (
                      <TableRow 
                        key={transaction.id} 
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'
                        }`}
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(transaction.transaction_date)}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.description}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {transaction.reference || '-'}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {transaction.payment_method || '-'}
                        </TableCell>
                        <TableCell className={`text-right font-bold text-lg ${
                          transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          <div className="flex items-center justify-end space-x-1">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              transaction.type === 'income' 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}
                            </span>
                            {formatCurrency(transaction.amount)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Affichage de <span className="font-semibold">{pagination.from}</span> à <span className="font-semibold">{pagination.to}</span> sur <span className="font-semibold">{pagination.total}</span> résultats
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-white dark:bg-gray-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                          let pageNum;
                          if (pagination.last_page <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= pagination.last_page - 2) {
                            pageNum = pagination.last_page - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0 bg-white dark:bg-gray-700"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.last_page}
                        className="bg-white dark:bg-gray-700"
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucune transaction trouvée
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {viewMode === 'daily' 
                  ? `Aucune transaction pour le ${new Date(selectedDate).toLocaleDateString('fr-FR')}`
                  : `Aucune transaction pour ${new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                }
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
