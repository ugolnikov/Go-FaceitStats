'use client'

import { SearchHistoryItem } from '@/lib/storage'
import { useLanguage } from '@/contexts/LanguageContext'

interface HistorySidebarProps {
  history: SearchHistoryItem[]
  onSelect: (input: string) => void
  onClear: () => void
}

export default function HistorySidebar({ history, onSelect, onClear }: HistorySidebarProps) {
  const { t } = useLanguage()

  if (history.length === 0) return null

  return (
    <div
      className="history-sidebar"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '250px',
        height: '100vh',
        background: '#0a0a0a',
        borderRight: '1px solid #1a1a1a',
        padding: '1.5rem',
        overflowY: 'auto',
        zIndex: 100,
        animation: 'slideInLeft 0.3s ease-out',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 600 }}>{t.history}</h3>
          <button
            onClick={onClear}
            style={{
              background: 'transparent',
              border: '1px solid #333',
              color: '#ffffff',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
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
            ✕
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {history.slice(0, 15).map((item, index) => (
            <button
              key={index}
              onClick={() => onSelect(item.input)}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#ffffff',
                padding: '0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textAlign: 'left',
                transition: 'all 0.2s',
                animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2a2a2a'
                e.currentTarget.style.borderColor = '#ffffff'
                e.currentTarget.style.transform = 'translateX(5px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1a1a'
                e.currentTarget.style.borderColor = '#333'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{item.input}</div>
              {item.playerName && (
                <div style={{ fontSize: '0.75rem', color: '#999', opacity: 0.8 }}>
                  {item.playerName}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

