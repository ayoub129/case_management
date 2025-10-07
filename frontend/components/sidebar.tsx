"use client"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-context"
import { useNavigation } from "@/components/navigation-context"
import { useAuth } from "@/components/auth-context"
import {
  Package,
  CreditCard,
  TrendingUp,
  Truck,
  AlertTriangle,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Tag,
  User,
  ShoppingCart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"

export function Sidebar() {
  const { t, isRTL } = useLanguage()
  const { activeSection, setActiveSection } = useNavigation()
  const { hasPermission } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const allMenuItems = [
    { id: "dashboard", icon: BarChart3, label: "Tableau de bord", permission: "dashboard" },
    { id: "products", icon: Package, label: t("nav.products"), permission: "products" },
    { id: "categories", icon: Tag, label: t("nav.categories"), permission: "categories" },
    { id: "cash", icon: CreditCard, label: t("nav.cash"), permission: "cash" },
    { id: "sales", icon: TrendingUp, label: t("nav.sales"), permission: "sales" },
    { id: "suppliers", icon: Truck, label: t("nav.suppliers"), permission: "suppliers" },
    { id: "customers", icon: Users, label: "Clients", permission: "customers" },
    { id: "stock", icon: AlertTriangle, label: t("nav.stock"), permission: "stock" },
    { id: "inventory", icon: FileText, label: t("nav.inventory"), permission: "inventory" },
    { id: "users", icon: Users, label: t("nav.users"), permission: "users" },
    { id: "profile", icon: User, label: "Profil", permission: "profile" },
  ]

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => hasPermission(item.permission))

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed ? (
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={110}
              className="rounded-lg"
            />
          </div>
        ) : (
          <Image
            src="/logo.png"
            alt="Logo"
            width={110}
            className="rounded-lg"
          />
        )}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="p-2">
            {isRTL ? (
              collapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <nav className="mt-4 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              className={cn("w-full justify-start mb-1 h-12", collapsed && "justify-center px-2")}
              onClick={() => setActiveSection(item.id)}
            >
              <Icon className={cn("h-5 w-5", !collapsed && (isRTL ? "ml-3" : "mr-3"))} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
