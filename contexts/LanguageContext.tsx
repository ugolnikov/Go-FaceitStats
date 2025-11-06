'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, getTranslations } from '@/lib/translations'
import { getLanguage, setLanguage as saveLanguage } from '@/lib/storage'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ReturnType<typeof getTranslations>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Определение языка браузера
function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en'
  const langCode = browserLang.split('-')[0].toLowerCase()
  
  // Маппинг языков браузера на наши языки
  const langMap: Record<string, Language> = {
    'ru': 'ru',
    'en': 'en',
    'zh': 'zh',
    'es': 'es',
    'de': 'de',
  }
  
  // Если язык браузера поддерживается, используем его
  if (langMap[langCode]) {
    return langMap[langCode]
  }
  
  // Иначе используем английский по умолчанию
  return 'en'
}

// Функция для синхронного получения начального языка
function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  
  try {
    // Сначала проверяем сохраненный язык
    const savedLang = getLanguage() as Language
    if (savedLang && ['ru', 'en', 'zh', 'es', 'de'].includes(savedLang)) {
      return savedLang
    }
    
    // Если нет сохраненного, определяем язык браузера
    const browserLang = getBrowserLanguage()
    // Сохраняем асинхронно, чтобы не блокировать рендеринг
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        try {
          saveLanguage(browserLang)
        } catch {}
      }, 0)
    }
    return browserLang
  } catch {
    return 'en'
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Инициализируем язык синхронно при первом рендере
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  // Обновляем язык только если он изменился в другом месте
  useEffect(() => {
    const handleStorageChange = () => {
      const savedLang = getLanguage() as Language
      if (savedLang && ['ru', 'en', 'zh', 'es', 'de'].includes(savedLang)) {
        setLanguageState(savedLang)
      }
    }
    
    // Слушаем изменения в localStorage
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    saveLanguage(lang)
  }

  const t = getTranslations(language)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

