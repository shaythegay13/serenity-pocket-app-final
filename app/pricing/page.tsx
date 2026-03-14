import { Metadata } from "next"
import { BASE_URL } from "@/lib/constants"
import { PricingClient } from "@/components/pricing-client"
import { FooterPageWrapper } from "@/components/footer-page-wrapper"

export const metadata: Metadata = {
  title: "Pricing | PlayMind Labs",
  description: "View PlayMind Labs subscription plans. Choose the right tier for your behavioral sports betting analysis needs.",
  openGraph: {
    title: "Pricing - PlayMind Labs",
    description: "View PlayMind Labs subscription plans.",
    url: `${BASE_URL}/pricing`,
    siteName: "PlayMind Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing - PlayMind Labs",
    description: "View PlayMind Labs subscription plans.",
  },
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
}

export default function PricingPage() {
  return (
    <FooterPageWrapper>
      <PricingClient />
    </FooterPageWrapper>
  )
}
