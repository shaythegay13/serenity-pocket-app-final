import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Serenity Pocket",
  description: "Serenity Pocket terms of service. Read our terms and conditions for using our AI-powered betting analytics platform.",
  keywords: ["terms of service", "betting platform terms", "user agreement"],
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
