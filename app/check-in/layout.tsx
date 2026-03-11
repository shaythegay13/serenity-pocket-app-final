import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/constants'

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
  openGraph: {
    title: 'Free Emotional Check-In for Sports Bettors | PlayMind Labs',
    description: 'Track your emotions before, during, and after betting. Understand how feelings impact your decisions.',
    url: `${BASE_URL}/check-in`,
    siteName: 'PlayMind Labs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Emotional Check-In for Sports Bettors',
    description: 'Track your emotions before, during, and after betting. Understand how feelings impact your decisions.',
  },
  alternates: {
    canonical: `${BASE_URL}/check-in`,
  },
}

const checkInSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PlayMind Labs Emotional Check-In',
  url: `${BASE_URL}/check-in`,
  applicationCategory: 'HealthApplication',
  description: 'Free emotional check-in tool for sports bettors to track feelings before, during, and after betting decisions.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free - no account required',
  },
  featureList: [
    'Track 6 core emotions with 10 sub-emotions',
    'Rate emotional intensity',
    'Log timing (before/during/after betting)',
    'Build self-awareness patterns',
    'Prevent tilt and FOMO-driven decisions',
  ],
  provider: {
    '@type': 'Organization',
    name: 'PlayMind Labs',
    url: BASE_URL,
  },
}

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(checkInSchema) }}
      />
      {children}
    </>
  )
}
