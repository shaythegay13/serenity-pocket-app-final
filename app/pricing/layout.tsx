import type { Metadata } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.playmindlabs.com'

export const metadata: Metadata = {
  title: "Pricing | PlayMind Labs",
  description: "Choose the right PlayMind Labs plan for you. From free Foundation tier to Apex AI-powered analysis. Start smarter betting today.",
  openGraph: {
    title: "PlayMind Labs Pricing – Find Your Perfect Plan",
    description: "Affordable plans for behavioral betting analysis. Free tier available, premium plans with AI picks and advanced analytics.",
    url: `${BASE_URL}/pricing`,
    siteName: 'PlayMind Labs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "PlayMind Labs Pricing – Find Your Perfect Plan",
    description: "Affordable plans for behavioral betting analysis. Free tier available, premium plans with AI picks and advanced analytics.",
  },
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
