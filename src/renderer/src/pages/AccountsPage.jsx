import { Plus, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import AccountModal from '@/components/accounts/AccountModal'
import AccountsTable from '@/components/accounts/AccountsTable'
import { VALID_CATEGORIES } from 'shared/validators/accounts.js'

function AccountsPage() {
  const { t } = useTranslation('accounts')
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [deletingAccountId, setDeletingAccountId] = useState(null)
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    category: true,
    type: true,
    currency: true
  })
  const [columnsOpen, setColumnsOpen] = useState(false)
  const columnsRef = useRef(null)

  useEffect(() => {
    if (!columnsOpen) return
    function handleOutside(e) {
      if (columnsRef.current && !columnsRef.current.contains(e.target)) setColumnsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [columnsOpen])

  async function loadAccounts() {
    setIsLoading(true)

    try {
      const rows = await window.api.v1.accounts.getAll()
      setAccounts(Array.isArray(rows) ? rows : [])
    } catch {
      toast.error(t('errors.loadFailed'))
      setAccounts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (!showArchived && account.archived_at != null) return false
      if (categoryFilter && account.category !== categoryFilter) return false
      return true
    })
  }, [accounts, categoryFilter, showArchived])

  async function handleCreate(payload) {
    let hasCreated = false

    try {
      await window.api.v1.accounts.create(payload)
      hasCreated = true
      await loadAccounts()
      toast.success(t('toasts.created'))
      return true
    } catch {
      if (!hasCreated) toast.error(t('errors.createFailed'))
      return false
    }
  }

  function handleEdit(account) {
    setEditingAccount(account)
    setIsModalOpen(true)
  }

  async function handleUpdate(payload) {
    let hasUpdated = false

    try {
      await window.api.v1.accounts.update(editingAccount.id, payload)
      hasUpdated = true
      await loadAccounts()
      setEditingAccount(null)
      toast.success(t('toasts.updated'))
      return true
    } catch {
      if (!hasUpdated) toast.error(t('errors.updateFailed'))
      return false
    }
  }

  async function handleArchive(account) {
    try {
      await window.api.v1.accounts.archive(account.id)
      await loadAccounts()
      toast.success(t('toasts.archived'))
    } catch {
      toast.error(t('errors.archiveFailed'))
    }
  }

  async function handleUnarchive(account) {
    try {
      await window.api.v1.accounts.unarchive(account.id)
      await loadAccounts()
      toast.success(t('toasts.unarchived'))
    } catch {
      toast.error(t('errors.unarchiveFailed'))
    }
  }

  function handleDeleteRequest(account) {
    setDeletingAccountId(account.id)
  }

  async function handleConfirmDelete() {
    let hasDeleted = false

    try {
      await window.api.v1.accounts.delete(deletingAccountId)
      hasDeleted = true
      setDeletingAccountId(null)
      await loadAccounts()
      toast.success(t('toasts.deleted'))
    } catch {
      if (!hasDeleted) toast.error(t('errors.deleteFailed'))
    }
  }

  const deletingAccount = accounts.find((a) => a.id === deletingAccountId)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{t('page.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('page.description')}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          {t('common:buttons.add')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">{t('filters.allCategories')}</option>
          {VALID_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {t(`categories.${cat}`)}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 rounded border border-input"
          />
          {t('filters.showArchived')}
        </label>

        <div ref={columnsRef} className="relative">
          <button
            type="button"
            onClick={() => setColumnsOpen((o) => !o)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('table.columnsButton')}
          </button>
          {columnsOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-md border border-border bg-background p-2 shadow-md">
              {['code', 'category', 'type', 'currency'].map((col) => (
                <label key={col} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={visibleColumns[col]}
                    onChange={() =>
                      setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }))
                    }
                    className="h-4 w-4 rounded border border-input"
                  />
                  {t(`table.headers.${col}`)}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <AccountsTable
        accounts={filteredAccounts}
        visibleColumns={visibleColumns}
        isLoading={isLoading}
        onEdit={handleEdit}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        onDelete={handleDeleteRequest}
      />

      <AccountModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAccount(null)
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        mode={editingAccount ? 'edit' : 'create'}
        initialData={editingAccount}
        allAccounts={accounts}
      />

      {deletingAccountId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeletingAccountId(null)
          }}
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">{t('deleteDialog.title')}</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {t('deleteDialog.message', { name: deletingAccount?.name ?? '' })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingAccountId(null)}
                className="h-9 rounded-md border border-border px-3 text-sm"
              >
                {t('common:buttons.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-9 rounded-md bg-destructive px-3 text-sm text-destructive-foreground"
              >
                {t('common:buttons.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AccountsPage
