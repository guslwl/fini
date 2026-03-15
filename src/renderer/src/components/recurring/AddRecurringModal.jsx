import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { decimalToCents } from '@/lib/utils'
import { validateRecurringCreatePayload } from 'shared/validators/recurring.js'

const initialForm = {
  history: '',
  value: '',
  due_day: '',
  should_postpone: true
}

function AddRecurringModal({ open, onClose, onCreate }) {
  const { t } = useTranslation(['recurring', 'common'])
  const [form, setForm] = useState(initialForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setIsSaving(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleEscapeKey(event) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()

      if (!isSaving) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscapeKey)

    return () => {
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [open, isSaving, onClose])

  if (!open) {
    return null
  }

  function handleCancel() {
    if (isSaving) {
      return
    }

    onClose()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const centsValue = decimalToCents(form.value)
    if (centsValue === null) {
      toast.error(t('modal.validation.invalidValue'))
      return
    }

    const payload = {
      history: form.history.trim(),
      value: centsValue,
      due_day: Number(form.due_day),
      should_postpone: Boolean(form.should_postpone),
      notes: null
    }

    try {
      validateRecurringCreatePayload(payload)
    } catch (error) {
      toast.error(Array.isArray(error.cause) ? error.cause[0] : error.message)
      return
    }

    setIsSaving(true)

    try {
      const hasCreated = await onCreate(payload)

      if (hasCreated) {
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleCancel()
        }
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-5 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{t('modal.add.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('modal.add.description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>{t('common:labels.description')}</span>
            <input
              value={form.history}
              onChange={(event) => setForm((prev) => ({ ...prev, history: event.target.value }))}
              className="h-9 rounded-md border border-input bg-background px-3"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>{t('common:labels.value')}</span>
              <input
                type="number"
                step="0.01"
                value={form.value}
                onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>{t('modal.fields.dueDay')}</span>
              <input
                type="number"
                min="1"
                max="31"
                value={form.due_day}
                onChange={(event) => setForm((prev) => ({ ...prev, due_day: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.should_postpone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, should_postpone: event.target.checked }))
              }
              className="h-4 w-4 rounded border border-input"
            />
            <span>{t('modal.fields.shouldPostpone')}</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="h-9 rounded-md border border-border px-3 text-sm"
              disabled={isSaving}
            >
              {t('common:buttons.cancel')}
            </button>
            <button
              type="submit"
              className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? t('common:states.saving') : t('common:buttons.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddRecurringModal
