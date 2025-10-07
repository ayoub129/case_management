"use client"

import { useAuth } from "@/components/auth-context"
import { LoginPage } from "./login-page"
import { useEffect, useState } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
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
      ].filter(section => {
        // Admin users have all permissions
        if (user.roles?.some(role => role.name === 'admin')) {
          return true
        }
        // Handle both property names (API returns page_permissions)
        const permissions = user.pagePermissions || user.page_permissions || []
        return permissions.some(permission => permission.name === section)
      })

      // If user has no accessible sections, mark for redirect
      if (accessibleSections.length === 0) {
        setShouldRedirect(true)
      }
    }
  }, [isLoading, user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  // If user has no accessible sections, show access denied
  if (shouldRedirect) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
          <p className="text-gray-600">
            Vous n'avez aucune permission pour accéder au système.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 