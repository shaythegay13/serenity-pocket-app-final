import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Responsible Gambling | Serenity Pocket",
  description: "Learn about responsible gambling practices and how Serenity Pocket helps you maintain healthy betting habits with behavioral tools and safeguards.",
  keywords: ["responsible gambling", "betting safety", "gambling help", "betting limits", "problem gambling resources"],
}

export default function ResponsibleUseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
