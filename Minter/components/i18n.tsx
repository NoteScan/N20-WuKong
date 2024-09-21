import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enTranslation from './localize/en/translation'
import zhTranslation from './localize/zh/translation'

const resources = {
  en: {
    translation: enTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
}

i18next.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
})

export default i18next
