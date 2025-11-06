import type { Metadata } from 'next'

async function getPlayerData(slug: string) {
  try {
    const decodedSlug = decodeURIComponent(slug)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    const response = await fetch(
      `${baseUrl}/api/faceit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: decodedSlug, matchesLimit: 1 }),
        cache: 'no-store', // Для динамических данных
        next: { revalidate: 0 }, // Отключаем кеширование для метаданных
      }
    )

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    // Если не удалось получить данные, возвращаем null
    // Метаданные будут использовать fallback значения
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  
  // Пытаемся получить данные игрока для метаданных
  const playerData = await getPlayerData(slug)
  
  if (!playerData || !playerData.player) {
    return {
      title: `${decodedSlug} - Статистика игрока`,
      description: `Статистика игрока ${decodedSlug} на Faceit CS2`,
    }
  }

  const player = playerData.player
  const cs2Stats = playerData.games?.cs2
  const elo = cs2Stats?.faceit_elo || 'N/A'
  const level = cs2Stats?.skill_level || 'N/A'
  const nickname = player.nickname || decodedSlug

  const title = `${nickname} - Faceit CS2 Stats`
  const description = `Статистика игрока ${nickname} на Faceit CS2. ELO: ${elo}, Уровень: ${level}. K/D, ADR, винрейт и другая статистика.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: player.avatar
        ? [
            {
              url: player.avatar,
              width: 400,
              height: 400,
              alt: nickname,
            },
          ]
        : [],
      url: `/player/${slug}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: player.avatar ? [player.avatar] : [],
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

