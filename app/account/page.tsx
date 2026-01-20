"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { AccountTab } from "@/components/tabs/account-tab"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function AccountPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          setUserData(profile)
        }
      }
      setLoading(false)
    }

    fetchUserData()
  }, [])

  const updateUserData = async (updates: any) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', session.user.id)
      
      if (!error) {
        setUserData((prev: any) => prev ? { ...prev, ...updates } : null)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Account Settings</h1>
          <div className="space-y-6">
            {userData && <AccountTab userData={userData} updateUserData={updateUserData} />}
            <Link 
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
