"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

import { supabase } from "@/lib/supabase"

export function SimpleHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    setMounted(true)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const toggleTheme = () => {
    const current = resolvedTheme ?? "light"
    setTheme(current === "dark" ? "light" : "dark")
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={isAuthed ? "/home" : "/"} className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="PlayMind Labs"
              width={162}
              height={162}
              className="h-[108px] w-[108px] sm:h-[126px] sm:w-[126px]"
              priority
            />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              PlayMind Labs
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={toggleTheme}
              type="button"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Button asChild>
              <Link href="/account">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
