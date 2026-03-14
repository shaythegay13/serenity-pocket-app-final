"use client"

import { ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface FooterPageWrapperProps {
  children: ReactNode
}

export function FooterPageWrapper({ children }: FooterPageWrapperProps) {
  const [backHref, setBackHref] = useState("/")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setBackHref("/home")
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <Link href={backHref}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Main Page
            </Button>
          </Link>
        </div>
      </div>
      <main>
        {children}
      </main>
    </div>
  )
}
