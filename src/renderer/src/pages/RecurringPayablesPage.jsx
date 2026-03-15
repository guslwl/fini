import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import AddRecurringModal from '@/components/recurring/AddRecurringModal'
import EditRecurringModal from '@/components/recurring/EditRecurringModal'
import RecurringTable from '@/components/recurring/RecurringTable'

function getCurrentMonthValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function parseMonthValue(value) {
  const [rawYear, rawMonth] = String(value || '').split('-')
  const year = Number(rawYear)
  const month = Number(rawMonth)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }

  return { year, month }
}

function getSkippedReasonText(detail, t) {
  const reason = typeof detail?.reason === 'string' ? detail.reason : 'unknown'

  if (reason === 'already_exists') {
    const dueDate =
      typeof detail?.due_date === 'string' && detail.due_date.trim()
        ? detail.due_date
        : 'unknown date'
    return t('skipped.alreadyExists', { dueDate })
  }

  if (reason === 'invalid_due_day') {
    const dueDay = detail?.due_day
    const dueDayValue = dueDay === null || dueDay === undefined ? 'null' : String(dueDay)
    return t('skipped.invalidDueDay', { dueDay: dueDayValue })
  }

  return t('skipped.withReason', { reason })
}

function getSkippedItemLabel(detail, index, t) {
  const history = typeof detail?.history === 'string' ? detail.history.trim() : ''

  if (history) {
    return history
  }

  if (Number.isInteger(detail?.recurring_id)) {
    return t('skipped.itemLabel', { id: detail.recurring_id })
  }

  return t('skipped.itemFallback', { index: index + 1 })
}

function formatSkippedDetailsForToast(skippedDetails, t) {
  if (!Array.isArray(skippedDetails) || skippedDetails.length === 0) {
    return ''
  }

  return skippedDetails
    .map((detail, index) => {
      const label = getSkippedItemLabel(detail, index, t)
      const reasonText = getSkippedReasonText(detail, t)
      return `${index + 1}. ${label}: ${reasonText}`
    })
    .join(' | ')
}

function RecurringPayablesPage() {
  const { t } = useTranslation('recurring')
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState(null)
  const [generateMonthValue, setGenerateMonthValue] = useState(() => getCurrentMonthValue())
  const [isGenerating, setIsGenerating] = useState(false)

  async function loadRecurring() {
    setIsLoading(true)

    try {
      const data = await window.api.v1.recurring.getAll()
      setRows(Array.isArray(data) ? data : [])
      return true
    } catch {
      toast.error(t('errors.loadFailed'))
      setRows([])
      return false
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRecurring().catch(() => {})
  }, [])

  async function handleCreate(payload) {
    let hasCreated = false

    try {
      await window.api.v1.recurring.create(payload)
      hasCreated = true
      await loadRecurring()
      toast.success(t('toasts.created'))
      return true
    } catch {
      if (!hasCreated) {
        toast.error(t('errors.createFailed'))
      }

      return false
    }
  }

  async function handleUpdate(id, payload) {
    let hasUpdated = false

    try {
      await window.api.v1.recurring.update(id, payload)
      hasUpdated = true
      await loadRecurring()
      toast.success(t('toasts.updated'))
      return true
    } catch {
      if (!hasUpdated) {
        toast.error(t('errors.updateFailed'))
      }

      return false
    }
  }

  async function handleDelete(recurring) {
    const confirmed = window.confirm(t('deleteConfirm'))
    if (!confirmed) {
      return
    }

    let hasDeleted = false

    try {
      await window.api.v1.recurring.delete(recurring.id)
      hasDeleted = true
      await loadRecurring()
      toast.success(t('toasts.deleted'))
    } catch {
      if (!hasDeleted) {
        toast.error(t('errors.deleteFailed'))
      }
    }
  }

  async function handleGenerateForMonth() {
    const parsed = parseMonthValue(generateMonthValue)
    if (!parsed) {
      toast.error(t('page.generate.invalidMonth'))
      return
    }

    setIsGenerating(true)

    try {
      const result = await window.api.v1.recurring.generateForMonth(parsed.year, parsed.month)
      const generated = Number(result?.generated) || 0
      const skipped = Number(result?.skipped) || 0
      const skippedDetails = Array.isArray(result?.skippedDetails) ? result.skippedDetails : []

      let successMessage = t('page.generate.result', { generated, skipped })

      if (skipped > 0) {
        const skippedDetailsMessage = formatSkippedDetailsForToast(skippedDetails, t)
        successMessage += skippedDetailsMessage
          ? ` ${t('page.generate.skippedDetails', { details: skippedDetailsMessage })}`
          : ` ${t('page.generate.skippedUnavailable')}`
      }

      toast.success(successMessage)
    } catch {
      toast.error(t('page.generate.failed'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{t('page.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('page.description')}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          {t('buttons.add', { ns: 'common' })}
        </button>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium">{t('page.generate.title')}</h3>
          <p className="text-xs text-muted-foreground">{t('page.generate.description')}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{t('labels.month', { ns: 'common' })}</span>
            <input
              type="month"
              value={generateMonthValue}
              onChange={(event) => setGenerateMonthValue(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={handleGenerateForMonth}
            className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground"
            disabled={isGenerating}
          >
            {isGenerating ? t('states.generating', { ns: 'common' }) : t('page.generate.button')}
          </button>
        </div>
      </div>

      <RecurringTable
        rows={rows}
        isLoading={isLoading}
        onEdit={(recurring) => setEditingRecurring(recurring)}
        onDelete={handleDelete}
      />

      <AddRecurringModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={handleCreate}
      />

      <EditRecurringModal
        open={Boolean(editingRecurring)}
        recurring={editingRecurring}
        onClose={() => setEditingRecurring(null)}
        onSave={handleUpdate}
      />
    </section>
  )
}

export default RecurringPayablesPage
