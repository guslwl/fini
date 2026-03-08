import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const initialForm = {
  description: '',
  type: '',
  date: '',
  is_business_day: false,
  should_count_as_business_day: false
}

function AddHolidayModal({ open, onClose, onCreate, onUpdate, mode = 'create', initialData }) {
  const [form, setForm] = useState(initialForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setIsSaving(false)
    } else if (mode === 'edit' && initialData) {
      setForm({
        description: initialData.description || '',
        type: initialData.type || '',
        date: initialData.date || '',
        is_business_day: initialData.is_business_day || false,
        should_count_as_business_day: initialData.should_count_as_business_day || false
      })
    } else if (mode === 'create') {
      setForm(initialForm)
    }
  }, [open, mode, initialData])

  if (!open) {
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.description.trim()) {
      toast.error('Description is required.')
      return
    }

    if (!form.date) {
      toast.error('Date is required.')
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        description: form.description.trim(),
        type: form.type.trim(),
        date: form.date,
        is_business_day: form.is_business_day,
        should_count_as_business_day: form.should_count_as_business_day
      }

      let hasSaved = false

      if (mode === 'edit') {
        hasSaved = await onUpdate(payload)
      } else {
        hasSaved = await onCreate(payload)
      }

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
          <h3 className="text-lg font-semibold">
            {mode === 'edit' ? 'Edit holiday' : 'Add holiday'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {mode === 'edit' ? 'Update the holiday details.' : 'Create a holiday record.'}
          </p>
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
              <span>Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Type</span>
              <input
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_business_day}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, is_business_day: event.target.checked }))
                }
                className="h-4 w-4 rounded border border-input"
              />
              <span>Is business day</span>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.should_count_as_business_day}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    should_count_as_business_day: event.target.checked
                  }))
                }
                className="h-4 w-4 rounded border border-input"
              />
              <span>Count as business day</span>
            </label>
          </div>

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
              {isSaving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddHolidayModal
