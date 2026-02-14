import { Metadata } from "next"

export const metadata: Metadata = {
  title: "How It Works",
  description: "Learn how PlayMind Labs helps you make smarter betting decisions with AI-powered analysis, emotion tracking, and behavioral psychology insights.",
  keywords: ["how betting analytics work", "AI sports betting", "behavioral betting", "emotion tracking betting"],
  openGraph: {
    title: "How PlayMind Labs Works",
    description: "Learn how AI-powered analysis, emotion tracking, and behavioral psychology help you make smarter betting decisions.",
  },
  alternates: {
    canonical: "/how-it-works",
  },
}

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
