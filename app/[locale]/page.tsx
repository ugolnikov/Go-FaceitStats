'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import SearchInput from '@/components/SearchInput'
import LanguageSelector from '@/components/LanguageSelector'
import StructuredData from '@/components/StructuredData'
import { addToHistory } from '@/lib/storage'

export default function Home() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations()
  
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e?: React.FormEvent | string, searchValue?: string) => {
    console.log('handleSubmit called with:', { e, searchValue, input, eType: typeof e })
    
    // Если первый аргумент - строка (вызов из истории или SearchInput), используем её как searchValue
    const actualSearchValue = typeof e === 'string' ? e : searchValue
    if (e && typeof e === 'object' && typeof e.preventDefault === 'function') e.preventDefault();
    const valueToSearch = actualSearchValue || input 
    
    console.log('handleSubmit: valueToSearch =', valueToSearch, 'actualSearchValue =', actualSearchValue)
    
    if (!valueToSearch || !valueToSearch.trim()) {
      console.error('handleSubmit: Empty valueToSearch', { valueToSearch, actualSearchValue, input })
      setError(t('error'))
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
        const errorMessage = data.error || t('error')
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          data: data
        })
        throw new Error(errorMessage)
      }

      // Сохраняем в историю для автокомплита
      addToHistory(valueToSearch.trim(), data.player?.nickname, data.player?.steam_id_64)
      
      // Создаем slug из никнейма или input
      const slug = data.player?.nickname || encodeURIComponent(valueToSearch.trim())
      
      // Перенаправляем на страницу игрока с учетом локали
      router.push(`/player/${slug}`)
    } catch (err: any) {
      console.error('Search Error:', {
        message: err.message,
        error: err,
        input: valueToSearch,
        stack: err.stack
      })
      setError(err.message || t('error'))
      setLoading(false)
    }
  }


  return (
    <div className="container">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem', 
        position: 'relative',
        flexWrap: 'wrap',
        gap: '1rem',
        width: '100%'
      }}>
        <h1 className="title" style={{ width: '50%', margin: 0, textAlign: 'center', flex: 1, minWidth: '200px', paddingRight: '140px' }}>{t('title')}</h1>
        <div style={{ 
          position: 'relative', 
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}>
          <LanguageSelector />
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="input">{t('inputLabel')}</label>
            <SearchInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? t('loading') : t('getStats')}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </div>

      {loading && <div className="loading">{t('loadingStats')}</div>}
    </div>
  )
}

