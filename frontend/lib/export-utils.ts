import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface ExportData {
  id: number
  invoice_number?: string
  purchase_number?: string
  product_name: string
  customer_name?: string
  supplier_name?: string
  quantity: number
  unit_price?: number
  unit_cost?: number
  total_amount?: number
  final_cost?: number
  final_amount?: number
  discount?: number
  tax?: number
  payment_method: string
  status: string
  sale_date?: string
  order_date?: string
  notes?: string
}

export const exportToPDF = (data: ExportData[], type: 'sales' | 'purchases', title: string) => {
  const doc = new jsPDF()
  
  // Add title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 22)
  
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
  
  // Prepare table data
  const tableData = data.map(item => {
    if (type === 'sales') {
      return [
        item.invoice_number || '',
        item.product_name,
        item.customer_name || '',
        item.quantity.toString(),
        formatCurrency(item.unit_price || 0),
        formatCurrency(item.final_amount || 0),
        formatDate(item.sale_date || ''),
        item.status,
        item.payment_method
      ]
    } else {
      return [
        item.purchase_number || '',
        item.product_name,
        item.supplier_name || '',
        item.quantity.toString(),
        formatCurrency(item.unit_cost || 0),
        formatCurrency(item.final_cost || 0),
        formatDate(item.order_date || ''),
        item.status,
        item.payment_method
      ]
    }
  })
  
  // Define table columns
  const columns = type === 'sales' 
    ? ['Facture', 'Produit', 'Client', 'Quantité', 'Prix Unitaire', 'Montant Total', 'Date', 'Statut', 'Paiement']
    : ['Commande', 'Produit', 'Fournisseur', 'Quantité', 'Coût Unitaire', 'Coût Total', 'Date', 'Statut', 'Paiement']
  
  // Add table
  autoTable(doc, {
    head: [columns],
    body: tableData,
    startY: 70,
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
      5: { halign: 'right' },
    },
  })
  
  // Add totals
  const finalY = (doc as any).lastAutoTable.finalY || 100
  const totalAmount = data.reduce((sum, item) => {
    const amount = item.final_amount || item.final_cost || 0
    return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0)
  }, 0)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total: ${formatCurrency(totalAmount)}`, 14, finalY + 20)
  
  // Add footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Merci pour votre confiance!', 14, finalY + 35)
  
  // Save the PDF
  const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

export const exportToExcel = (data: ExportData[], type: 'sales' | 'purchases', title: string) => {
  // Prepare worksheet data
  const worksheetData = data.map(item => {
    if (type === 'sales') {
      return {
        'N° Facture': item.invoice_number || '',
        'Produit': item.product_name,
        'Client': item.customer_name || '',
        'Quantité': item.quantity,
        'Prix Unitaire': item.unit_price || 0,
        'Montant Total': item.final_amount || 0,
        'Remise': item.discount || 0,
        'Taxe': item.tax || 0,
        'Date': formatDate(item.sale_date || ''),
        'Statut': item.status,
        'Méthode de Paiement': item.payment_method,
        'Notes': item.notes || ''
      }
    } else {
      return {
        'N° Commande': item.purchase_number || '',
        'Produit': item.product_name,
        'Fournisseur': item.supplier_name || '',
        'Quantité': item.quantity,
        'Coût Unitaire': item.unit_cost || 0,
        'Coût Total': item.final_cost || 0,
        'Frais de Livraison': 0, // Add if available in data
        'Taxe': item.tax || 0,
        'Date': formatDate(item.order_date || ''),
        'Statut': item.status,
        'Méthode de Paiement': item.payment_method,
        'Notes': item.notes || ''
      }
    }
  })
  
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  
  // Set column widths
  const columnWidths = type === 'sales' 
    ? [
        { wch: 15 }, // N° Facture
        { wch: 20 }, // Produit
        { wch: 20 }, // Client
        { wch: 10 }, // Quantité
        { wch: 15 }, // Prix Unitaire
        { wch: 15 }, // Montant Total
        { wch: 10 }, // Remise
        { wch: 10 }, // Taxe
        { wch: 12 }, // Date
        { wch: 12 }, // Statut
        { wch: 15 }, // Méthode de Paiement
        { wch: 30 }  // Notes
      ]
    : [
        { wch: 15 }, // N° Commande
        { wch: 20 }, // Produit
        { wch: 20 }, // Fournisseur
        { wch: 10 }, // Quantité
        { wch: 15 }, // Coût Unitaire
        { wch: 15 }, // Coût Total
        { wch: 15 }, // Frais de Livraison
        { wch: 10 }, // Taxe
        { wch: 12 }, // Date
        { wch: 12 }, // Statut
        { wch: 15 }, // Méthode de Paiement
        { wch: 30 }  // Notes
      ]
  
  worksheet['!cols'] = columnWidths
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, title)
  
  // Generate and download file
  const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, filename)
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
    currencyDisplay: 'code',
    minimumFractionDigits: 2
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR')
}
