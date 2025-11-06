import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Используем относительный путь - Next.js автоматически добавит домен
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: '/sitemap.xml',
  }
}

