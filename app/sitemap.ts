import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.playmindlabs.com'

  // Static public pages
  const staticPages = [
    '',
    '/features',
    '/pricing',
    '/how-it-works',
    '/about',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/responsible-use',
  ]

  return staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1
      : ['/check-in', '/serenity', '/pgsi'].includes(route) ? 0.9
      : route === '/features' || route === '/pricing' ? 0.8
      : 0.7,
  }))
}
