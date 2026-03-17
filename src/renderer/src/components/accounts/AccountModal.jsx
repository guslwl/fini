import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  CATEGORY_TYPES,
  VALID_CATEGORIES,
  VALID_CURRENCIES,
  validateAccountCreate,
  validateAccountUpdate
} from 'shared/validators/accounts.js'

const DEFAULT_CATEGORY = VALID_CATEGORIES[0]
const DEFAULT_TYPE = CATEGORY_TYPES[DEFAULT_CATEGORY][0]

const initialForm = {
  name: '',
  code: '',
  category: DEFAULT_CATEGORY,
  type: DEFAULT_TYPE,
  currency: 'BRL',
  notes: '',
  parent_id: ''
}

function AccountModal({ open, onClose, onCreate, onUpdate, mode = 'create', initialData, allAccounts = [] }) {
  const { t } = useTranslation(['accounts', 'common'])
  const [form, setForm] = useState(initialForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm(initialForm)
      setIsSaving(false)
    } else if (mode === 'edit' && initialData) {
      setForm({
        name: initialData.name || '',
        code: initialData.code || '',
        category: initialData.category || DEFAULT_CATEGORY,
        type: initialData.type || DEFAULT_TYPE,
        currency: initialData.currency || 'BRL',
        notes: initialData.notes || '',
        parent_id: initialData.parent_id != null ? String(initialData.parent_id) : ''
      })
    } else if (mode === 'create') {
      setForm(initialForm)
    }
  }, [open, mode, initialData])

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

  if (!open) return null

  const availableTypes = CATEGORY_TYPES[form.category] ?? []

  // Parent options: group accounts of same category, excluding self (in edit mode)
  const parentOptions = allAccounts.filter(
    (a) =>
      a.type === 'group' &&
      a.category === form.category &&
      a.deleted_at == null &&
      (mode !== 'edit' || a.id !== initialData?.id)
  )

  function handleCategoryChange(category) {
    const types = CATEGORY_TYPES[category] ?? []
    setForm((prev) => ({
      ...prev,
      category,
      type: types[0] ?? '',
      parent_id: ''
    }))
  }

  function handleCancel() {
    if (isSaving) return
    onClose()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      category: form.category,
      type: form.type,
      currency: form.currency,
      notes: form.notes.trim() || null,
      parent_id: form.parent_id ? Number(form.parent_id) : null
    }

    try {
      if (mode === 'edit') {
        validateAccountUpdate(payload)
      } else {
        validateAccountCreate(payload)
      }
    } catch (error) {
      toast.error(Array.isArray(error.cause) ? error.cause[0] : error.message)
      return
    }

    setIsSaving(true)

    try {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleCancel()
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-5 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            {mode === 'edit' ? t('modal.edit.title') : t('modal.add.title')}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>{t('modal.fields.name')}</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-9 rounded-md border border-input bg-background px-3"
              disabled={isSaving}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>
              {t('modal.fields.code')}{' '}
              <span className="text-muted-foreground">({t('common:labels.optional')})</span>
            </span>
            <input
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              placeholder={t('modal.placeholders.code')}
              className="h-9 rounded-md border border-input bg-background px-3"
              disabled={isSaving}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>{t('modal.fields.category')}</span>
              <select
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3"
                disabled={isSaving}
              >
                {VALID_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {t(`categories.${cat}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>{t('modal.fields.type')}</span>
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
                disabled={isSaving}
              >
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>{t('modal.fields.currency')}</span>
              <select
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
                disabled={isSaving}
              >
                {VALID_CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>{t('modal.fields.parent')}</span>
              <select
                value={form.parent_id}
                onChange={(e) => setForm((prev) => ({ ...prev, parent_id: e.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3"
                disabled={isSaving}
              >
                <option value="">{t('modal.placeholders.noParent')}</option>
                {parentOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span>
              {t('modal.fields.notes')}{' '}
              <span className="text-muted-foreground">({t('common:labels.optional')})</span>
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder={t('modal.placeholders.notes')}
              rows={2}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSaving}
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

export default AccountModal
