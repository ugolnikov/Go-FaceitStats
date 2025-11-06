// Нормальные значения статистики для CS2 Faceit
export const STATS_THRESHOLDS = {
  kd: {
    good: 1.1,    // Выше нормы
    average: 0.95, // Норма
    bad: 0.9,     // Ниже нормы
  },
  headshot: {
    good: 50,     // Выше нормы (%)
    average: 40,  // Норма (%)
    bad: 35,      // Ниже нормы (%)
  },
  winRate: {
    good: 55,     // Выше нормы (%)
    average: 50,  // Норма (%)
    bad: 45,      // Ниже нормы (%)
  },
  elo: {
    good: 2000,   // Выше нормы
    average: 1500, // Норма
    bad: 1000,    // Ниже нормы
  },
  adr: {
    good: 85,     // Выше нормы
    average: 75,  // Норма
    bad: 70,      // Ниже нормы
  },
}

export function getStatIndicator(value: number, type: 'kd' | 'headshot' | 'winRate' | 'elo' | 'adr'): 'good' | 'average' | 'bad' {
  const thresholds = STATS_THRESHOLDS[type]
  
  if (value >= thresholds.good) return 'good'
  if (value >= thresholds.average) return 'average'
  return 'bad'
}

export function formatStatValue(value: string | number): number {
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(/[^\d.,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

