'use client'

interface StatIndicatorProps {
  value: number
  type: 'kd' | 'headshot' | 'winRate' | 'elo' | 'adr'
}

export default function StatIndicator({ value, type }: StatIndicatorProps) {
  const getIndicator = () => {
    if (type === 'kd') {
      if (value >= 1.1) return { color: '#44ff44', arrow: '↑', text: 'good' }
      if (value >= 0.95) return { color: '#ffff44', arrow: '→', text: 'average' }
      return { color: '#ff4444', arrow: '↓', text: 'bad' }
    }
    if (type === 'headshot') {
      if (value >= 50) return { color: '#44ff44', arrow: '↑', text: 'good' }
      if (value >= 40) return { color: '#ffff44', arrow: '→', text: 'average' }
      return { color: '#ff4444', arrow: '↓', text: 'bad' }
    }
    if (type === 'winRate') {
      if (value >= 55) return { color: '#44ff44', arrow: '↑', text: 'good' }
      if (value >= 50) return { color: '#ffff44', arrow: '→', text: 'average' }
      return { color: '#ff4444', arrow: '↓', text: 'bad' }
    }
    if (type === 'elo') {
      if (value >= 2000) return { color: '#44ff44', arrow: '↑', text: 'good' }
      if (value >= 1500) return { color: '#ffff44', arrow: '→', text: 'average' }
      return { color: '#ff4444', arrow: '↓', text: 'bad' }
    }
    if (type === 'adr') {
      if (value >= 85) return { color: '#44ff44', arrow: '↑', text: 'good' }
      if (value >= 75) return { color: '#ffff44', arrow: '→', text: 'average' }
      return { color: '#ff4444', arrow: '↓', text: 'bad' }
    }
    return { color: '#ffffff', arrow: '', text: 'unknown' }
  }

  const indicator = getIndicator()

  return (
    <span
      style={{
        color: indicator.color,
        fontSize: '1.2rem',
        fontWeight: 'bold',
        display: 'inline-block',
        animation: indicator.arrow === '↑' || indicator.arrow === '↓' ? 'pulse 2s infinite' : 'none',
        lineHeight: '1',
        marginLeft: '0.25rem',
      }}
      title={indicator.text}
    >
      {indicator.arrow}
    </span>
  )
}

