"use client"

import { useState, useEffect } from "react"
import { LanguageProvider } from "@/components/language-context"
import { ProtectedRoute } from "@/components/protected-route"
import { NavigationProvider, useNavigation } from "@/components/navigation-context"
import { NavigationGuard } from "@/components/navigation-guard"
import { Sidebar } from "@/components/sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { ProductManagement } from "@/components/product-management"
import { CategoriesManagement } from "@/components/categories-management"
import { CashManagement } from "@/components/cash-management"
import { SalesAndPurchases } from "@/components/sales-purchases"
import { Suppliers } from "@/components/suppliers"
import { StockAlerts } from "@/components/stock-alerts"
import { Inventory } from "@/components/inventory"
import { UserManagement } from "@/components/user-management"
import { UserProfile } from "@/components/user-profile"
import { DashboardOverview } from "@/components/dashboard-overview"
import { Customers } from "@/components/customers"

function DashboardContent() {
  const { activeSection } = useNavigation()

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />
      case "products":
        return <ProductManagement />
      case "categories":
        return <CategoriesManagement />
      case "cash":
        return <CashManagement />
      case "sales":
        return <SalesAndPurchases />
      case "suppliers":
        return <Suppliers />
      case "stock":
        return <StockAlerts />
      case "inventory":
        return <Inventory />
      case "users":
        return <UserManagement />
      case "profile":
        return <UserProfile />
      case "customers":
        return <Customers />
      default:
        return <ProductManagement />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <LanguageProvider>
        <NavigationProvider>
          <NavigationGuard />
          <DashboardContent />
        </NavigationProvider>
      </LanguageProvider>
    </ProtectedRoute>
  )
}
