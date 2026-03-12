import type { Metadata } from "next"
import { BASE_URL } from "@/lib/constants"

export const metadata: Metadata = {
  title: "Pricing - Subscription Plans | PlayMind Labs",
  description: "Choose the right PlayMind Labs plan for you. From free Foundation tier to Apex AI-powered analysis. Start with a 7-day free trial on premium plans.",
  openGraph: {
    title: "PlayMind Labs Pricing - Find Your Perfect Plan",
    description: "Affordable plans for behavioral betting analysis. Free tier available, premium plans with 7-day trial.",
    url: `${BASE_URL}/pricing`,
    siteName: "PlayMind Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayMind Labs Pricing - Find Your Perfect Plan",
    description: "Affordable plans for behavioral betting analysis. Free tier available, premium plans with 7-day trial.",
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
