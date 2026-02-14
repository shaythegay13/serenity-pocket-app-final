import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.playmindlabs.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/home/',
          '/dashboard/',
          '/account/',
          '/profile/',
          '/betlab/',
          '/analytics/',
          '/onboarding/',
          '/auth/',
          '/pgsi-survey/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
