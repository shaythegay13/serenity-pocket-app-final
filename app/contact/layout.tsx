import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the PlayMind Labs team. We're here to help with questions about our betting analytics platform and responsible gambling tools.",
  keywords: ["contact betting support", "PlayMind Labs support", "PlayMind Labs contact"],
  openGraph: {
    title: "Contact PlayMind Labs",
    description: "Get in touch with our team for questions about betting analytics and responsible gambling tools.",
  },
  alternates: {
    canonical: "/contact",
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
