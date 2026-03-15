import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SUPPORTED_LOCALES } from '@/i18n/index.js'

function LanguageSwitcher({ collapsed }) {
  const { t, i18n } = useTranslation()
  const [pendingLocale, setPendingLocale] = useState(null)

  function handleChange(event) {
    const newLocale = event.target.value
    if (newLocale !== i18n.language) {
      setPendingLocale(newLocale)
    }
  }

  async function handleConfirm() {
    await window.api.v1.settings.setLanguage(pendingLocale)
    // app relaunches automatically
  }

  function handleCancel() {
    setPendingLocale(null)
  }

  if (collapsed) return null

  return (
    <>
      <div className="border-t border-border p-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>{t('language.label')}</span>
          <select
            value={i18n.language}
            onChange={handleChange}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {Object.entries(SUPPORTED_LOCALES).map(([code, fullName]) => (
              <option key={code} value={code}>
                {fullName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pendingLocale ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg">
            <h3 className="mb-2 text-base font-semibold">{t('language.confirmTitle')}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{t('language.confirmMessage')}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="h-9 rounded-md border border-border px-3 text-sm"
              >
                {t('buttons.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground"
              >
                {t('buttons.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default LanguageSwitcher
