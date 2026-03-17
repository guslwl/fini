import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { centsToDecimalString, decimalToCents } from '@/lib/utils'

const FIXED_FREQUENCIES = ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual']
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const CERTAINTIES = ['fixed', 'estimated', 'unknown']
const END_TYPES = ['never', 'after_n', 'until_date']
const STATUSES = ['active', 'paused', 'completed']

function isDayOfWeekPattern(freq) {
  return !FIXED_FREQUENCIES.includes(freq)
}

function toggleWeekday(currentFreq, day) {
  const current = currentFreq.split('-').filter((d) => WEEKDAYS.includes(d))
  const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
  return next.sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b)).join('-')
}

const emptyForm = {
  description: '',
  amount: '',
  type: 'payable',
  frequency: 'monthly',
  end_type: 'never',
  end_after_n: '',
  end_date: '',
  certainty: 'fixed',
  should_postpone: false,
  user_triggered: true,
  status: 'active',
  notes: ''
}

function EditScheduledTransactionModal({ open, transaction, onClose, onSave }) {
  const { t } = useTranslation(['recurring', 'common'])
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open && transaction) {
      setForm({
        description: transaction.description || '',
        amount: transaction.amount !== null ? centsToDecimalString(transaction.amount) : '',
        type: transaction.type || 'payable',
        frequency: transaction.frequency || 'monthly',
        end_type: transaction.end_type || 'never',
        end_after_n: transaction.end_after_n ?? '',
        end_date: transaction.end_date || '',
        certainty: transaction.certainty || 'fixed',
        should_postpone: Boolean(transaction.should_postpone),
        user_triggered: Boolean(transaction.user_triggered),
        status: transaction.status || 'active',
        notes: transaction.notes || ''
      })
      setIsSaving(false)
    }

    if (!open) {
      setForm(emptyForm)
      setIsSaving(false)
    }
  }, [open, transaction])

  useEffect(() => {
    if (!open) return

    function handleEscapeKey(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (!isSaving) onClose()
    }

    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [open, isSaving, onClose])

  if (!open || !transaction) return null

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFrequencyTypeChange(value) {
    if (value === 'custom_days') {
      set('frequency', 'mon')
    } else {
      if (value === 'once') set('end_type', 'never')
      set('frequency', value)
    }
  }

  function handleDayToggle(day) {
    const next = toggleWeekday(form.frequency, day)
    if (next) set('frequency', next)
  }

  function handleCancel() {
    if (isSaving) return
    onClose()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (isDayOfWeekPattern(form.frequency) && form.frequency.split('-').filter((d) => WEEKDAYS.includes(d)).length === 0) {
      toast.error(t('modal.validation.missingDays'))
      return
    }

    let amount = null
    if (form.amount !== '' && form.amount !== null) {
      amount = decimalToCents(form.amount)
      if (amount === null) {
        toast.error(t('modal.validation.invalidValue'))
        return
      }
    }

    if (form.certainty === 'fixed' && amount === null) {
      toast.error(t('modal.validation.missingAmount'))
      return
    }

    const payload = {
      description: form.description.trim(),
      amount,
      currency: transaction.currency || 'BRL',
      type: form.type,
      frequency: form.frequency,
      next_date: transaction.next_date,
      end_type: form.end_type,
      end_after_n: form.end_type === 'after_n' && form.end_after_n ? Number(form.end_after_n) : null,
      end_date: form.end_type === 'until_date' && form.end_date ? form.end_date : null,
      certainty: form.certainty,
      should_postpone: Boolean(form.should_postpone),
      user_triggered: Boolean(form.user_triggered),
      status: form.status,
      notes: form.notes.trim() || null
    }

    setIsSaving(true)

    try {
      const hasSaved = await onSave(transaction.id, payload)
      if (hasSaved) onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const isCustomDays = isDayOfWeekPattern(form.frequency)
  const selectedDays = isCustomDays ? form.frequency.split('-') : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleCancel()
      }}
    >
      <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-5 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{t('modal.edit.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('modal.edit.description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>{t('common:labels.description')}</span>
            <input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>{t('modal.fields.type')}</span>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3"
              >
                <option value="payable">{t('modal.type.payable')}</option>
                <option value="receivable">{t('modal.type.receivable')}</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>{t('modal.fields.certainty')}</span>
              <select
                value={form.certainty}
                onChange={(e) => set('certainty', e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3"
              >
                {CERTAINTIES.map((c) => (
                  <option key={c} value={c}>{t(`modal.certainty.${c}`)}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span>
              {t('common:labels.value')}
              {form.certainty === 'fixed' ? ' *' : ` (${t('common:labels.optional')})`}
            </span>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="—"
              className="h-9 rounded-md border border-input bg-background px-3"
            />
          </label>

          <div className="flex flex-col gap-1 text-sm">
            <span>{t('modal.fields.frequency')}</span>
            <select
              value={isCustomDays ? 'custom_days' : form.frequency}
              onChange={(e) => handleFrequencyTypeChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3"
            >
              {FIXED_FREQUENCIES.map((f) => (
                <option key={f} value={f}>{t(`modal.frequency.${f}`)}</option>
              ))}
              <option value="custom_days">{t('modal.frequency.customDays')}</option>
            </select>

            {isCustomDays && (
              <div className="mt-1 flex flex-wrap gap-1">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`rounded px-2 py-1 text-xs font-medium border transition-colors ${
                      selectedDays.includes(day)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-input text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t(`modal.weekday.${day}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {form.frequency !== 'once' && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span>{t('modal.fields.endType')}</span>
                <select
                  value={form.end_type}
                  onChange={(e) => set('end_type', e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3"
                >
                  {END_TYPES.map((et) => (
                    <option key={et} value={et}>{t(`modal.endType.${et}`)}</option>
                  ))}
                </select>
              </label>

              {form.end_type === 'after_n' && (
                <label className="flex flex-col gap-1 text-sm">
                  <span>{t('modal.fields.endAfterN')}</span>
                  <input
                    type="number"
                    min="1"
                    value={form.end_after_n}
                    onChange={(e) => set('end_after_n', e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3"
                  />
                </label>
              )}

              {form.end_type === 'until_date' && (
                <label className="flex flex-col gap-1 text-sm">
                  <span>{t('modal.fields.endDate')}</span>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => set('end_date', e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3"
                  />
                </label>
              )}
            </>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span>{t('modal.fields.status')}</span>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{t(`modal.status.${s}`)}</option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.should_postpone}
                  onChange={(e) => set('should_postpone', e.target.checked)}
                  className="h-4 w-4 rounded border border-input"
                />
                <span>{t('modal.fields.shouldPostpone')}</span>
              </label>
              <p className="ml-6 mt-0.5 text-xs text-muted-foreground">{t('modal.postponeNote')}</p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.user_triggered}
                onChange={(e) => set('user_triggered', e.target.checked)}
                className="h-4 w-4 rounded border border-input"
              />
              <span>{t('modal.fields.userTriggered')}</span>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span>{t('modal.fields.notes')}</span>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
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

export default EditScheduledTransactionModal
