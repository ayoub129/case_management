"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Filter, Calendar, Plus, Download, Loader2, Printer, Trash2, FileText, Table, ShoppingCart, Truck, TrendingUp, BarChart3 } from "lucide-react"
import { salesAPI, purchasesAPI, productsAPI, suppliersAPI, customersAPI } from "@/lib/api"
import { exportToPDF, exportToExcel, ExportData } from "@/lib/export-utils"
import { BulkSales } from "@/components/bulk-sales"
import { BulkPurchases } from "@/components/bulk-purchases"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Sale {
  id: number
  invoice_number: string
  product: {
    id: number
    name: string
  }
  products?: any[] // For bulk sales
  sale_type?: string // 'single' or 'bulk'
  quantity: number
  unit_price: number
  total_amount: number
  discount: number
  tax: number
  final_amount: number
  customer_name: string
  customer_email?: string
  customer_phone?: string
  payment_method: string
  status: string
  sale_date: string
  notes?: string
  created_at: string
}

interface Purchase {
  id: number
  purchase_number: string
  product: {
    id: number
    name: string
  }
  products?: any[] // For bulk purchases
  purchase_type?: string // 'single' or 'bulk'
  supplier: {
    id: number
    name: string
  }
  quantity: number
  unit_cost: number
  total_cost: number
  shipping_cost: number
  tax: number
  final_cost: number
  payment_method: string
  status: string
  order_date: string
  expected_delivery_date?: string
  received_date?: string
  notes?: string
  created_at: string
}

interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  is_loyalty?: boolean
  loyalty_points?: number
}

interface Product {
  id: number
  name: string
  price: number | string
  loyalty_price?: number | string
  stock_quantity: number
}

interface Supplier {
  id: number
  name: string
}

export function SalesAndPurchases() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("sales")
  const [sales, setSales] = useState<Sale[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false)
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  
  
  // Pagination state
  const [salesPage, setSalesPage] = useState(1)
  const [purchasesPage, setPurchasesPage] = useState(1)
  const [salesPerPage, setSalesPerPage] = useState(15)
  const [purchasesPerPage, setPurchasesPerPage] = useState(15)
  const [salesPagination, setSalesPagination] = useState<any>(null)
  const [purchasesPagination, setPurchasesPagination] = useState<any>(null)
  const [saleFormData, setSaleFormData] = useState({
    customer_id: '',
    product_id: '',
    quantity: '',
    unit_price: '',
    discount: '',
    tax: '',
    payment_method: '',
    sale_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [purchaseFormData, setPurchaseFormData] = useState({
    product_id: '',
    supplier_id: '',
    quantity: '',
    unit_cost: '',
    shipping_cost: '',
    tax: '',
    payment_method: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: ''
  })


  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setSalesPage(1)
      setPurchasesPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchData()
  }, [salesPage, purchasesPage, salesPerPage, purchasesPerPage, debouncedSearchTerm, viewMode, selectedDate, selectedMonth])


  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Prepare date filters based on view mode
      const dateFilter = viewMode === 'daily' 
        ? { date: selectedDate }
        : { month: selectedMonth }
      
      const [salesResponse, purchasesResponse, productsResponse, suppliersResponse, customersResponse] = await Promise.all([
        salesAPI.getAll({ 
          page: salesPage, 
          per_page: salesPerPage,
          search: debouncedSearchTerm,
          ...dateFilter
        }),
        purchasesAPI.getAll({ 
          page: purchasesPage, 
          per_page: purchasesPerPage,
          search: debouncedSearchTerm,
          ...dateFilter
        }),
        productsAPI.getAll(),
        suppliersAPI.getAll(),
        customersAPI.getAll()
      ])

      console.log('Sales API Response:', salesResponse.data)
      console.log('Sales API Response Structure:', {
        hasData: !!salesResponse.data,
        hasDataData: !!salesResponse.data?.data,
        dataType: typeof salesResponse.data?.data,
        hasCurrentPage: salesResponse.data?.data?.current_page !== undefined,
        directCurrentPage: salesResponse.data?.current_page !== undefined
      })
      console.log('Suppliers API Response:', suppliersResponse.data)
      
      // Handle paginated sales data
      const salesResponseData = salesResponse.data
      let salesData = salesResponseData.data || []
      
      // Extract pagination metadata from Laravel pagination response
      let salesPaginationData = null
      if (salesResponseData.data && typeof salesResponseData.data === 'object' && salesResponseData.data.current_page !== undefined) {
        // Laravel pagination response structure (nested in data.data)
        salesPaginationData = salesResponseData.data
        salesData = salesResponseData.data.data || []
      } else if (salesResponseData.current_page !== undefined) {
        // Direct pagination response
        salesPaginationData = salesResponseData
        salesData = salesResponseData.data || []
      }
      
      // Store pagination metadata for sales
      console.log('Sales pagination data:', salesPaginationData)
      if (salesPaginationData) {
        setSalesPagination({
          current_page: salesPaginationData.current_page,
          last_page: salesPaginationData.last_page,
          per_page: salesPaginationData.per_page,
          total: salesPaginationData.total,
          from: salesPaginationData.from,
          to: salesPaginationData.to
        })
      } else {
        // If no pagination data, calculate it manually
        const totalPages = Math.ceil(salesData.length / salesPerPage)
        setSalesPagination({
          current_page: salesPage,
          last_page: totalPages,
          per_page: salesPerPage,
          total: salesData.length,
          from: (salesPage - 1) * salesPerPage + 1,
          to: Math.min(salesPage * salesPerPage, salesData.length)
        })
      }
      
      // Handle paginated purchases data
      const purchasesResponseData = purchasesResponse.data
      let purchasesData = purchasesResponseData.data || []
      
      // Extract pagination metadata from Laravel pagination response
      let purchasesPaginationData = null
      if (purchasesResponseData.data && typeof purchasesResponseData.data === 'object' && purchasesResponseData.data.current_page !== undefined) {
        // Laravel pagination response structure (nested in data.data)
        purchasesPaginationData = purchasesResponseData.data
        purchasesData = purchasesResponseData.data.data || []
      } else if (purchasesResponseData.current_page !== undefined) {
        // Direct pagination response
        purchasesPaginationData = purchasesResponseData
        purchasesData = purchasesResponseData.data || []
      }
      
      // Store pagination metadata for purchases
      console.log('Purchases pagination data:', purchasesPaginationData)
      if (purchasesPaginationData) {
        setPurchasesPagination({
          current_page: purchasesPaginationData.current_page,
          last_page: purchasesPaginationData.last_page,
          per_page: purchasesPaginationData.per_page,
          total: purchasesPaginationData.total,
          from: purchasesPaginationData.from,
          to: purchasesPaginationData.to
        })
      } else {
        // If no pagination data, calculate it manually
        const totalPages = Math.ceil(purchasesData.length / purchasesPerPage)
        setPurchasesPagination({
          current_page: purchasesPage,
          last_page: totalPages,
          per_page: purchasesPerPage,
          total: purchasesData.length,
          from: (purchasesPage - 1) * purchasesPerPage + 1,
          to: Math.min(purchasesPage * purchasesPerPage, purchasesData.length)
        })
      }
      
      // Handle paginated products data
      let productsData = productsResponse.data.data || []
      if (productsData && productsData.data) {
        productsData = productsData.data
      }
      
      // Handle suppliers data structure (has both suppliers and statistics)
      let suppliersData = suppliersResponse.data.data || []
      if (suppliersData && suppliersData.suppliers) {
        // If it has suppliers key, use that
        suppliersData = suppliersData.suppliers.data || suppliersData.suppliers
      } else if (suppliersData && suppliersData.data) {
        // Otherwise handle as normal pagination
        suppliersData = suppliersData.data
      }
      
      // Handle customers data structure (paginated response)
      let customersData = customersResponse.data.data || []
      if (customersData && customersData.data) {
        customersData = customersData.data
      }

      // Use backend pagination directly for sales data
      if (Array.isArray(salesData)) {
        setSales(salesData)
      } else {
        console.error('Sales data is not an array:', salesData)
        setSales([])
        setSalesPagination(null)
      }

      // Use backend pagination directly for purchases data
      if (Array.isArray(purchasesData)) {
        setPurchases(purchasesData)
      } else {
        console.error('Purchases data is not an array:', purchasesData)
        setPurchases([])
        setPurchasesPagination(null)
      }

      if (Array.isArray(productsData)) {
        setProducts(productsData)
      } else {
        console.error('Products data is not an array:', productsData)
        setProducts([])
      }

      console.log('Processed suppliers data:', suppliersData)
      if (Array.isArray(suppliersData)) {
        setSuppliers(suppliersData)
      } else {
        console.error('Suppliers data is not an array:', suppliersData)
        setSuppliers([])
      }

      if (Array.isArray(customersData)) {
        setCustomers(customersData)
      } else {
        console.error('Customers data is not an array:', customersData)
        setCustomers([])
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement des données')
      setSales([])
      setPurchases([])
      setProducts([])
      setSuppliers([])
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const totalAmount = parseFloat(saleFormData.unit_price) * parseInt(saleFormData.quantity)
      const discount = parseFloat(saleFormData.discount) || 0
      const tax = parseFloat(saleFormData.tax) || 0
      const finalAmount = totalAmount - discount + tax

      // Get selected customer details (optional)
      const selectedCustomer = customers.find(c => c.id.toString() === saleFormData.customer_id)

      await salesAPI.create({
        customer_id: saleFormData.customer_id ? parseInt(saleFormData.customer_id) : undefined,
        product_id: parseInt(saleFormData.product_id),
        quantity: parseInt(saleFormData.quantity),
        unit_price: parseFloat(saleFormData.unit_price),
        total_amount: totalAmount,
        discount,
        tax,
        final_amount: finalAmount,
        customer_name: selectedCustomer?.name || 'Client anonyme',
        customer_email: selectedCustomer?.email || undefined,
        customer_phone: selectedCustomer?.phone || undefined,
        payment_method: saleFormData.payment_method,
        status: 'completed',
        sale_date: saleFormData.sale_date,
        notes: saleFormData.notes
      })

      toast.success('Vente ajoutée avec succès')
      setIsSaleDialogOpen(false)
      resetSaleForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout de la vente')
    }
  }

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const totalCost = parseFloat(purchaseFormData.unit_cost) * parseInt(purchaseFormData.quantity)
      const shippingCost = parseFloat(purchaseFormData.shipping_cost) || 0
      const tax = parseFloat(purchaseFormData.tax) || 0
      const finalCost = totalCost + shippingCost + tax

      await purchasesAPI.create({
        product_id: parseInt(purchaseFormData.product_id),
        supplier_id: parseInt(purchaseFormData.supplier_id),
        quantity: parseInt(purchaseFormData.quantity),
        unit_cost: parseFloat(purchaseFormData.unit_cost),
        total_cost: totalCost,
        shipping_cost: shippingCost,
        tax,
        final_cost: finalCost,
        payment_method: purchaseFormData.payment_method,
        status: 'ordered',
        order_date: purchaseFormData.order_date,
        expected_delivery_date: purchaseFormData.expected_delivery_date,
        notes: purchaseFormData.notes
      })

      toast.success('Achat ajouté avec succès')
      setIsPurchaseDialogOpen(false)
      resetPurchaseForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout de l\'achat')
    }
  }

  const resetSaleForm = () => {
    setSaleFormData({
      customer_id: '',
      product_id: '',
      quantity: '1', // Set quantity to 1 by default
      unit_price: '',
      discount: '',
      tax: '',
      payment_method: '',
      sale_date: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }

  // Handle product selection - auto-fill unit price
  const handleProductSelection = (productId: string) => {
    const selectedProduct = products.find(p => p.id.toString() === productId)
    const selectedCustomer = customers.find(c => c.id.toString() === saleFormData.customer_id)
    
    if (selectedProduct) {
      let unitPrice = parseFloat(selectedProduct.price.toString()) || 0
      
      // Check if customer is in loyalty program and product has loyalty price
      if (selectedCustomer?.is_loyalty && selectedProduct.loyalty_price) {
        unitPrice = parseFloat(selectedProduct.loyalty_price.toString()) || unitPrice
      }
      
      setSaleFormData({
        ...saleFormData,
        product_id: productId,
        unit_price: unitPrice.toString(),
        quantity: '1' // Set quantity to 1 when product is selected
      })
    }
  }

  // Handle customer selection - update unit price if loyalty applies
  const handleCustomerSelection = (customerId: string) => {
    const selectedCustomer = customers.find(c => c.id.toString() === customerId)
    const selectedProduct = products.find(p => p.id.toString() === saleFormData.product_id)
    
    if (selectedCustomer && selectedProduct) {
      let unitPrice = parseFloat(selectedProduct.price.toString()) || 0
      
      // Check if customer is in loyalty program and product has loyalty price
      if (selectedCustomer.is_loyalty && selectedProduct.loyalty_price) {
        unitPrice = parseFloat(selectedProduct.loyalty_price.toString()) || unitPrice
      }
      
      setSaleFormData({
        ...saleFormData,
        customer_id: customerId,
        unit_price: unitPrice.toString()
      })
    } else {
      setSaleFormData({
        ...saleFormData,
        customer_id: customerId
      })
    }
  }

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      product_id: '',
      supplier_id: '',
      quantity: '',
      unit_cost: '',
      shipping_cost: '',
      tax: '',
      payment_method: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      notes: ''
    })
  }

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2
    }).format(numAmount) + ' ';
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const generateInvoice = (sale: Sale) => {
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Facture - ${sale.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #000; 
            background: white;
            width: 80mm; /* Standard thermal printer width */
            margin: 0 auto;
            padding: 5mm;
          }
          .container { width: 100%; }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 8px; 
            margin-bottom: 8px; 
          }
          .company-name { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 2px; 
            text-transform: uppercase;
          }
          .company-info { 
            font-size: 10px; 
            margin-bottom: 4px; 
            line-height: 1.2;
          }
          .invoice-title { 
            font-size: 14px; 
            font-weight: bold; 
            margin-top: 4px;
            text-transform: uppercase;
          }
          .section { 
            margin-bottom: 8px; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 4px; 
          }
          .section-title { 
            font-weight: bold; 
            font-size: 11px; 
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .info-line { 
            margin-bottom: 1px; 
            font-size: 10px; 
          }
          .product-item { 
            margin-bottom: 6px; 
            padding: 3px 0; 
            border-bottom: 1px dotted #ccc; 
          }
          .product-name { 
            font-weight: bold; 
            font-size: 11px; 
            margin-bottom: 1px; 
          }
          .product-details { 
            font-size: 9px; 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 1px; 
          }
          .product-total { 
            font-weight: bold; 
            font-size: 10px; 
            text-align: right; 
            border-top: 1px solid #000; 
            padding-top: 1px; 
          }
          .total-section { 
            margin-top: 8px; 
            border-top: 2px solid #000; 
            padding-top: 4px; 
            text-align: center; 
          }
          .total-amount { 
            font-size: 14px; 
            font-weight: bold; 
            text-transform: uppercase;
          }
          .footer { 
            margin-top: 8px; 
            text-align: center; 
            font-size: 9px; 
            border-top: 1px dashed #000; 
            padding-top: 4px; 
          }
          .separator { 
            text-align: center; 
            margin: 4px 0; 
            font-size: 8px; 
          }
          @media print { 
            body { margin: 0; padding: 2mm; }
            .container { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">SEASON CONTROL</div>
            <div class="company-info">Tél: +212 61 007 0143</div>
            <div class="company-info">R.C.7399 / TP 53506169 / IF 53655471</div>
            <div class="company-info">ICE 003253489000064</div>
            <div class="company-info">site: seasoncontrol.ma</div>
            <div class="invoice-title">FACTURE</div>
          </div>
          
          <div class="section">
            <div class="section-title">Informations Client</div>
            <div class="info-line"><strong>Nom:</strong> ${sale.customer_name}</div>
            ${sale.customer_email ? `<div class="info-line"><strong>Email:</strong> ${sale.customer_email}</div>` : ''}
            ${sale.customer_phone ? `<div class="info-line"><strong>Tél:</strong> ${sale.customer_phone}</div>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">Détails Facture</div>
            <div class="info-line"><strong>N° Facture:</strong> ${sale.invoice_number}</div>
            <div class="info-line"><strong>Date:</strong> ${formatDate(sale.sale_date)}</div>
            <div class="info-line"><strong>Paiement:</strong> ${sale.payment_method}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Articles</div>
            ${sale.sale_type === 'bulk' && sale.products ? 
              sale.products.map((item: any) => `
                <div class="product-item">
                  <div class="product-name">${item.product_name}</div>
                  <div class="product-details">
                    <span>Prix: ${formatCurrency(item.unit_price)}</span>
                    <span>Qté: ${item.quantity}</span>
                  </div>
                  ${item.discount > 0 ? `<div class="product-details"><span>Remise: ${formatCurrency(item.discount)}</span></div>` : ''}
                  ${item.tax > 0 ? `<div class="product-details"><span>Taxe: ${formatCurrency(item.tax)}</span></div>` : ''}
                  <div class="product-total">Sous-total: ${formatCurrency(item.final_amount)}</div>
                </div>
              `).join('') :
              `
              <div class="product-item">
                <div class="product-name">${sale.product.name}</div>
                <div class="product-details">
                  <span>Prix: ${formatCurrency(sale.unit_price)}</span>
                  <span>Qté: ${sale.quantity}</span>
                </div>
                ${sale.discount > 0 ? `<div class="product-details"><span>Remise: ${formatCurrency(sale.discount)}</span></div>` : ''}
                ${sale.tax > 0 ? `<div class="product-details"><span>Taxe: ${formatCurrency(sale.tax)}</span></div>` : ''}
                <div class="product-total">Sous-total: ${formatCurrency(sale.final_amount)}</div>
              </div>
              `
            }
          </div>
          
          <div class="total-section">
            <div class="total-amount">TOTAL: ${formatCurrency(sale.final_amount)}</div>
          </div>
          
          <div class="separator">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
          
          <div class="footer">
            <div><strong>Merci pour votre achat!</strong></div>
            <div>Facture générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
            <div>Conservez cette facture pour toute question</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return invoiceContent;
  };

  const generatePurchaseOrder = (purchase: Purchase) => {
    const purchaseOrderContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bon de commande - ${purchase.purchase_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            line-height: 1.4; 
            color: #000; 
            background: white;
            width: 80mm; /* Standard thermal printer width */
            margin: 0 auto;
            padding: 5mm;
          }
          .container { width: 100%; }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 8px; 
            margin-bottom: 8px; 
          }
          .company-name { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 2px; 
            text-transform: uppercase;
          }
          .company-info { 
            font-size: 10px; 
            margin-bottom: 4px; 
            line-height: 1.2;
          }
          .order-title { 
            font-size: 14px; 
            font-weight: bold; 
            margin-top: 4px;
            text-transform: uppercase;
          }
          .section { 
            margin-bottom: 8px; 
            border-bottom: 1px dashed #000; 
            padding-bottom: 4px; 
          }
          .section-title { 
            font-weight: bold; 
            font-size: 11px; 
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .info-line { 
            margin-bottom: 1px; 
            font-size: 10px; 
          }
          .product-item { 
            margin-bottom: 6px; 
            padding: 3px 0; 
            border-bottom: 1px dotted #ccc; 
          }
          .product-name { 
            font-weight: bold; 
            font-size: 11px; 
            margin-bottom: 1px; 
          }
          .product-details { 
            font-size: 9px; 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 1px; 
          }
          .product-total { 
            font-weight: bold; 
            font-size: 10px; 
            text-align: right; 
            border-top: 1px solid #000; 
            padding-top: 1px; 
          }
          .total-section { 
            margin-top: 8px; 
            border-top: 2px solid #000; 
            padding-top: 4px; 
            text-align: center; 
          }
          .total-amount { 
            font-size: 14px; 
            font-weight: bold; 
            text-transform: uppercase;
          }
          .footer { 
            margin-top: 8px; 
            text-align: center; 
            font-size: 9px; 
            border-top: 1px dashed #000; 
            padding-top: 4px; 
          }
          .separator { 
            text-align: center; 
            margin: 4px 0; 
            font-size: 8px; 
          }
          @media print { 
            body { margin: 0; padding: 2mm; }
            .container { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">SEASON CONTROL</div>
            <div class="company-info">Tél: +212 61 007 0143</div>
            <div class="company-info">R.C.7399 / TP 53506169 / IF 53655471</div>
            <div class="company-info">ICE 003253489000064</div>
            <div class="company-info">site: seasoncontrol.ma</div>
            <div class="order-title">BON DE COMMANDE</div>
          </div>
                    
          <div class="section">
            <div class="section-title">Détails Commande</div>
            <div class="info-line"><strong>N° Commande:</strong> ${purchase.purchase_number}</div>
            <div class="info-line"><strong>Date:</strong> ${formatDate(purchase.order_date)}</div>
            <div class="info-line"><strong>Livraison:</strong> ${purchase.expected_delivery_date ? formatDate(purchase.expected_delivery_date) : 'Non définie'}</div>
            <div class="info-line"><strong>Paiement:</strong> ${purchase.payment_method}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Articles</div>
            ${purchase.purchase_type === 'bulk' && purchase.products ? 
              purchase.products.map((item: any) => `
                <div class="product-item">
                  <div class="product-name">${item.product_name}</div>
                  <div class="product-details">
                    <span>Coût: ${formatCurrency(item.unit_cost)}</span>
                    <span>Qté: ${item.quantity}</span>
                  </div>
                  ${item.shipping_cost > 0 ? `<div class="product-details"><span>Livraison: ${formatCurrency(item.shipping_cost)}</span></div>` : ''}
                  ${item.tax > 0 ? `<div class="product-details"><span>Taxe: ${formatCurrency(item.tax)}</span></div>` : ''}
                  <div class="product-total">Sous-total: ${formatCurrency(item.final_cost)}</div>
                </div>
              `).join('') :
              `
              <div class="product-item">
                <div class="product-name">${purchase.product.name}</div>
                <div class="product-details">
                  <span>Coût: ${formatCurrency(purchase.unit_cost)}</span>
                  <span>Qté: ${purchase.quantity}</span>
                </div>
                ${purchase.shipping_cost > 0 ? `<div class="product-details"><span>Livraison: ${formatCurrency(purchase.shipping_cost)}</span></div>` : ''}
                ${purchase.tax > 0 ? `<div class="product-details"><span>Taxe: ${formatCurrency(purchase.tax)}</span></div>` : ''}
                <div class="product-total">Sous-total: ${formatCurrency(purchase.final_cost)}</div>
              </div>
              `
            }
          </div>
          
          <div class="total-section">
            <div class="total-amount">TOTAL: ${formatCurrency(purchase.final_cost)}</div>
          </div>
          
          <div class="separator">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
          
          <div class="footer">
            <div><strong>Bon de commande généré automatiquement</strong></div>
            <div>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
            <div>Conservez ce document pour le suivi</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return purchaseOrderContent;
  };

  const handlePrintInvoice = (sale: Sale) => {
    const invoiceContent = generateInvoice(sale);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  const handlePrintPurchaseOrder = (purchase: Purchase) => {
    const purchaseOrderContent = generatePurchaseOrder(purchase);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(purchaseOrderContent);
      printWindow.document.close();
      printWindow.print();
    }
  }

  const handleDeleteSale = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      return
    }

    try {
      await salesAPI.delete(id)
      toast.success('Vente supprimée avec succès')
      fetchData() // Refresh the data
    } catch (error: any) {
      console.error('Delete sale error:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la vente')
    }
  }

  const handleDeletePurchase = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) {
      return
    }

    try {
      await purchasesAPI.delete(id)
      toast.success('Achat supprimé avec succès')
      fetchData() // Refresh the data
    } catch (error: any) {
      console.error('Delete purchase error:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de l\'achat')
    }
  }

  const fetchAllDataForExport = async (type: 'sales' | 'purchases') => {
    try {
      if (type === 'sales') {
        const response = await salesAPI.getAll({ 
          per_page: 1000000, // Get a large number to get all data
          search: debouncedSearchTerm || undefined
        })
        
        let allSalesData = response.data.data || []
        if (allSalesData && allSalesData.data) {
          allSalesData = allSalesData.data
        }
        
        return allSalesData
      } else {
        const response = await purchasesAPI.getAll({ 
          per_page: 1000000, // Get a large number to get all data
          search: debouncedSearchTerm || undefined
        })
        
        let allPurchasesData = response.data.data || []
        if (allPurchasesData && allPurchasesData.data) {
          allPurchasesData = allPurchasesData.data
        }
        
        return allPurchasesData
      }
    } catch (error) {
      console.error('Error fetching all data for export:', error)
      return []
    }
  }

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      if (activeTab === 'sales') {
        // Fetch ALL sales data for export, not just current page
        const allSalesData = await fetchAllDataForExport('sales')
        
        const exportData: ExportData[] = allSalesData.map((sale: any) => ({
          id: sale.id,
          invoice_number: sale.invoice_number,
          product_name: sale.sale_type === 'bulk' && sale.products 
            ? `${sale.products.length} produits`
            : sale.product.name,
          customer_name: sale.customer_name,
          quantity: sale.quantity,
          unit_price: sale.unit_price,
          total_amount: sale.total_amount,
          final_amount: sale.final_amount,
          discount: sale.discount,
          tax: sale.tax,
          payment_method: sale.payment_method,
          status: sale.status,
          sale_date: sale.sale_date,
          notes: sale.notes
        }))

        if (format === 'pdf') {
          exportToPDF(exportData, 'sales', 'Rapport des Ventes')
          toast.success('Export PDF généré avec succès')
        } else {
          exportToExcel(exportData, 'sales', 'Rapport des Ventes')
          toast.success('Export Excel généré avec succès')
        }
      } else {
        // Fetch ALL purchases data for export, not just current page
        const allPurchasesData = await fetchAllDataForExport('purchases')
        
        const exportData: ExportData[] = allPurchasesData.map((purchase: any) => ({
          id: purchase.id,
          purchase_number: purchase.purchase_number,
          product_name: purchase.purchase_type === 'bulk' && purchase.products 
            ? `${purchase.products.length} produits`
            : purchase.product.name,
          supplier_name: purchase.supplier.name,
          quantity: purchase.quantity,
          unit_cost: purchase.unit_cost,
          total_cost: purchase.total_cost,
          final_cost: purchase.final_cost,
          tax: purchase.tax,
          payment_method: purchase.payment_method,
          status: purchase.status,
          order_date: purchase.order_date,
          notes: purchase.notes
        }))

        if (format === 'pdf') {
          exportToPDF(exportData, 'purchases', 'Rapport des Achats')
          toast.success('Export PDF généré avec succès')
        } else {
          exportToExcel(exportData, 'purchases', 'Rapport des Achats')
          toast.success('Export Excel généré avec succès')
        }
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Erreur lors de l\'export')
    }
  }

  // Use sales data directly since backend handles search and pagination
  const filteredSales = sales || []

  // Use purchases data directly since backend handles search and pagination  
  const filteredPurchases = purchases || []

  // Calculate totals for current view
  const salesTotal = filteredSales.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)
  const purchasesTotal = filteredPurchases.reduce((sum, purchase) => sum + (purchase.final_cost || 0), 0)
  const salesCount = filteredSales.length
  const purchasesCount = filteredPurchases.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("sales.title")}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Vue:</span>
            <Select value={viewMode} onValueChange={(value: 'daily' | 'monthly') => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {viewMode === 'daily' ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Date:</span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Mois:</span>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40"
              />
            </div>
          )}
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Exporter en PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <Table className="h-4 w-4 mr-2" />
                Exporter en Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {activeTab === 'sales' ? (
            <>
              <BulkSales />
            </>
          ) : (
            <>
              <BulkPurchases />
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {viewMode === 'daily' ? 'Ventes du jour' : 'Ventes du mois'}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesCount}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(salesTotal)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {viewMode === 'daily' ? 'Achats du jour' : 'Achats du mois'}
            </CardTitle>
            <Truck className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchasesCount}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(purchasesTotal)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {viewMode === 'daily' ? 'Profit du jour' : 'Profit du mois'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${salesTotal - purchasesTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(salesTotal - purchasesTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenus - Dépenses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {viewMode === 'daily' ? 'Marge du jour' : 'Marge du mois'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesTotal > 0 ? `${(((salesTotal - purchasesTotal) / salesTotal) * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Marge bénéficiaire
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="purchases">Achats</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="relative flex-1">
                  <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t("common.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rtl:pl-4 rtl:pr-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center space-x-2 rtl:space-x-reverse bg-transparent">
                  <Calendar className="h-4 w-4" />
                  <span>{t("common.filter")}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSales.length > 0 ? (
                <UITable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facture</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredSales || []).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                        <TableCell>
                          {sale.sale_type === 'bulk' && sale.products 
                            ? `${sale.products.length} produits`
                            : sale.product.name
                          }
                        </TableCell>
                        <TableCell>{sale.customer_name}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {formatCurrency(sale.final_amount)}
                        </TableCell>
                        <TableCell>{formatDate(sale.sale_date)}</TableCell>
                        <TableCell>
                          <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                            {sale.status === 'completed' ? 'Complété' : sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintInvoice(sale)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSale(sale.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </UITable>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune vente trouvée
                </div>
              )}
              
              {/* Sales Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  {salesPagination ? (
                    `Affichage de ${salesPagination.from} à ${salesPagination.to} sur ${salesPagination.total} résultats`
                  ) : (
                    `Affichage de ${sales.length} résultats`
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Par page:</span>
                  <Select value={salesPerPage.toString()} onValueChange={(value) => {
                    setSalesPerPage(parseInt(value))
                    setSalesPage(1)
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSalesPage(Math.max(1, salesPage - 1))}
                    disabled={salesPage === 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm">
                    Page {salesPage} sur {salesPagination?.last_page || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSalesPage(Math.min(salesPagination?.last_page || 1, salesPage + 1))}
                    disabled={salesPage === (salesPagination?.last_page || 1)}
                  >
                    Suivant
                  </Button>
                  <div className="flex items-center space-x-1 ml-2">
                    <span className="text-sm text-gray-600">Aller à:</span>
                    <Input
                      type="number"
                      min="1"
                      max={salesPagination?.last_page || 1}
                      value={salesPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value)
                        if (page >= 1 && page <= (salesPagination?.last_page || 1)) {
                          setSalesPage(page)
                        }
                      }}
                      className="w-16 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="relative flex-1">
                  <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t("common.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rtl:pl-4 rtl:pr-10"
                  />
                </div>
                <Button variant="outline" className="flex items-center space-x-2 rtl:space-x-reverse bg-transparent">
                  <Calendar className="h-4 w-4" />
                  <span>{t("common.filter")}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPurchases.length > 0 ? (
                <UITable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Coût</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredPurchases || []).map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                        <TableCell>
                          {purchase.purchase_type === 'bulk' && purchase.products 
                            ? `${purchase.products.length} produits`
                            : purchase.product.name
                          }
                        </TableCell>
                        <TableCell>{purchase.supplier.name}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell className="text-red-600 font-semibold">
                          {formatCurrency(purchase.final_cost)}
                        </TableCell>
                        <TableCell>{formatDate(purchase.order_date)}</TableCell>
                        <TableCell>
                          <Badge variant={purchase.status === "received" ? "default" : "secondary"}>
                            {purchase.status === "received" ? "Reçu" : "Commandé"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintPurchaseOrder(purchase)}
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePurchase(purchase.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </UITable>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun achat trouvé
                </div>
              )}
              
              {/* Purchases Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  {purchasesPagination ? (
                    `Affichage de ${purchasesPagination.from} à ${purchasesPagination.to} sur ${purchasesPagination.total} résultats`
                  ) : (
                    `Affichage de ${purchases.length} résultats`
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Par page:</span>
                  <Select value={purchasesPerPage.toString()} onValueChange={(value) => {
                    setPurchasesPerPage(parseInt(value))
                    setPurchasesPage(1)
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPurchasesPage(Math.max(1, purchasesPage - 1))}
                    disabled={purchasesPage === 1}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm">
                    Page {purchasesPage} sur {purchasesPagination?.last_page || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPurchasesPage(Math.min(purchasesPagination?.last_page || 1, purchasesPage + 1))}
                    disabled={purchasesPage === (purchasesPagination?.last_page || 1)}
                  >
                    Suivant
                  </Button>
                  <div className="flex items-center space-x-1 ml-2">
                    <span className="text-sm text-gray-600">Aller à:</span>
                    <Input
                      type="number"
                      min="1"
                      max={purchasesPagination?.last_page || 1}
                      value={purchasesPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value)
                        if (page >= 1 && page <= (purchasesPagination?.last_page || 1)) {
                          setPurchasesPage(page)
                        }
                      }}
                      className="w-16 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
