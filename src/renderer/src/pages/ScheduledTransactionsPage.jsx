import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import AddScheduledTransactionModal from '@/components/recurring/AddScheduledTransactionModal'
import EditScheduledTransactionModal from '@/components/recurring/EditScheduledTransactionModal'
import GenerationModal from '@/components/recurring/GenerationModal'
import ScheduledTransactionsTable from '@/components/recurring/ScheduledTransactionsTable'

function ScheduledTransactionsPage() {
  const { t } = useTranslation('recurring')
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [previewItems, setPreviewItems] = useState(null)

  async function loadTransactions() {
    setIsLoading(true)

    try {
      const data = await window.api.v1.scheduledTransactions.getAll()
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

  async function runGenerate() {
    try {
      const items = await window.api.v1.scheduledTransactions.generate()
      const pending = Array.isArray(items) ? items.filter((i) => !i.skipped) : []
      if (pending.length > 0 || (Array.isArray(items) && items.length > 0)) {
        setPreviewItems(Array.isArray(items) ? items : [])
      }
    } catch {
      toast.error(t('errors.generateFailed'))
    }
  }

  useEffect(() => {
    loadTransactions().then((ok) => {
      if (ok) runGenerate()
    })
  }, [])

  async function handleCreate(payload) {
    let hasCreated = false

    try {
      await window.api.v1.scheduledTransactions.create(payload)
      hasCreated = true
      await loadTransactions()
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
      await window.api.v1.scheduledTransactions.update(id, payload)
      hasUpdated = true
      await loadTransactions()
      toast.success(t('toasts.updated'))
      return true
    } catch {
      if (!hasUpdated) {
        toast.error(t('errors.updateFailed'))
      }
      return false
    }
  }

  async function handleDelete(tx) {
    const confirmed = window.confirm(t('deleteConfirm'))
    if (!confirmed) return

    let hasDeleted = false

    try {
      await window.api.v1.scheduledTransactions.delete(tx.id)
      hasDeleted = true
      await loadTransactions()
      toast.success(t('toasts.deleted'))
    } catch {
      if (!hasDeleted) {
        toast.error(t('errors.deleteFailed'))
      }
    }
  }

  async function handleConfirmGeneration(confirmedItems) {
    try {
      const result = await window.api.v1.scheduledTransactions.confirmGeneration(confirmedItems)
      const created = Number(result?.created) || 0
      const skipped = Number(result?.skipped) || 0
      toast.success(t('generation.result', { created, skipped }))
      setPreviewItems(null)
      await loadTransactions()
    } catch {
      toast.error(t('generation.failed'))
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{t('page.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('page.description')}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={runGenerate}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium"
          >
            {t('page.checkPending')}
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            {t('buttons.add', { ns: 'common' })}
          </button>
        </div>
      </div>

      <ScheduledTransactionsTable
        rows={rows}
        isLoading={isLoading}
        onEdit={(tx) => setEditingTransaction(tx)}
        onDelete={handleDelete}
      />

      <AddScheduledTransactionModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={handleCreate}
      />

      <EditScheduledTransactionModal
        open={Boolean(editingTransaction)}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleUpdate}
      />

      <GenerationModal
        open={previewItems !== null}
        previewItems={previewItems ?? []}
        onClose={() => setPreviewItems(null)}
        onConfirm={handleConfirmGeneration}
      />
    </section>
  )
}

export default ScheduledTransactionsPage
