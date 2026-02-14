import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing - Subscription Plans",
  description: "Choose the right PlayMind Labs plan for you. From free Foundation tier to Apex AI-powered analysis. Start with a 7-day free trial on premium plans.",
  keywords: ["sports betting subscription", "betting analytics pricing", "responsible gambling subscription", "AI betting tools pricing"],
  openGraph: {
    title: "PlayMind Labs Pricing - Find Your Perfect Plan",
    description: "Affordable plans for behavioral betting analysis. Free tier available, premium plans with 7-day trial.",
  },
  alternates: {
    canonical: "/pricing",
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
