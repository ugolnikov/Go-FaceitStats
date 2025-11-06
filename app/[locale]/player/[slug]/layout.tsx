import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)

  // Используем только slug для метаданных без блокирующего fetch
  // Это значительно ускоряет рендеринг страницы
  // Данные игрока будут загружены на клиенте
  const title = `${decodedSlug} - Faceit CS2 Stats`
  const description = `Статистика игрока ${decodedSlug} на Faceit CS2. ELO, K/D, ADR, винрейт и другая статистика.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `/player/${slug}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `/player/${slug}`,
    },
  }
}

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

