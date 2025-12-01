'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { getSearchHistory, SearchHistoryItem } from '@/lib/storage'

function getHistoryDisplayName(item: SearchHistoryItem): string {
  if (item.playerName && item.playerName.trim()) {
    return item.playerName
  }

  const input = item.input || ''

  // Пытаемся вытащить что-то человекопонятное из Steam-ссылки
  try {
    const urlString = input.startsWith('http://') || input.startsWith('https://')
      ? input
      : `https://${input}`
    const url = new URL(urlString)

    if (url.hostname === 'steamcommunity.com' || url.hostname.endsWith('.steamcommunity.com')) {
      const vanityMatch = url.pathname.match(/^\/id\/([^/]+)/)
      if (vanityMatch) return vanityMatch[1]

      const profileMatch = url.pathname.match(/^\/profiles\/(\d+)/)
      if (profileMatch) return profileMatch[1]
    }
  } catch {
    // не URL — игнорируем
  }

  return input
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (searchValue?: string) => void 
  disabled?: boolean
}

export default function SearchInput({ value, onChange, onSubmit, disabled }: SearchInputProps) {
  const t = useTranslations()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<SearchHistoryItem[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isFocused) {
      setShowSuggestions(false)
      return
    }

    if (value.trim()) {
      const history = getSearchHistory()
      const filtered = history
        .filter(item => 
          item.input.toLowerCase().includes(value.toLowerCase()) &&
          item.input.toLowerCase() !== value.toLowerCase()
        )
        .slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      const history = getSearchHistory().slice(0, 5)
      setSuggestions(history)
      setShowSuggestions(history.length > 0)
    }
  }, [value, isFocused])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSuggestionClick = (suggestion: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Устанавливаем значение
    onChange(suggestion)
    setShowSuggestions(false)
    
    // Выполняем поиск с новым значением
    // Не устанавливаем setIsFocused(false) здесь, чтобы onBlur обработал это корректно
    setTimeout(() => {
      onSubmit(suggestion)
      // Убираем фокус после выполнения поиска
      if (inputRef.current) {
        inputRef.current.blur()
      }
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit(value)
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        id="search-input"
        name="search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('inputPlaceholder')}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: '#1a1a1a',
          color: '#ffffff',
          border: '2px solid #333333',
          borderRadius: '8px',
          fontSize: '1rem',
          transition: 'border-color 0.3s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#ffffff'
          setIsFocused(true)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#333333'
          // Задержка для обработки клика на автокомплит
          setTimeout(() => {
            setIsFocused(false)
          }, 200)
        }}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.25rem',
            background: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: '8px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={(e) => {
                handleSuggestionClick(item.input, e)
              }}
              onMouseDown={(e) => {
                e.preventDefault()
              }}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #333333' : 'none',
                color: '#ffffff',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2a2a2a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* первая строка — ник игрока, если есть, иначе что-то человекопонятное */}
              <div style={{ fontWeight: 500 }}>
                {getHistoryDisplayName(item)}
              </div>

              {/* вторая строка — исходный ввод и/или SteamID мелким текстом */}
              {(item.input || item.steamId) && (
                <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>
                  {item.input}
                  {item.steamId && ` \u2022 ${item.steamId}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

