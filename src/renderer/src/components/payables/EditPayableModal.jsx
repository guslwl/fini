import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { centsToDecimalString, decimalToCents } from '@/lib/utils'
import { validatePayableUpdatePayload } from 'shared/validators/payables.js'

const emptyForm = {
  history: '',
  value: '',
  due_date: '',
  preferred_date: '',
  invoice_id: '',
  account_id: ''
}

function EditPayableModal({ open, payable, onClose, onSave }) {
  const { t } = useTranslation(['payables', 'common'])
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open && payable) {
      setForm({
        history: payable.history || '',
        value: centsToDecimalString(payable.value),
        due_date: payable.due_date || '',
        preferred_date: payable.preferred_date || '',
        invoice_id: payable.invoice_id || '',
        account_id: payable.account_id || ''
      })
      setIsSaving(false)
    }

    if (!open) {
      setForm(emptyForm)
      setIsSaving(false)
    }
  }, [open, payable])

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

  if (!open || !payable) {
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
      due_date: form.due_date,
      preferred_date: form.preferred_date || null,
      invoice_id: form.invoice_id.trim() || null,
      account_id: form.account_id.trim() || null
    }

    try {
      validatePayableUpdatePayload(payload)
    } catch (error) {
      toast.error(Array.isArray(error.cause) ? error.cause[0] : error.message)
      return
    }

    setIsSaving(true)

    try {
      const hasSaved = await onSave(payable.id, payload)

      if (hasSaved) {
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
          <h3 className="text-lg font-semibold">{t('modal.edit.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('modal.edit.description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>{t('common:labels.history')}</span>
            <input
              value={form.history}
              onChange={(event) => setForm((prev) => ({ ...prev, history: event.target.value }))}
              className="h-9 rounded-md border border-input bg-background px-3"
            />
          </label>

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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>{t('common:labels.dueDate')}</span>
              <input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>{t('common:labels.preferredDate')}</span>
              <input
                type="date"
                value={form.preferred_date}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, preferred_date: event.target.value }))
                }
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>{t('common:labels.invoiceId')}</span>
              <input
                value={form.invoice_id}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, invoice_id: event.target.value }))
                }
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>{t('common:labels.accountId')}</span>
              <input
                value={form.account_id}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, account_id: event.target.value }))
                }
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>
          </div>

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

export default EditPayableModal
