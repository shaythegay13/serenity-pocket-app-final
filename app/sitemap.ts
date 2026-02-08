import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://serenitypocket.com'

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
    '/login',
    '/survey',
  ]

  return staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route === '/features' || route === '/pricing' ? 0.9 : 0.7,
  }))
}
