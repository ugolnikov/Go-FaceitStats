import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import favicon from './src/favicon.ico'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

// Автоматическое определение базового URL
function getBaseUrl(): string {
  // В production на Vercel используем автоматическое определение
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  // Для локальной разработки
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  // Fallback для production - Next.js автоматически определит из заголовков запроса
  // Но metadataBase требует URL, поэтому используем placeholder
  return 'https://faceit-stats.ugolnikov-do.ru/'
}

// export const metadata: Metadata = {
//   metadataBase: new URL(getBaseUrl()),
//   title: {
//     default: 'Faceit CS2 Stats - Статистика игроков Faceit',
//     template: '%s | Faceit CS2 Stats'
//   },
//   description: 'Получайте детальную статистику игроков Faceit CS2 по никнейму или Steam ссылке. ELO, K/D, ADR, винрейт и многое другое.',
//   keywords: ['faceit', 'cs2', 'counter-strike', 'статистика', 'stats', 'elo', 'faceit stats', 'cs2 stats'],
//   authors: [{ name: 'Faceit Stats' }],
//   creator: 'Faceit Stats',
//   publisher: 'Faceit Stats',
//   formatDetection: {
//     email: false,
//     address: false,
//     telephone: false,
//   },
//   openGraph: {
//     type: 'website',
//     locale: 'ru_RU',
//     url: '/',
//     siteName: 'Faceit CS2 Stats',
//     title: 'Faceit CS2 Stats - Статистика игроков Faceit',
//     description: 'Получайте детальную статистику игроков Faceit CS2 по никнейму или Steam ссылке. ELO, K/D, ADR, винрейт и многое другое.',
//     images: [
//       {
//         url: '/og-image.png',
//         width: 1200,
//         height: 630,
//         alt: 'Faceit CS2 Stats',
//       },
//     ],
//   },
//   twitter: {
//     card: 'summary_large_image',
//     title: 'Faceit CS2 Stats - Статистика игроков Faceit',
//     description: 'Получайте детальную статистику игроков Faceit CS2 по никнейму или Steam ссылке.',
//     images: ['/og-image.png'],
//   },
//   robots: {
//     index: true,
//     follow: true,
//     googleBot: {
//       index: true,
//       follow: true,
//       'max-video-preview': -1,
//       'max-image-preview': 'large',
//       'max-snippet': -1,
//     },
//   },
//   verification: {
//     // Добавьте здесь коды верификации для Google, Yandex и т.д. если нужно
//   },
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href={favicon.src} />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
        <SpeedInsights/>
        <Analytics/>
      </body>
    </html>
    
  )
}

