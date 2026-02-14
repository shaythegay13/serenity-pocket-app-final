import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Emotional Check-In for Sports Bettors | PlayMind Labs',
  description:
    'Track your emotions before, during, and after betting with our free check-in tool. Understand how feelings like tilt, FOMO, and overconfidence impact your betting decisions. No account required.',
  keywords: [
    'emotional check-in',
    'betting psychology',
    'sports betting emotions',
    'tilt prevention',
    'responsible gambling',
    'betting mindset',
    'FOMO betting',
  ],
}

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
