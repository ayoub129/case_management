"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, FileText, Download, TrendingUp, Package, AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { inventoryAPI } from "@/lib/api"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface InventoryData {
  category: string
  totalItems: number
  totalValue: number
  lowStock: number
}

interface InventorySummary {
  totalValue: number
  totalItems: number
  totalLowStock: number
}

export function Inventory() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([])
  const [summary, setSummary] = useState<InventorySummary>({
    totalValue: 0,
    totalItems: 0,
    totalLowStock: 0
  })
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      const response = await inventoryAPI.getAll()
      
      if (response.data.success) {
        setInventoryData(response.data.data.categories)
        setSummary(response.data.data.summary)
      } else {
        toast({
          title: "Erreur",
          description: response.data.message || "Impossible de charger les données d'inventaire",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les données d'inventaire",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Rapport d\'Inventaire', 14, 22)
    
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
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Résumé', 14, 75)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Valeur totale: ${summary.totalValue.toFixed(2)} DH`, 14, 85)
    doc.text(`Total produits: ${summary.totalItems}`, 14, 90)
    doc.text(`Stock faible: ${summary.totalLowStock}`, 14, 95)
    
    // Prepare table data
    const tableData = inventoryData.map(item => [
      item.category,
      item.totalItems.toString(),
      `${item.totalValue.toFixed(2)} DH`,
      item.lowStock.toString()
    ])
    
    // Add table
    autoTable(doc, {
      head: [['Catégorie', 'Nombre d\'articles', 'Valeur totale', 'Stock faible']],
      body: tableData,
      startY: 105,
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
        2: { halign: 'right' },
      },
    })
    
    // Add footer
    const finalY = (doc as any).lastAutoTable.finalY || 100
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Merci pour votre confiance!', 14, finalY + 20)
    
    // Save the PDF
    const filename = `inventory_report_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
  }

  const exportToExcel = () => {
    // Prepare worksheet data
    const worksheetData = inventoryData.map(item => ({
      'Catégorie': item.category,
      'Nombre d\'articles': item.totalItems,
      'Valeur totale': item.totalValue,
      'Stock faible': item.lowStock
    }))
    
    // Add summary row
    const summaryData = {
      'Catégorie': 'TOTAL',
      'Nombre d\'articles': summary.totalItems,
      'Valeur totale': summary.totalValue,
      'Stock faible': summary.totalLowStock
    }
    
    worksheetData.push(summaryData)
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Catégorie
      { wch: 15 }, // Nombre d'articles
      { wch: 15 }, // Valeur totale
      { wch: 12 }  // Stock faible
    ]
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaire')
    
    // Generate and download file
    const filename = `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  const handleExport = (format: 'excel' | 'pdf') => {
    try {
      setExporting(true)
      
      if (format === 'pdf') {
        exportToPDF()
        toast({
          title: "Succès",
          description: "Export PDF généré avec succès",
        })
      } else {
        exportToExcel()
        toast({
          title: "Succès",
          description: "Export Excel généré avec succès",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || `Erreur lors de l'export ${format.toUpperCase()}`,
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("inventory.title")}</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("inventory.title")}</h1>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2 rtl:space-x-reverse bg-transparent"
            onClick={() => handleExport('excel')}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>{t("inventory.export.excel")}</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center space-x-2 rtl:space-x-reverse bg-transparent"
            onClick={() => handleExport('pdf')}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>{t("inventory.export.pdf")}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalValue.toFixed(2)} DH</div>
            <p className="text-xs text-muted-foreground">Valeur de l'inventaire</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total produits</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground">Produits en stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.totalLowStock}</div>
            <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("inventory.reports")}</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée d'inventaire disponible
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Nombre d'articles</TableHead>
                  <TableHead>Valeur totale</TableHead>
                  <TableHead>Stock faible</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.totalItems}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{item.totalValue.toFixed(2)} DH</TableCell>
                    <TableCell>
                      {item.lowStock > 0 ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {item.lowStock}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          0
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleExport('excel')}
                        disabled={exporting}
                      >
                        {exporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
