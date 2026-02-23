import { useEffect, useState } from 'react'

const emptyForm = {
  history: '',
  value: '',
  due_date: '',
  preferred_date: '',
  invoice_id: '',
  account_id: ''
}

function EditPayableModal({ open, payable, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open && payable) {
      setForm({
        history: payable.history || '',
        value: payable.value ?? '',
        due_date: payable.due_date || '',
        preferred_date: payable.preferred_date || '',
        invoice_id: payable.invoice_id || '',
        account_id: payable.account_id || ''
      })
      setError('')
      setIsSaving(false)
    }

    if (!open) {
      setForm(emptyForm)
      setError('')
      setIsSaving(false)
    }
  }, [open, payable])

  if (!open || !payable) {
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.history.trim()) {
      setError('History is required.')
      return
    }

    if (!form.due_date) {
      setError('Due date is required.')
      return
    }

    if (form.value === '' || Number.isNaN(Number(form.value))) {
      setError('Value must be a number (cents).')
      return
    }

    setIsSaving(true)

    try {
      await onSave(payable.id, {
        history: form.history.trim(),
        value: Number(form.value),
        due_date: form.due_date,
        preferred_date: form.preferred_date || null,
        invoice_id: form.invoice_id.trim() || null,
        account_id: form.account_id.trim() || null
      })
      onClose()
    } catch (saveError) {
      setError(saveError?.message || 'Failed to update payable.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-5 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Edit payable</h3>
          <p className="text-sm text-muted-foreground">Update the payable details.</p>
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
            <span>Value (cents)</span>
            <input
              type="number"
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

          {error ? <p className="text-sm text-foreground">{error}</p> : null}

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

export default EditPayableModal
