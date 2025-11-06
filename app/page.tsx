'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import LanguageSelector from '@/components/LanguageSelector'
import StructuredData from '@/components/StructuredData'
import { useLanguage } from '@/contexts/LanguageContext'
import { addToHistory, getSearchHistory, clearHistory, SearchHistoryItem } from '@/lib/storage'

// Динамический импорт для оптимизации загрузки
const SearchInput = lazy(() => import('@/components/SearchInput'))

export default function Home() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const { t } = useLanguage()

  useEffect(() => {
    // Загружаем историю только на клиенте
    setHistory(getSearchHistory())
  }, [])

  const handleSubmit = async (e?: React.FormEvent | string, searchValue?: string) => {
    // Если первый аргумент - строка (вызов из SearchInput), используем её как searchValue
    const actualSearchValue = typeof e === 'string' ? e : searchValue
    if (e && typeof e === 'object' && typeof e.preventDefault === 'function') e.preventDefault();
    const valueToSearch = actualSearchValue || input 
    if (!valueToSearch.trim()) {
      setError(t.error)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Сначала проверяем, существует ли игрок
      const response = await fetch('/api/faceit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: valueToSearch.trim(), matchesLimit: 1 }), // Минимальный запрос для проверки
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t.error)
      }

      // Сохраняем в историю
      addToHistory(valueToSearch.trim(), data.player?.nickname, data.player?.steam_id_64)
      setHistory(getSearchHistory())
      
      // Создаем slug из никнейма или input
      const slug = data.player?.nickname || encodeURIComponent(valueToSearch.trim())
      
      // Перенаправляем на страницу игрока
      router.push(`/player/${slug}`)
    } catch (err: any) {
      setError(err.message || t.error)
      setLoading(false)
    }
  }

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  const handleHistorySelect = (inputValue: string) => {
    setInput(inputValue)
    setTimeout(() => handleSubmit(), 100)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://faceit-stats.vercel.app'
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Faceit CS2 Stats',
    description: 'Получайте детальную статистику игроков Faceit CS2 по никнейму или Steam ссылке. ELO, K/D, ADR, винрейт и многое другое.',
    url: baseUrl,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: '100',
    },
  }

  return (
    <div className="container">
      <StructuredData data={structuredData} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
        <h1 className="title" style={{ margin: 0, textAlign: 'center' }}>{t.title}</h1>
        <div style={{ position: 'absolute', right: 0 }}>
          <LanguageSelector />
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="input">{t.inputLabel}</label>
            <Suspense fallback={<div style={{ padding: '1rem', color: '#ffffff' }}>Loading...</div>}>
              <SearchInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                disabled={loading}
              />
            </Suspense>
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? t.loading : t.getStats}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>

      {loading && <div className="loading">{t.loadingStats}</div>}

      {history.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#ffffff', fontSize: '1.2rem' }}>{t.history}</h3>
            <button
              onClick={handleClearHistory}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1a1a1a'
                e.currentTarget.style.borderColor = '#ff4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = '#333'
              }}
            >
              {t.clearHistory}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {history.slice(0, 10).map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistorySelect(item.input)}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#ffffff',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2a2a'
                  e.currentTarget.style.borderColor = '#ffffff'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1a1a1a'
                  e.currentTarget.style.borderColor = '#333'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {item.input}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

