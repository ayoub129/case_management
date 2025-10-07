"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-context"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { stockAlertsAPI } from "@/lib/api"

interface StockItem {
  id: number
  name: string
  stock_quantity: number
  minimum_stock: number
  status: string
  category: {
    id: number
    name: string
  }
  price: number
}

interface StockStatistics {
  critical: number
  low: number
  normal: number
  total: number
}

export function StockAlerts() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [statistics, setStatistics] = useState<StockStatistics>({
    critical: 0,
    low: 0,
    normal: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchStockAlerts()
  }, [searchTerm])

  const fetchStockAlerts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await stockAlertsAPI.getAll(Object.fromEntries(params))
      
      if (response.data.success) {
        setStockItems(response.data.data.products.data || [])
        setStatistics(response.data.data.statistics)
      } else {
        toast({
          title: "Erreur",
          description: response.data.message || "Impossible de charger les alertes de stock",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les alertes de stock",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchStockAlerts()
      toast({
        title: "Succès",
        description: "Alertes de stock actualisées",
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'actualisation",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleResolveAlert = async (productId: number) => {
    try {
      const response = await stockAlertsAPI.resolve(productId)
      
      if (response.data.success) {
        toast({
          title: "Succès",
          description: "Alerte résolue avec succès",
        })
        fetchStockAlerts() // Refresh the data
      } else {
        toast({
          title: "Erreur",
          description: response.data.message || "Erreur lors de la résolution",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la résolution",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "low":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "normal":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">{t("stock.critical")}</Badge>
      case "low":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {t("stock.low")}
          </Badge>
        )
      case "normal":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t("stock.normal")}
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("stock.title")}</h1>
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("stock.title")}</h1>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>Actualiser</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes critiques</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.critical}</div>
            <p className="text-xs text-muted-foreground">Produits en rupture critique</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.low}</div>
            <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock normal</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.normal}</div>
            <p className="text-xs text-muted-foreground">Produits bien approvisionnés</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>État des stocks</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          {stockItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Aucun produit trouvé" : "Aucune alerte de stock active"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("stock.product")}</TableHead>
                  <TableHead>{t("stock.current")}</TableHead>
                  <TableHead>{t("stock.minimum")}</TableHead>
                  <TableHead>{t("stock.alert")}</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={
                      item.status === "critical"
                        ? "bg-red-50 dark:bg-red-900/10"
                        : item.status === "low"
                          ? "bg-yellow-50 dark:bg-yellow-900/10"
                          : ""
                    }
                  >
                    <TableCell className="font-medium flex items-center space-x-2 rtl:space-x-reverse">
                      {getStatusIcon(item.status)}
                      <span>{item.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.stock_quantity < item.minimum_stock ? "destructive" : "default"}>
                        {item.stock_quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.minimum_stock}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category?.name || "Sans catégorie"}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.status !== "normal" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolveAlert(item.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Résoudre
                        </Button>
                      )}
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
