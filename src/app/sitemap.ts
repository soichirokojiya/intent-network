import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://musu.world', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://musu.world/lp', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://musu.world/terms', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://musu.world/privacy', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: 'https://musu.world/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]
}
