import { routing } from '@/i18n/routing'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

type Props = {
	children: ReactNode
	params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params

	// Ensure that the incoming `locale` is valid
	if (!hasLocale(routing.locales, locale)) {
		notFound()
	}

	// Enable static rendering
	setRequestLocale(locale)

	// Provide all messages to the client
	// The next-intl plugin will load them from the file system
	const messages = await getMessages()

	return (
		<>
			<NextIntlClientProvider messages={messages}>
				{children}
			</NextIntlClientProvider>
		</>
	)
}
