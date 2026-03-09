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
import { AuthProvider } from "@/contexts/AuthContext"

const inter = Inter({ subsets: ["latin"] })

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.playmindlabs.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "PlayMind Labs - Behavioral Sports Betting Analytics",
    template: "%s | PlayMind Labs",
  },
  description: "Your behavioral betting companion for smarter, data-driven play. The seatbelt for responsible betting.",
  manifest: "/manifest.json",
  keywords: ["sports betting", "betting psychology", "responsible gambling", "odds comparison", "bet analysis", "tilt prevention"],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    siteName: "PlayMind Labs",
    title: "PlayMind Labs - Behavioral Sports Betting Analytics",
    description: "AI-powered behavioral sports betting analytics. Emotion tracking, cognitive bias detection, and responsible gambling tools.",
    url: BASE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayMind Labs - Behavioral Sports Betting Analytics",
    description: "AI-powered behavioral sports betting analytics. Emotion tracking, cognitive bias detection, and responsible gambling tools.",
  },
  alternates: {
    canonical: BASE_URL,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PlayMind Labs",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: "AI-powered behavioral sports betting analytics platform helping bettors make smarter, more disciplined decisions through emotion tracking, cognitive bias detection, and responsible gambling tools.",
  foundingDate: "2025",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${BASE_URL}/contact`,
  },
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PlayMind Labs",
  url: BASE_URL,
  description: "Behavioral sports betting analytics platform",
}

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PlayMind Labs",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  description: "AI-powered behavioral sports betting analytics with emotion tracking, cognitive bias detection, SmartSlip AI picks, and responsible gambling tools.",
  offers: [
    {
      "@type": "Offer",
      name: "Foundation",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier with core behavioral tools",
    },
    {
      "@type": "Offer",
      name: "Focus",
      price: "19.99",
      priceCurrency: "USD",
      description: "Premium tier with analytics and weekly AI picks",
    },
    {
      "@type": "Offer",
      name: "Mastery",
      price: "39.99",
      priceCurrency: "USD",
      description: "Advanced tier with TiltLab and 3x weekly AI picks",
    },
    {
      "@type": "Offer",
      name: "Apex",
      price: "79.99",
      priceCurrency: "USD",
      description: "Full access with daily AI picks and priority support",
    },
  ],
  featureList: [
    "Emotion Tracking & Check-ins",
    "Emotional Wellness Score",
    "Cooldown Mode & Safety Controls",
    "AI-Powered SmartSlip Picks",
    "TiltLab Emotional Analysis",
    "Cognitive Bias Detection",
    "Betting Performance Analytics",
    "PGSI Assessment",
    "Serenity Archetype Assessment",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=2" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
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
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
