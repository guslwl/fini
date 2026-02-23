import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import AddPayableModal from '@/components/payables/AddPayableModal'
import EditPayableModal from '@/components/payables/EditPayableModal'
import PayablesFilters from '@/components/payables/PayablesFilters'
import PayablesTable from '@/components/payables/PayablesTable'

function effectiveDate(payable) {
  return payable.preferred_date || payable.due_date || ''
}

function PayablesPage() {
  const [payables, setPayables] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('unpaid')
  const [searchFilter, setSearchFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [sortOption, setSortOption] = useState('date-asc')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPayable, setEditingPayable] = useState(null)

  async function loadPayables() {
    setIsLoading(true)
    setError('')

    try {
      const rows = await window.api.v1.payables.getAll()
      setPayables(Array.isArray(rows) ? rows : [])
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load payables.')
      setPayables([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPayables()
  }, [])
  const filteredPayables = useMemo(() => {
    const normalizedSearch = searchFilter.trim().toLowerCase()
    const visibleRows = payables.filter((payable) => {
      const isPaid = Boolean(payable.paid_at)
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'paid' ? isPaid : !isPaid)
      const matchesSearch =
        !normalizedSearch ||
        String(payable.history || '')
          .toLowerCase()
          .includes(normalizedSearch)

      const effective = effectiveDate(payable)
      const matchesMonth = !monthFilter || effective.startsWith(monthFilter)

      return matchesStatus && matchesSearch && matchesMonth
    })

    return visibleRows.sort((left, right) => {
      if (sortOption === 'date-asc') {
        return effectiveDate(left).localeCompare(effectiveDate(right))
      }

      if (sortOption === 'date-desc') {
        return effectiveDate(right).localeCompare(effectiveDate(left))
      }

      if (sortOption === 'value-asc') {
        return (left.value || 0) - (right.value || 0)
      }

      if (sortOption === 'value-desc') {
        return (right.value || 0) - (left.value || 0)
      }

      if (sortOption === 'history-desc') {
        return String(right.history || '').localeCompare(String(left.history || ''))
      }

      return String(left.history || '').localeCompare(String(right.history || ''))
    })
  }, [monthFilter, payables, searchFilter, sortOption, statusFilter])

  async function handleCreatePayable(payload) {
    await window.api.v1.payables.create(payload)
    await loadPayables()
  }

  async function handleUpdatePayable(id, payload) {
    await window.api.v1.payables.update(id, payload)
    await loadPayables()
  }

  async function handleDeletePayable(payable) {
    const confirmed = window.confirm('Delete this payable?')
    if (!confirmed) {
      return
    }

    await window.api.v1.payables.delete(payable.id)
    await loadPayables()
  }

  async function handleMarkPaid(payable) {
    if (payable.paid_at) {
      return
    }

    await window.api.v1.payables.markAsPaid(payable.id)
    await loadPayables()
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Payables</h2>
          <p className="text-sm text-muted-foreground">
            Manage payables registered in the database.
          </p>
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

      <PayablesFilters
        status={statusFilter}
        search={searchFilter}
        month={monthFilter}
        sort={sortOption}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchFilter}
        onMonthChange={setMonthFilter}
        onSortChange={setSortOption}
      />

      {error ? (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      <PayablesTable
        rows={filteredPayables}
        isLoading={isLoading}
        onEdit={(payable) => setEditingPayable(payable)}
        onDelete={handleDeletePayable}
        onMarkPaid={handleMarkPaid}
      />

      <AddPayableModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={handleCreatePayable}
      />

      <EditPayableModal
        open={Boolean(editingPayable)}
        payable={editingPayable}
        onClose={() => setEditingPayable(null)}
        onSave={handleUpdatePayable}
      />
    </section>
  )
}

export default PayablesPage
