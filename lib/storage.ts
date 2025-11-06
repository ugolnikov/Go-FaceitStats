const HISTORY_KEY = 'faceit_search_history'
const LANGUAGE_KEY = 'faceit_language'

export interface SearchHistoryItem {
  input: string
  timestamp: number
  playerName?: string
  steamId?: string
}

export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === 'undefined') return []
  
  try {
    const history = localStorage.getItem(HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

export function addToHistory(input: string, playerName?: string, steamId?: string) {
  if (typeof window === 'undefined') return
  
  try {
    const history = getSearchHistory()
    // Удаляем дубликаты
    const filtered = history.filter(item => item.input.toLowerCase() !== input.toLowerCase())
    // Добавляем в начало
    filtered.unshift({
      input,
      timestamp: Date.now(),
      playerName,
      steamId,
    })
    // Ограничиваем до 20 записей
    const limited = filtered.slice(0, 20)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited))
  } catch (error) {
    console.error('Failed to save history:', error)
  }
}

export function clearHistory() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (error) {
    console.error('Failed to clear history:', error)
  }
}

// Сохранение последних результатов поиска
const LAST_SEARCH_KEY = 'faceit_last_search'

export interface LastSearchData {
  stats: any
  input: string
  matchesLimit: number
  timestamp: number
}

export function saveLastSearch(stats: any, input: string, matchesLimit: number) {
  if (typeof window === 'undefined') return
  
  try {
    const data: LastSearchData = {
      stats,
      input,
      matchesLimit,
      timestamp: Date.now(),
    }
    localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save last search:', error)
  }
}

export function getLastSearch(): LastSearchData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const data = localStorage.getItem(LAST_SEARCH_KEY)
    if (!data) return null
    
    const parsed = JSON.parse(data) as LastSearchData
    // Проверяем, что данные не старше 24 часов
    const maxAge = 24 * 60 * 60 * 1000 // 24 часа
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(LAST_SEARCH_KEY)
      return null
    }
    
    return parsed
  } catch (error) {
    console.error('Failed to get last search:', error)
    return null
  }
}

export function clearLastSearch() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(LAST_SEARCH_KEY)
  } catch (error) {
    console.error('Failed to clear last search:', error)
  }
}

export function getLanguage(): string {
  if (typeof window === 'undefined') return 'ru'
  
  try {
    return localStorage.getItem(LANGUAGE_KEY) || 'ru'
  } catch {
    return 'ru'
  }
}

export function setLanguage(lang: string) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(LANGUAGE_KEY, lang)
  } catch (error) {
    console.error('Failed to save language:', error)
  }
}

