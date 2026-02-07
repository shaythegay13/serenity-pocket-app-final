import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { FlowgladProviderWrapper } from "@/components/flowglad-provider-wrapper"
import { Footer } from "@/components/footer"
import { FlowProvider } from "@/contexts/FlowContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PlayMind Labs - Behavioral Sports Betting Analytics",
  description: "Your behavioral betting companion for smarter, data-driven play. The seatbelt for responsible betting.",
  manifest: "/manifest.json",
  generator: 'v0.app',
  keywords: ["sports betting", "betting psychology", "responsible gambling", "odds comparison", "bet analysis", "tilt prevention"]
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <FlowProvider>
              <FlowgladProviderWrapper>
                <div className="min-h-screen flex flex-col">
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                </div>
              </FlowgladProviderWrapper>
            </FlowProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
