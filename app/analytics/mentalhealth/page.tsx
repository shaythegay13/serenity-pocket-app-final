"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"

export default function MentalHealthPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Mental Health Analytics</h1>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Monitor your emotional patterns and mental wellbeing related to betting activities.
            </p>
            <Link 
              href="/analytics"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Back to Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
