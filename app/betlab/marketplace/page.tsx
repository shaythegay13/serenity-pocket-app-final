"use client"

import { useState, useEffect } from "react"
import { PremiumFeatureWall } from "@/components/premium-feature-wall"
import { supabase } from "@/lib/supabase"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Marketplace } from "@/components/marketplace"

export default function MarketplacePage() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const storedUserData = await storage.getUserData()
          setUserData(storedUserData)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show premium feature wall for free tier users
  if (userData?.subscriptionTier === 'free') {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader userData={userData} />
        <Navigation />
        
        <main className="container mx-auto px-4 py-6">
          <PremiumFeatureWall 
            title="AI Marketplace"
            description="Browse and purchase premium betting tools and analytics"
            featureName="AI Marketplace credits and tools"
          />
        </main>

        <BottomNav />
      </div>
    )
  }

  // Show marketplace for paid users
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userData={userData} />
      <Navigation />
      
      <main className="container mx-auto px-4 py-6">
        <Marketplace userData={userData} />
      </main>

      <BottomNav />
    </div>
  )
}
