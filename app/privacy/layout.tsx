import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Serenity Pocket",
  description: "Serenity Pocket privacy policy. Learn how we collect, use, and protect your data when using our betting analytics platform.",
  keywords: ["privacy policy", "data protection", "betting data privacy"],
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
