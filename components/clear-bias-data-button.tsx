"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { storageHybrid as storage } from "@/lib/storage-hybrid"

/**
 * Temporary component to clear old bias quiz history
 * Remove this component after clearing your test data
 */
export function ClearBiasDataButton() {
  const handleClear = async () => {
    if (!confirm("⚠️ This will delete ALL your bias quiz history and profile. Are you sure?")) {
      return
    }

    try {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('serenity_bias_history')
        localStorage.removeItem('serenity_bias_profile')
      }

      // Note: Supabase data needs to be cleared via SQL Editor
      // The script is in scripts/clear-bias-history.sql

      alert('✅ Local bias data cleared! If you\'re logged in, run the SQL script in Supabase to clear cloud data.')
      window.location.reload()
    } catch (error) {
      console.error('Error clearing bias data:', error)
      alert('❌ Error clearing data. Check console.')
    }
  }

  return (
    <Button 
      onClick={handleClear} 
      variant="destructive" 
      size="sm"
      className="gap-2"
    >
      <Trash2 className="h-4 w-4" />
      Clear Old Quiz Data
    </Button>
  )
}
