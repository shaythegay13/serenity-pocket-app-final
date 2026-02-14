import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PlayMind Labs privacy policy. Learn how we collect, use, and protect your data when using our betting analytics platform.",
  keywords: ["privacy policy", "data protection", "betting data privacy"],
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
