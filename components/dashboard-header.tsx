"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import Image from "next/image"
import { SerenityTokenDisplay } from "@/components/serenity-token-display"
import type { UserData } from "@/lib/types"

interface DashboardHeaderProps {
  userData?: UserData
}

export function DashboardHeader({ userData }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Serenity Pocket" width={60} height={60} />
            <div>
              <h1 className="text-xl font-bold text-foreground">Serenity Pocket</h1>
              <p className="text-xs text-muted-foreground">Mindful Trading Psychology</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userData && <SerenityTokenDisplay tokens={userData.serenityTokens} />}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
