"use client"

import { useAuth } from "@/components/auth-context"
import { useNavigation } from "@/components/navigation-context"
import { useEffect } from "react"

export function NavigationGuard() {
  const { user, hasPermission } = useAuth()
  const { activeSection, setActiveSection } = useNavigation()

  useEffect(() => {
    if (user) {
      // Check if current section is accessible
      const accessibleSections = [
        'dashboard',
        'products', 
        'categories',
        'cash',
        'sales',
        'suppliers',
        'customers',
        'stock',
        'inventory',
        'users',
        'profile'
      ].filter(section => hasPermission(section))

      // If current section is not accessible, redirect to first accessible section
      if (accessibleSections.length > 0 && !accessibleSections.includes(activeSection)) {
        setActiveSection(accessibleSections[0])
      }
    }
  }, [user, activeSection, hasPermission, setActiveSection])

  return null
}
