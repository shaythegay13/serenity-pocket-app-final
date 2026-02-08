import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Features | PlayMind Labs - Behavioral Sports Betting Tools",
  description: "Explore PlayMind Labs's powerful features: AI-powered bet analysis, emotion tracking, cognitive bias detection, and personalized SmartSlip picks for responsible betting.",
  keywords: ["sports betting features", "AI betting analysis", "emotion tracking", "bias detection", "responsible gambling tools"],
  openGraph: {
    title: "PlayMind Labs Features - AI-Powered Betting Analytics",
    description: "Discover powerful behavioral tools for smarter, more disciplined betting decisions.",
    type: "website",
  },
}

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
