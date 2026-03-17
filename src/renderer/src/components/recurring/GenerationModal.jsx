import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { decimalToCents, formatDateLocale } from '@/lib/utils'

function GenerationModal({ open, previewItems, onClose, onConfirm }) {
  const { t, i18n } = useTranslation(['recurring', 'common'])
  const [amounts, setAmounts] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (open) {
      setAmounts({})
      setIsGenerating(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleEscapeKey(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (!isGenerating) onClose()
    }

    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [open, isGenerating, onClose])

  if (!open) return null

  const actionableItems = previewItems.filter((item) => !item.skipped)
  const skippedItems = previewItems.filter((item) => item.skipped)

  async function handleConfirm() {
    // Validate items that need input
    for (const item of actionableItems) {
      if (item.needs_input) {
        const rawAmount = amounts[item.scheduled_transaction_id]
        if (!rawAmount && rawAmount !== 0) {
          toast.error(`${item.description}: ${t('generation.fillAmount')}`)
          return
        }
        const cents = decimalToCents(rawAmount)
        if (cents === null) {
          toast.error(`${item.description}: ${t('modal.validation.invalidValue')}`)
          return
        }
      }
    }

    const confirmedItems = actionableItems.map((item) => {
      if (item.needs_input) {
        const cents = decimalToCents(amounts[item.scheduled_transaction_id])
        return { ...item, amount: cents }
      }
      return item
    })

    setIsGenerating(true)

    try {
      await onConfirm(confirmedItems)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isGenerating) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-5 shadow-lg max-h-[85vh] overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{t('generation.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('generation.description')}</p>
        </div>

        {actionableItems.length === 0 && skippedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t('generation.noItems')}</p>
        ) : (
          <div className="space-y-2">
            {actionableItems.map((item) => (
              <div
                key={item.scheduled_transaction_id}
                className="rounded-md border border-border p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateLocale(item.due_date, i18n.language)}
                    </p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                    item.needs_input
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {item.needs_input ? t('generation.needsInputLabel') : t('generation.autoLabel')}
                  </span>
                </div>

                {item.needs_input && (
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-muted-foreground">{t('generation.fillAmount')}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amounts[item.scheduled_transaction_id] ?? ''}
                      onChange={(e) =>
                        setAmounts((prev) => ({
                          ...prev,
                          [item.scheduled_transaction_id]: e.target.value
                        }))
                      }
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </label>
                )}
              </div>
            ))}

            {skippedItems.length > 0 && (
              <div className="rounded-md border border-border/50 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t('generation.skippedLabel')}</p>
                {skippedItems.map((item) => (
                  <p key={item.scheduled_transaction_id} className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-border px-3 text-sm"
            disabled={isGenerating}
          >
            {t('common:buttons.close')}
          </button>

          {actionableItems.length > 0 && (
            <button
              type="button"
              onClick={handleConfirm}
              className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground"
              disabled={isGenerating}
            >
              {isGenerating ? t('common:states.generating') : t('generation.confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerationModal
