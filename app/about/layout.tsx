import type { Metadata } from "next"
import { BASE_URL } from "@/lib/constants"

export const metadata: Metadata = {
  title: "About Us | PlayMind Labs",
  description: "Meet the team behind PlayMind Labs. Learn about our mission to bring behavioral science and AI to responsible sports betting.",
  openGraph: {
    title: "About PlayMind Labs",
    description: "Meet the team behind PlayMind Labs and learn about our mission for responsible sports betting.",
    url: `${BASE_URL}/about`,
    siteName: "PlayMind Labs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About PlayMind Labs",
    description: "Meet the team behind PlayMind Labs and learn about our mission for responsible sports betting.",
  },
  alternates: {
    canonical: `${BASE_URL}/about`,
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
