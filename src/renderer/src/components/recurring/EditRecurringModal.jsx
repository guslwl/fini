import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { centsToDecimalString, decimalToCents } from '@/lib/utils'

const emptyForm = {
  description: '',
  value: '',
  due_day: '',
  should_postpone: true
}

function EditRecurringModal({ open, recurring, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open && recurring) {
      setForm({
        description: recurring.history || '',
        value: centsToDecimalString(recurring.value),
        due_day: recurring.due_day ?? '',
        should_postpone: Boolean(recurring.should_postpone)
      })
      setIsSaving(false)
    }

    if (!open) {
      setForm(emptyForm)
      setIsSaving(false)
    }
  }, [open, recurring])

  if (!open || !recurring) {
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.description.trim()) {
      toast.error('Description is required.')
      return
    }

    const dueDay = Number(form.due_day)
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      toast.error('Due day must be an integer between 1 and 31.')
      return
    }

    const centsValue = decimalToCents(form.value)
    if (centsValue === null) {
      toast.error('Value must be a valid amount with up to 2 decimal places.')
      return
    }

    setIsSaving(true)

    try {
      const hasSaved = await onSave(recurring.id, {
        history: form.description.trim(),
        value: centsValue,
        due_day: dueDay,
        should_postpone: Boolean(form.should_postpone)
      })

      if (hasSaved) {
        onClose()
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-5 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Edit recurring payable</h3>
          <p className="text-sm text-muted-foreground">Update recurring payable details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>Description</span>
            <input
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="h-9 rounded-md border border-input bg-background px-3"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>Value</span>
              <input
                type="number"
                step="0.01"
                value={form.value}
                onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Due day</span>
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
            <span>Should postpone to next business day</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-border px-3 text-sm"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditRecurringModal
