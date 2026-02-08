import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Demo | PlayMind Labs",
  description: "Watch demos and tutorials to learn how to use PlayMind Labs for smarter betting decisions.",
  keywords: ["betting demo", "sports betting tutorial", "PlayMind Labs demo"],
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
