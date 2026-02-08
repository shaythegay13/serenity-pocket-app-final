"use client"

import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import Link from "next/link"

interface LandingHeaderProps {
  onGetStarted?: () => void
}

export function LandingHeader({ onGetStarted }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800/50 bg-[#0a0a1a]/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">PlayMind Labs</span>
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
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  )
}
