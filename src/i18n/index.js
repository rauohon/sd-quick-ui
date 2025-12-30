import { createI18n } from 'vue-i18n'
import ko from './locales/ko.js'
import en from './locales/en.js'

// Detect user's preferred language
function getDefaultLocale() {
  // 1. Check localStorage
  const savedLocale = localStorage.getItem('sd-vue-ui-locale')
  if (savedLocale && ['ko', 'en'].includes(savedLocale)) {
    return savedLocale
  }

  // 2. Check browser language
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('ko')) {
    return 'ko'
  }

  // 3. Default to English
  return 'en'
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    ko,
    en
  },
  globalInjection: true, // Enable $t in templates
  missingWarn: false, // Disable missing translation warnings in development
  fallbackWarn: false
})

export default i18n

// Helper function to change language
export function setLocale(locale) {
  if (['ko', 'en'].includes(locale)) {
    i18n.global.locale.value = locale
    localStorage.setItem('sd-vue-ui-locale', locale)
    document.documentElement.lang = locale
  }
}

// Helper function to get current locale
export function getLocale() {
  return i18n.global.locale.value
}
