import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Serenity Assessment - Know Your Betting Archetype | PlayMind Labs',
  description:
    'Discover your betting archetype with our free 12-question behavioral assessment. Research-backed questions reveal how psychology influences your sports betting decisions. Takes 2-3 minutes.',
  keywords: [
    'betting archetype',
    'gambling assessment',
    'behavioral betting quiz',
    'sports betting psychology test',
    'serenity assessment',
    'betting personality type',
  ],
}

export default function SerenityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
