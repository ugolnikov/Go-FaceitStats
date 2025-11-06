'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { languages } from '@/lib/translations'

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as any)}
        style={{
          background: '#1a1a1a',
          color: '#ffffff',
          border: '1px solid #333333',
          borderRadius: '8px',
          padding: '0.5rem 2.5rem 0.5rem 0.75rem',
          fontSize: '1rem',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          paddingRight: '2.5rem',
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}

