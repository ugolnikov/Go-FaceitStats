import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Используем относительные пути - Next.js автоматически добавит домен
  return [
    {
      url: '/',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: '/player',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ]
}

