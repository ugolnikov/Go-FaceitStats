import ClientLoader from '@/components/ui/ClientLoader'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import favicon from './favicon.ico'
import './globals.css'

// Metadata
export const metadata: Metadata = {
	title: 'Faceit CS2 Stats',
	description: 'Faceit CS2 Statistics'
}

type Props = {
	children: React.ReactNode
}

export default async function RootLayout({ children }: Props) {
	return (
		<html>
			<head>
				<link
					rel="icon"
					href={favicon.src}
				/>
			</head>
			<body>
				<ClientLoader />
				<NextIntlClientProvider>{children}</NextIntlClientProvider>
				<SpeedInsights />
				<Analytics />
			</body>
		</html>
	)
}
