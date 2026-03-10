import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { decimalToCents } from '@/lib/utils'

const initialForm = {
  history: '',
  value: '',
  due_date: '',
  preferred_date: '',
  invoice_id: '',
  account_id: ''
}

function AddPayableModal({ open, onClose, onCreate }) {
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

    if (!form.history.trim()) {
      toast.error('History is required.')
      return
    }

    if (!form.due_date) {
      toast.error('Due date is required.')
      return
    }

    const centsValue = decimalToCents(form.value)
    if (centsValue === null) {
      toast.error('Value must be a valid amount with up to 2 decimal places.')
      return
    }

    setIsSaving(true)

    try {
      const hasCreated = await onCreate({
        history: form.history.trim(),
        value: centsValue,
        due_date: form.due_date,
        preferred_date: form.preferred_date || null,
        invoice_id: form.invoice_id.trim() || null,
        account_id: form.account_id.trim() || null
      })

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
          <h3 className="text-lg font-semibold">Add payable</h3>
          <p className="text-sm text-muted-foreground">Create a payable record.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>History</span>
            <input
              value={form.history}
              onChange={(event) => setForm((prev) => ({ ...prev, history: event.target.value }))}
              className="h-9 rounded-md border border-input bg-background px-3"
            />
          </label>

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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>Due date</span>
              <input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Preferred date</span>
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
              <span>Invoice ID</span>
              <input
                value={form.invoice_id}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, invoice_id: event.target.value }))
                }
                className="h-9 rounded-md border border-input bg-background px-3"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Account ID</span>
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

export default AddPayableModal
