"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface NavigationContextType {
  activeSection: string
  setActiveSection: (section: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState("dashboard")

  // Handle URL parameters for navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const section = urlParams.get('section')
      if (section) {
        setActiveSection(section)
      }
    }
  }, [])

  // Update URL when section changes
  const handleSetActiveSection = (section: string) => {
    setActiveSection(section)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('section', section)
      window.history.pushState({}, '', url.toString())
    }
  }

  const value = {
    activeSection,
    setActiveSection: handleSetActiveSection,
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
} 