"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Package,
  CreditCard,
  TrendingUp,
  Truck,
  AlertTriangle,
  FileText,
  Users,
  DollarSign,
  ShoppingCart,
  BarChart3,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { dashboardAPI, stockAlertsAPI } from "@/lib/api"
import { toast } from "sonner"
import { ClientOnly } from "@/components/client-only"

interface DashboardStats {
  total_products: number
  total_sales: number
  total_purchases: number
  total_suppliers: number
  total_revenue: number
  total_expenses: number
  low_stock_products: number
  out_of_stock_products: number
}

interface DailyStats {
  cashToday: number
  cashYesterday: number
  salesToday: number
  salesYesterday: number
  totalProducts: number
  totalProductsYesterday: number
  stockAlertsToday: number
  stockAlertsYesterday: number
  salesThisMonth: number
  salesLastMonth: number
}

interface ProfitStats {
  today: {
    revenue: number
    expenses: number
    profit: number
  }
  yesterday: {
    revenue: number
    expenses: number
    profit: number
  }
  thisMonth: {
    revenue: number
    expenses: number
    profit: number
  }
  lastMonth: {
    revenue: number
    expenses: number
    profit: number
  }
}

interface RecentActivity {
  id: number
  type: string
  description: string
  amount?: string
  created_at: string
  status: string
}

export function DashboardOverview() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    cashToday: 0,
    cashYesterday: 0,
    salesToday: 0,
    salesYesterday: 0,
    totalProducts: 0,
    totalProductsYesterday: 0,
    stockAlertsToday: 0,
    stockAlertsYesterday: 0,
    salesThisMonth: 0,
    salesLastMonth: 0
  })
  const [profitStats, setProfitStats] = useState<ProfitStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [profitView, setProfitView] = useState<'daily' | 'monthly'>('daily')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch data with only 3 API calls instead of 10
      const [statsResponse, activitiesResponse, dailyStatsResponse] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getDailyStats()
      ])

      setStats(statsResponse.data.data)
      setRecentActivities(activitiesResponse.data.data)
      
      // Use the pre-calculated daily stats from backend
      const dailyData = dailyStatsResponse.data.data
      console.log('Daily stats from backend:', dailyData)
      
      setDailyStats({
        cashToday: dailyData.cashToday || 0,
        cashYesterday: dailyData.cashYesterday || 0,
        salesToday: dailyData.salesToday || 0,
        salesYesterday: dailyData.salesYesterday || 0,
        totalProducts: dailyData.totalProducts || 0,
        totalProductsYesterday: dailyData.totalProductsYesterday || 0,
        stockAlertsToday: dailyData.stockAlertsToday || 0,
        stockAlertsYesterday: dailyData.stockAlertsYesterday || 0,
        salesThisMonth: dailyData.salesThisMonth || 0,
        salesLastMonth: dailyData.salesLastMonth || 0
      })

      // Calculate profit stats from the dashboard stats
      if (statsResponse.data.data) {
        const statsData = statsResponse.data.data
        
        setProfitStats({
          today: {
            revenue: dailyData.cashToday || 0,
            expenses: 0, // We'll need to fetch daily expenses separately
            profit: dailyData.cashToday || 0
          },
          yesterday: {
            revenue: dailyData.cashYesterday || 0,
            expenses: 0,
            profit: dailyData.cashYesterday || 0
          },
          thisMonth: {
            // Use actual current month data from cash transactions
            revenue: statsData.current_month_income || 0,
            expenses: statsData.current_month_expenses || 0,
            profit: statsData.current_month_profit || 0
          },
          lastMonth: {
            // Use actual last month data from cash transactions
            revenue: statsData.last_month_income || 0,
            expenses: statsData.last_month_expenses || 0,
            profit: statsData.last_month_profit || 0
          }
        })
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
    toast.success('Données actualisées')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2
    }).format(amount);
  }

  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? '+100%' : '0%'
    const change = ((current - previous) / previous) * 100
    return `${change >= 0 ? '+' : ''}${Math.round(change)}%`
  }

  const calculateAbsoluteChange = (current: number, previous: number): string => {
    const change = current - previous
    return `${change >= 0 ? '+' : ''}${change}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return date.toLocaleDateString('fr-FR')
  }

  const getCurrentProfitData = () => {
    if (!profitStats) return { current: 0, previous: 0, title: "Profit", period: "" }
    
    if (profitView === 'daily') {
      return {
        current: profitStats.today.profit,
        previous: profitStats.yesterday.profit,
        title: "Profit du jour",
        period: "depuis hier"
      }
    } else {
      return {
        current: profitStats.thisMonth.profit,
        previous: profitStats.lastMonth.profit,
        title: "Profit du mois",
        period: "depuis le mois dernier"
      }
    }
  }

  const getCurrentSalesData = () => {
    if (profitView === 'daily') {
      return {
        current: dailyStats.salesToday,
        previous: dailyStats.salesYesterday,
        title: "Ventes aujourd'hui",
        period: "depuis hier"
      }
    } else {
      return {
        current: dailyStats.salesThisMonth,
        previous: dailyStats.salesLastMonth,
        title: "Ventes du mois",
        period: "depuis le mois dernier"
      }
    }
  }

  const profitData = getCurrentProfitData()
  const salesData = getCurrentSalesData()

  const dashboardStats = [
    {
      title: profitData.title,
      value: formatCurrency(profitData.current),
      change: calculatePercentageChange(profitData.current, profitData.previous),
      icon: TrendingUp,
      color: profitData.current >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: salesData.title,
      value: salesData.current.toString(),
      change: calculatePercentageChange(salesData.current, salesData.previous),
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Produits en stock",
      value: dailyStats.totalProducts.toString(),
      change: calculatePercentageChange(dailyStats.totalProducts, dailyStats.totalProductsYesterday),
      icon: Package,
      color: "text-purple-600",
    },
    {
      title: "Alertes stock",
      value: dailyStats.stockAlertsToday.toString(),
      change: calculateAbsoluteChange(dailyStats.stockAlertsToday, dailyStats.stockAlertsYesterday),
      icon: AlertTriangle,
      color: "text-red-600",
    },
  ]

  const quickActions = [
    { title: "Gestion de produits", description: "Photos, scan code-barres", icon: Package, section: "products" },
    { title: "Gestion de la caisse", description: "Encaissement, dépenses", icon: CreditCard, section: "cash" },
    { title: "Ventes et achats", description: "Historique des transactions", icon: TrendingUp, section: "sales" },
    { title: "Fournisseurs", description: "Contacts et commandes", icon: Truck, section: "suppliers" },
    { title: "Stocks et alertes", description: "Niveaux et alertes", icon: AlertTriangle, section: "stock" },
    { title: "Inventaire", description: "Rapports et historiques", icon: FileText, section: "inventory" },
    { title: "Utilisateurs", description: "Rôles et permissions", icon: Users, section: "users" },
    { title: "Rapports", description: "Export Excel et PDF", icon: BarChart3, section: "inventory" },
  ]

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-gray-600 dark:text-gray-400">Vue d'ensemble de votre système de gestion</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Vue profit:</span>
            <Select value={profitView} onValueChange={(value: 'daily' | 'monthly') => setProfitView(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ClientOnly>
            <div className="text-sm text-gray-500">
              Dernière mise à jour: {new Date().toLocaleString("fr-FR")}
            </div>
          </ClientOnly>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <ClientOnly>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={stat.color}>{stat.change}</span> {index === 0 ? profitData.period : index === 1 ? salesData.period : "depuis hier"}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ClientOnly>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Fonctionnalités de l'application</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{action.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <ClientOnly>
          <Card>
            <CardHeader>
              <CardTitle>Activités récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(recentActivities) && recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              activity.status === "success"
                                ? "default"
                                : activity.status === "warning"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              activity.status === "success"
                                ? "bg-green-100 text-green-800"
                                : activity.status === "warning"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                            }
                          >
                            {activity.type}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                      </div>
                      {activity.amount && (
                        <div
                          className={`text-sm font-semibold ${
                            activity.status === "success"
                              ? "text-green-600"
                              : activity.status === "warning"
                                ? "text-yellow-600"
                                : "text-blue-600"
                          }`}
                        >
                          {activity.amount}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune activité récente
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ClientOnly>
      </div>

      {/* Feature Highlight */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Interface intuitive bilingue FR/AR
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Gestion complète des produits, ventes, achats et inventaire • Exportation des données en Excel et PDF
              </p>
            </div>
            <div className="flex space-x-2">
              <Badge variant="outline" className="bg-white/50">
                Français
              </Badge>
              <Badge variant="outline" className="bg-white/50">
                العربية
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
