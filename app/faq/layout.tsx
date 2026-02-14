import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to common questions about PlayMind Labs' AI betting analysis, emotion tracking, subscription plans, and responsible gambling tools.",
  keywords: ["betting FAQ", "sports betting questions", "responsible gambling FAQ", "AI betting analysis help"],
  openGraph: {
    title: "FAQ - PlayMind Labs",
    description: "Find answers to common questions about AI betting analysis, emotion tracking, and responsible gambling tools.",
  },
  alternates: {
    canonical: "/faq",
  },
}

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
