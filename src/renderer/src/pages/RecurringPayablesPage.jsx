import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
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

function RecurringPayablesPage() {
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
    } catch (loadError) {
      toast.error(loadError?.message || 'Failed to load recurring payables.')
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
      toast.success('Recurring payable created successfully')
      return true
    } catch (createError) {
      if (!hasCreated) {
        toast.error(createError?.message || 'Failed to create recurring payable.')
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
      toast.success('Recurring payable updated successfully')
      return true
    } catch (updateError) {
      if (!hasUpdated) {
        toast.error(updateError?.message || 'Failed to update recurring payable.')
      }

      return false
    }
  }

  async function handleDelete(recurring) {
    const confirmed = window.confirm('Delete this recurring payable?')
    if (!confirmed) {
      return
    }

    let hasDeleted = false

    try {
      await window.api.v1.recurring.delete(recurring.id)
      hasDeleted = true
      await loadRecurring()
      toast.success('Recurring payable deleted successfully')
    } catch (deleteError) {
      if (!hasDeleted) {
        toast.error(deleteError?.message || 'Failed to delete recurring payable.')
      }
    }
  }

  async function handleGenerateForMonth() {
    const parsed = parseMonthValue(generateMonthValue)
    if (!parsed) {
      toast.error('Select a valid month to generate payables.')
      return
    }

    setIsGenerating(true)

    try {
      const result = await window.api.v1.recurring.generateForMonth(parsed.year, parsed.month)
      const generated = Number(result?.generated) || 0
      const skipped = Number(result?.skipped) || 0

      toast.success(`Generation complete: ${generated} generated, ${skipped} skipped.`)
    } catch (generateError) {
      toast.error(generateError?.message || 'Failed to generate payables for month.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Recurring Payables</h2>
          <p className="text-sm text-muted-foreground">Manage recurring payable templates.</p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium">Generate for Month</h3>
          <p className="text-xs text-muted-foreground">
            Create payables from recurring templates for the selected month.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Month</span>
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
            {isGenerating ? 'Generating...' : 'Generate'}
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
