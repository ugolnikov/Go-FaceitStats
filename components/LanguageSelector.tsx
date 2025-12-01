'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import ReactCountryFlag from 'react-country-flag'

const languages = [
  { code: 'ru', name: 'Русский', countryCode: 'RU' },
  { code: 'en', name: 'English', countryCode: 'GB' },
  { code: 'zh', name: '中文', countryCode: 'CN' },
  { code: 'es', name: 'Español', countryCode: 'ES' },
  { code: 'de', name: 'Deutsch', countryCode: 'DE' },
]

export default function LanguageSelector() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const currentLanguage = languages.find((lang) => lang.code === locale) ?? languages[0]

  const handleLanguageChange = (newLocale: string) => {
    setOpen(false)
    if (newLocale === locale) return
    // Используем next-intl navigation API для правильной смены локали
    router.replace(pathname, { locale: newLocale })
  }

  // Закрытие по клику вне дропдауна
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block', minWidth: '140px' }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          background: '#1a1a1a',
          color: '#ffffff',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '0.5rem 2.5rem 0.5rem 0.75rem',
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {currentLanguage.countryCode && (
            // Новая библа для флагов
            <ReactCountryFlag
              countryCode={currentLanguage.countryCode}
              svg
              style={{ width: '1.2em', height: '1.2em', borderRadius: '2px' }}
            />
          )}
          <span>{currentLanguage.name}</span>
        </span>
        <span style={{ fontSize: '0.7rem' }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.25rem)',
            left: 0,
            background: '#111111',
            border: '1px solid #333333',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
            zIndex: 20,
            minWidth: '100%',
            overflow: 'hidden',
          }}
        >
          {languages.map((lang) => {
            const isActive = lang.code === locale
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  background: isActive ? '#1f4fff' : '#1a1a1a',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.95rem',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#2a2a2a'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive ? '#1f4fff' : '#1a1a1a'
                }}
              >
                {lang.countryCode && (
                  <ReactCountryFlag
                    countryCode={lang.countryCode}
                    svg
                    style={{ width: '1.2em', height: '1.2em', borderRadius: '2px' }}
                  />
                )}
                <span>{lang.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
