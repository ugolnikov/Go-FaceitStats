import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'ru', 'zh', 'es', 'de'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // Дефолтный язык без префикса, остальные с префиксом
  localePrefix: 'as-needed',
  
  // Автоопределение языка из заголовка Accept-Language браузера
  // По умолчанию включено, но явно указываем для ясности
  localeDetection: true
});

