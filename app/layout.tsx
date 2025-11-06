import {NextIntlClientProvider} from 'next-intl';
import type { Metadata } from 'next'
import './globals.css'
import favicon from './src/favicon.ico'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: 'Faceit CS2 Stats',
  description: 'Faceit CS2 Statistics',
}

type Props = {
  children: React.ReactNode;
};

export default async function RootLayout({children}: Props) {
  return (
    <html>
      <head>
        <link rel="icon" href={favicon.src} />
      </head>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <SpeedInsights/>
        <Analytics/>
      </body>
    </html>
  )
}

