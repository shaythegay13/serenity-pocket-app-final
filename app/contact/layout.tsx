import type { Metadata } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.playmindlabs.com'

export const metadata: Metadata = {
  title: "Contact Us | PlayMind Labs",
  description: "Get in touch with the PlayMind Labs team. We're here to help with questions about our betting analytics platform and responsible gambling tools.",
  openGraph: {
    title: "Contact PlayMind Labs",
    description: "Get in touch with our team for questions about betting analytics and responsible gambling tools.",
    url: `${BASE_URL}/contact`,
    siteName: 'PlayMind Labs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Contact PlayMind Labs",
    description: "Get in touch with our team for questions about betting analytics and responsible gambling tools.",
  },
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
