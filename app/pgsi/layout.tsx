import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free PGSI Assessment for Sports Bettors | PlayMind Labs',
  description:
    'Take the validated Problem Gambling Severity Index adapted for sports betting (PGSI-SB). Understand your risk level with this free, confidential 9-question assessment. No account required.',
  keywords: [
    'PGSI',
    'problem gambling assessment',
    'gambling risk test',
    'sports betting risk',
    'responsible gambling screening',
    'PGSI-SB',
    'gambling self-assessment',
  ],
}

export default function PGSILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
