import { BASE_URL } from '@/lib/constants'

const featuresSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'PlayMind Labs Platform Features',
  description: 'Comprehensive list of behavioral sports betting tools and features available on PlayMind Labs.',
  url: `${BASE_URL}/features`,
  numberOfItems: 4,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Emotion Tracking & Check-ins',
      description: 'Monitor your emotional state before, during, and after betting decisions.',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'AI-Powered SmartSlip Picks',
      description: 'Receive personalized AI betting recommendations tailored to your profile and risk tolerance.',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'TiltLab Emotional Analysis',
      description: 'Deep behavioral analysis to identify emotional triggers affecting your betting decisions.',
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: 'Cooldown Mode & Safety Controls',
      description: 'Built-in safeguards to prevent impulsive betting during emotional volatility.',
    },
  ],
}

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featuresSchema) }}
      />
      {children}
    </>
  )
}
