import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | Serenity Pocket",
  description: "Get in touch with the Serenity Pocket team. We're here to help with questions about our betting analytics platform and responsible gambling tools.",
  keywords: ["contact betting support", "Serenity Pocket support", "PlayMind Labs contact"],
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
