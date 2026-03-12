import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/constants'

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
  openGraph: {
    title: 'Free Serenity Assessment - Know Your Betting Archetype | PlayMind Labs',
    description: 'Discover your betting archetype with our free 12-question behavioral assessment. Takes 2-3 minutes.',
    url: `${BASE_URL}/serenity`,
    siteName: 'PlayMind Labs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Serenity Assessment - Know Your Betting Archetype',
    description: 'Discover your betting archetype with our free 12-question behavioral assessment. Takes 2-3 minutes.',
  },
  alternates: {
    canonical: `${BASE_URL}/serenity`,
  },
}

const serenitySchema = {
  '@context': 'https://schema.org',
  '@type': 'Quiz',
  name: 'PlayMind Labs Serenity Assessment',
  url: `${BASE_URL}/serenity`,
  description: 'Free 12-question behavioral assessment to discover your betting archetype and understand your risk profile.',
  educationalLevel: 'beginner',
  assesses: 'Betting psychology and behavioral patterns',
  about: {
    '@type': 'Thing',
    name: 'Sports Betting Psychology',
  },
  provider: {
    '@type': 'Organization',
    name: 'PlayMind Labs',
    url: BASE_URL,
  },
  hasPart: [
    {
      '@type': 'Question',
      name: 'Emotional betting patterns assessment',
    },
    {
      '@type': 'Question',
      name: 'Impulse control evaluation',
    },
    {
      '@type': 'Question',
      name: 'Budget discipline assessment',
    },
    {
      '@type': 'Question',
      name: 'Chase behavior identification',
    },
  ],
}

export default function SerenityLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serenitySchema) }}
      />
      {children}
    </>
  )
}
