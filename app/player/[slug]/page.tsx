'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import StatsDisplay from '@/components/StatsDisplay'
import LanguageSelector from '@/components/LanguageSelector'
import SearchInput from '@/components/SearchInput'
import StructuredData from '@/components/StructuredData'
import { useLanguage } from '@/contexts/LanguageContext'
import { addToHistory, getSearchHistory } from '@/lib/storage'

export default function PlayerPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { t } = useLanguage()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [matchesLimit, setMatchesLimit] = useState<number>(30)
  const [searchInput, setSearchInput] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      try {
        // Декодируем slug (может быть закодированным URL)
        const decodedSlug = decodeURIComponent(slug)
        
        const response = await fetch('/api/faceit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: decodedSlug, matchesLimit }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t.error)
        }

        setStats(data)
      } catch (err: any) {
        setError(err.message || t.error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [slug, matchesLimit, t])

  const handleMatchesLimitChange = async (limit: number) => {
    setMatchesLimit(limit)
    // Статистика перезагрузится автоматически через useEffect
  }

  const handleSearchSubmit = async (searchValue?: string) => {
    const valueToSearch = searchValue || searchInput
    if (!valueToSearch.trim()) {
      setSearchError(t.error)
      return
    }

    setSearchLoading(true)
    setSearchError(null)

    try {
      const response = await fetch('/api/faceit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: valueToSearch.trim(), matchesLimit: 1 }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.error)
      }

      // Сохраняем в историю
      addToHistory(valueToSearch.trim(), data.player?.nickname, data.player?.steam_id_64)
      
      // Создаем slug из никнейма или input
      const newSlug = data.player?.nickname || encodeURIComponent(valueToSearch.trim())
      
      // Перенаправляем на страницу игрока
      router.push(`/player/${newSlug}`)
    } catch (err: any) {
      setSearchError(err.message || t.error)
      setSearchLoading(false)
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://faceit-stats.vercel.app'
  
  // Структурированные данные для игрока
  const structuredData = stats ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: stats.player.nickname,
    description: `Статистика игрока ${stats.player.nickname} на Faceit CS2`,
    url: `${baseUrl}/player/${slug}`,
    image: stats.player.avatar,
    sameAs: [
      stats.player.faceit_url,
      stats.player.steam_id_64 ? `https://steamcommunity.com/profiles/${stats.player.steam_id_64}` : null,
    ].filter(Boolean),
    ...(stats.games?.cs2 && {
      knowsAbout: {
        '@type': 'Thing',
        name: 'Counter-Strike 2',
        description: `ELO: ${stats.games.cs2.faceit_elo}, Уровень: ${stats.games.cs2.skill_level}`,
      },
    }),
  } : null

  return (
    <div className="container">
      {structuredData && <StructuredData data={structuredData} />}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
        <h1 className="title" style={{ margin: 0, textAlign: 'center' }}>{t.title}</h1>
        <div style={{ position: 'absolute', right: 0 }}>
          <LanguageSelector />
        </div>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            height: '-webkit-fill-available'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2a2a2a'
            e.currentTarget.style.borderColor = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1a1a1a'
            e.currentTarget.style.borderColor = '#333'
          }}
        >
          ← {t.back || 'Назад'}
        </button>
        
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }}>
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={handleSearchSubmit}
              disabled={searchLoading || loading}
            />
            {searchError && (
              <div style={{ color: '#ff4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                {searchError}
              </div>
            )}
          </form>
        </div>
      </div>

      {loading && <div className="loading">{t.loadingStats}</div>}

      {error && (
        <div className="card">
          <div className="error">{error}</div>
        </div>
      )}

      {stats && (
        <StatsDisplay 
          stats={stats} 
          matchesLimit={matchesLimit} 
          setMatchesLimit={handleMatchesLimitChange}
        />
      )}
    </div>
  )
}

