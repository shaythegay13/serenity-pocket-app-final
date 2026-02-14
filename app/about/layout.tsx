import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description: "Meet the team behind PlayMind Labs. Learn about our mission to bring behavioral science and AI to responsible sports betting.",
  keywords: ["PlayMind Labs", "sports betting company", "responsible gambling", "betting analytics team"],
  openGraph: {
    title: "About PlayMind Labs",
    description: "Meet the team behind PlayMind Labs and learn about our mission for responsible sports betting.",
  },
  alternates: {
    canonical: "/about",
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
