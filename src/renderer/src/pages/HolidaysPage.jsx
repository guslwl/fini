import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast, Toaster } from 'sonner'

import AddHolidayModal from '@/components/holidays/AddHolidayModal'
import DeleteConfirmDialog from '@/components/holidays/DeleteConfirmDialog'
import HolidaysFilters from '@/components/holidays/HolidaysFilters'
import HolidaysTable from '@/components/holidays/HolidaysTable'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 11 }, (_, index) => currentYear - 5 + index)

function HolidaysPage() {
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [descriptionFilter, setDescriptionFilter] = useState('')
  const [hidePast, setHidePast] = useState(false)
  const [sortOption, setSortOption] = useState('date-asc')
  const [holidays, setHolidays] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState(null)
  const [deletingHolidayId, setDeletingHolidayId] = useState(null)

  async function loadHolidays(year) {
    setIsLoading(true)
    setError('')

    try {
      const rows = await window.api.v1.holidays.getByYear(year)
      setHolidays(Array.isArray(rows) ? rows : [])
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load holidays.')
      setHolidays([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHolidays(selectedYear)
  }, [selectedYear])

  const filteredHolidays = useMemo(() => {
    const normalizedDescription = descriptionFilter.trim().toLowerCase()
    const today = new Date().toISOString().slice(0, 10)

    const visibleRows = holidays.filter((holiday) => {
      const matchesDescription =
        !normalizedDescription ||
        String(holiday.description || '')
          .toLowerCase()
          .includes(normalizedDescription)

      const isPastHoliday = holiday.date ? holiday.date < today : false
      const matchesPastToggle = hidePast ? !isPastHoliday : true

      return matchesDescription && matchesPastToggle
    })

    return visibleRows.sort((left, right) => {
      if (sortOption === 'date-asc') {
        return String(left.date || '').localeCompare(String(right.date || ''))
      }

      if (sortOption === 'date-desc') {
        return String(right.date || '').localeCompare(String(left.date || ''))
      }

      if (sortOption === 'description-desc') {
        return String(right.description || '').localeCompare(String(left.description || ''))
      }

      return String(left.description || '').localeCompare(String(right.description || ''))
    })
  }, [descriptionFilter, hidePast, holidays, sortOption])

  async function handleCreateHoliday(payload) {
    await window.api.v1.holidays.create(payload)
    await loadHolidays(selectedYear)
    toast.success('Holiday created successfully')
  }

  async function handleEditHoliday(holiday) {
    setEditingHoliday(holiday)
    setIsAddModalOpen(true)
  }

  async function handleUpdateHoliday(payload) {
    await window.api.v1.holidays.update(editingHoliday.id, payload)
    await loadHolidays(selectedYear)
    setEditingHoliday(null)
    toast.success('Holiday updated successfully')
  }

  async function handleDeleteHoliday(holiday) {
    setDeletingHolidayId(holiday.id)
  }

  async function handleConfirmDelete() {
    try {
      await window.api.v1.holidays.delete(deletingHolidayId)
      await loadHolidays(selectedYear)
      setDeletingHolidayId(null)
      toast.success('Holiday deleted successfully')
    } catch (deleteError) {
      toast.error(deleteError?.message || 'Failed to delete holiday')
    }
  }

  function handleCancelDelete() {
    setDeletingHolidayId(null)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Holidays</h2>
          <p className="text-sm text-muted-foreground">
            Manage holidays registered in the database.
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

      <HolidaysFilters
        year={selectedYear}
        yearOptions={yearOptions}
        description={descriptionFilter}
        hidePast={hidePast}
        sort={sortOption}
        onYearChange={setSelectedYear}
        onDescriptionChange={setDescriptionFilter}
        onHidePastChange={setHidePast}
        onSortChange={setSortOption}
      />

      {error ? (
        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      <HolidaysTable
        rows={filteredHolidays}
        isLoading={isLoading}
        onEdit={handleEditHoliday}
        onDelete={handleDeleteHoliday}
      />

      <AddHolidayModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingHoliday(null)
        }}
        onCreate={handleCreateHoliday}
        onUpdate={handleUpdateHoliday}
        mode={editingHoliday ? 'edit' : 'create'}
        initialData={editingHoliday}
      />

      <DeleteConfirmDialog
        open={deletingHolidayId !== null}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        holidayDescription={holidays.find((h) => h.id === deletingHolidayId)?.description || ''}
      />

      <Toaster />
    </section>
  )
}

export default HolidaysPage
