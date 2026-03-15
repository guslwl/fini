import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import enCommon from './locales/en-US/common.json'
import enPayables from './locales/en-US/payables.json'
import enHolidays from './locales/en-US/holidays.json'
import enRecurring from './locales/en-US/recurring.json'
import enErrors from './locales/en-US/errors.json'

import ptCommon from './locales/pt-BR/common.json'
import ptPayables from './locales/pt-BR/payables.json'
import ptHolidays from './locales/pt-BR/holidays.json'
import ptRecurring from './locales/pt-BR/recurring.json'
import ptErrors from './locales/pt-BR/errors.json'

export const SUPPORTED_LOCALES = {
  'en-US': 'English',
  'pt-BR': 'Português (BR)'
}

function resolveLocale(raw) {
  if (!raw) return 'en-US'
  if (raw in SUPPORTED_LOCALES) return raw
  if (raw.startsWith('pt')) return 'pt-BR'
  return 'en-US'
}

export async function initI18n() {
  let stored = null
  try {
    stored = await window.api.v1.settings.getLanguage()
  } catch {
    // settings unavailable, fall through
  }

  const language = resolveLocale(stored ?? navigator.language)

  await i18next.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'en-US',
    defaultNS: 'common',
    resources: {
      'en-US': {
        common: enCommon,
        payables: enPayables,
        holidays: enHolidays,
        recurring: enRecurring,
        errors: enErrors
      },
      'pt-BR': {
        common: ptCommon,
        payables: ptPayables,
        holidays: ptHolidays,
        recurring: ptRecurring,
        errors: ptErrors
      }
    },
    interpolation: { escapeValue: false }
  })
}

export default i18next
