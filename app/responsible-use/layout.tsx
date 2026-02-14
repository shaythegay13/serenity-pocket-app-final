import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Responsible Gambling",
  description: "Learn about responsible gambling practices and how PlayMind Labs helps you maintain healthy betting habits with behavioral tools and safeguards.",
  keywords: ["responsible gambling", "betting safety", "gambling help", "betting limits", "problem gambling resources"],
  openGraph: {
    title: "Responsible Gambling - PlayMind Labs",
    description: "Learn about responsible gambling practices and behavioral tools for maintaining healthy betting habits.",
  },
  alternates: {
    canonical: "/responsible-use",
  },
}

export default function ResponsibleUseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
