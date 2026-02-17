"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface LandingHeaderProps {
  onGetStarted?: () => void
}

export function LandingHeader({ onGetStarted }: LandingHeaderProps) {
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/50 bg-[#0a0a1a]/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={isAuthed ? "/home" : "/"} className="flex items-center">
            <Image
              src="/logo.png"
              alt="PlayMind Labs Logo"
              width={40}
              height={40}
              className="rounded-md logo-dark-mode"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
              Dashboard
            </a>
            <a href="#analytics" className="text-sm text-gray-400 hover:text-white transition-colors">
              Analyze
            </a>
            <a href="#insights" className="text-sm text-gray-400 hover:text-white transition-colors">
              Insights
            </a>
            <a href="#performance" className="text-sm text-gray-400 hover:text-white transition-colors">
              Performance
            </a>
          </nav>

          {/* CTA */}
          <Button
            onClick={onGetStarted}
            className="bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  )
}
