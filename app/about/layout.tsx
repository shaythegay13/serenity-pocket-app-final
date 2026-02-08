import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Serenity Pocket - PlayMind Labs",
  description: "Meet the team behind Serenity Pocket. Learn about our mission to bring behavioral science and AI to responsible sports betting.",
  keywords: ["PlayMind Labs", "sports betting company", "responsible gambling", "betting analytics team"],
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
