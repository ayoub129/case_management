"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '@/lib/api'

interface PagePermission {
  id: number
  name: string
  display_name: string
  description?: string
}

interface User {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  roles?: any[]
  pagePermissions?: PagePermission[]
  page_permissions?: PagePermission[] // API returns this format
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  updatePassword: (data: {
    current_password: string
    password: string
    password_confirmation: string
  }) => Promise<void>
  hasPermission: (permissionName: string) => boolean
  hasAnyPermission: (permissionNames: string[]) => boolean
  getUserPermissions: () => string[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
      // Fetch user data
      authAPI.getUser()
        .then(response => {
          setUser(response.data.data)
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('auth_token')
          setToken(null)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      const { token: newToken, user: userData } = response.data.data
      
      localStorage.setItem('auth_token', newToken)
      setToken(newToken)
      setUser(userData)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    // Call logout API (but don't wait for it)
    authAPI.logout().catch(() => {
      // Ignore errors on logout
    })
    
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(data)
      setUser(response.data.data)
    } catch (error) {
      throw error
    }
  }

  const updatePassword = async (data: {
    current_password: string
    password: string
    password_confirmation: string
  }) => {
    try {
      await authAPI.updatePassword(data)
    } catch (error) {
      throw error
    }
  }

  // Permission checking methods
  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false
    
    // Admin users have all permissions
    if (user.roles?.some(role => role.name === 'admin')) {
      return true
    }
    
    // Handle both property names (API returns page_permissions)
    const permissions = user.pagePermissions || user.page_permissions || []
    return permissions.some(permission => permission.name === permissionName)
  }

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    if (!user) return false
    
    // Admin users have all permissions
    if (user.roles?.some(role => role.name === 'admin')) {
      return true
    }
    
    // Handle both property names (API returns page_permissions)
    const permissions = user.pagePermissions || user.page_permissions || []
    return permissions.some(permission => permissionNames.includes(permission.name))
  }

  const getUserPermissions = (): string[] => {
    // Handle both property names (API returns page_permissions)
    const permissions = user?.pagePermissions || user?.page_permissions || []
    return permissions.map(permission => permission.name)
  }

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateProfile,
    updatePassword,
    hasPermission,
    hasAnyPermission,
    getUserPermissions,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 