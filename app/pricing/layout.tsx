import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing | Serenity Pocket - Subscription Plans",
  description: "Choose the right Serenity Pocket plan for you. From free Foundation tier to Elite AI-powered analysis. Start with a 7-day free trial on premium plans.",
  keywords: ["sports betting subscription", "betting analytics pricing", "responsible gambling subscription", "AI betting tools pricing"],
  openGraph: {
    title: "Serenity Pocket Pricing - Find Your Perfect Plan",
    description: "Affordable plans for behavioral betting analysis. Free tier available, premium plans with 7-day trial.",
    type: "website",
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
