import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import DateDetailsModal from '@/components/calendar/DateDetailsModal'
import { formatCentsLocale } from '@/lib/utils'

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

function toDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getCurrentDateKey() {
  const now = new Date()
  return toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

function effectiveDate(payable) {
  return payable.preferred_date || payable.due_date || ''
}

function createEmptyPayableGroup() {
  return {
    unpaidItems: [],
    paidItems: [],
    unpaidSumCents: 0,
    paidSumCents: 0,
    totalSumCents: 0
  }
}

function CalendarPage() {
  const { t, i18n } = useTranslation('payables')

  const weekDays = useMemo(() => {
    // 2021-01-03 is a known Sunday; iterate 7 days to get Sun–Sat
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(2021, 0, 3 + i)
      return new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(date)
    })
  }, [i18n.language])
  const [monthValue, setMonthValue] = useState(() => getCurrentMonthValue())
  const [payables, setPayables] = useState([])
  const [holidays, setHolidays] = useState([])
  const [scheduledItems, setScheduledItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [markingPayableId, setMarkingPayableId] = useState(null)

  const monthParts = useMemo(() => {
    return parseMonthValue(monthValue) || parseMonthValue(getCurrentMonthValue())
  }, [monthValue])

  const { year, month } = monthParts

  async function loadCalendarData(targetMonthValue) {
    const target = parseMonthValue(targetMonthValue)

    if (!target) {
      toast.error(t('calendar.invalidMonth'))
      return false
    }

    setIsLoading(true)

    try {
      const [payableRows, holidayRows, scheduledRows] = await Promise.all([
        window.api.v1.payables.getByMonth(target.year, target.month),
        window.api.v1.holidays.getByYear(target.year),
        window.api.v1.scheduledTransactions.getAll()
      ])

      setPayables(Array.isArray(payableRows) ? payableRows : [])
      setHolidays(Array.isArray(holidayRows) ? holidayRows : [])
      setScheduledItems(Array.isArray(scheduledRows) ? scheduledRows : [])
      return true
    } catch {
      toast.error(t('calendar.loadFailed'))
      setPayables([])
      setHolidays([])
      setScheduledItems([])
      return false
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCalendarData(monthValue).catch(() => {})
  }, [monthValue])

  const holidaysByDate = useMemo(() => {
    const map = new Map()

    for (const holiday of holidays) {
      if (!holiday?.date) {
        continue
      }

      const existing = map.get(holiday.date) || []
      existing.push(holiday.description || t('calendar.holiday'))
      map.set(holiday.date, existing)
    }

    return map
  }, [holidays])

  const payablesByDate = useMemo(() => {
    const map = new Map()

    for (const payable of payables) {
      const date = effectiveDate(payable)
      if (!date) {
        continue
      }

      const valueCents = typeof payable.value === 'number' ? payable.value : 0
      const existing = map.get(date) || createEmptyPayableGroup()

      if (payable.paid_at) {
        existing.paidItems.push(payable)
        existing.paidSumCents += valueCents
      } else {
        existing.unpaidItems.push(payable)
        existing.unpaidSumCents += valueCents
      }

      existing.totalSumCents += valueCents
      map.set(date, existing)
    }

    return map
  }, [payables])

  const scheduledByDate = useMemo(() => {
    const map = new Map()
    const prefix = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`

    for (const tx of scheduledItems) {
      if (tx.status !== 'active') continue
      if (!tx.next_date?.startsWith(prefix)) continue

      const existing = map.get(tx.next_date) || []
      existing.push(tx)
      map.set(tx.next_date, existing)
    }

    return map
  }, [scheduledItems, year, month])

  const selectedDateDetails = useMemo(() => {
    if (!selectedDate) {
      return {
        holidayNames: [],
        unpaidItems: [],
        paidItems: [],
        unpaidSumCents: 0,
        paidSumCents: 0,
        totalSumCents: 0
      }
    }

    const payableGroup = payablesByDate.get(selectedDate) || createEmptyPayableGroup()
    const holidayNames = holidaysByDate.get(selectedDate) || []

    return {
      ...payableGroup,
      holidayNames,
      scheduledItems: scheduledByDate.get(selectedDate) || []
    }
  }, [holidaysByDate, payablesByDate, scheduledByDate, selectedDate])

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month - 1, 1)
    const startOffset = firstDayOfMonth.getDay()
    const totalDays = new Date(year, month, 0).getDate()
    const currentDateKey = getCurrentDateKey()

    const cells = []

    for (let index = 0; index < startOffset; index += 1) {
      cells.push({ type: 'empty', key: `empty-${index}` })
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const dateKey = toDateKey(year, month, day)
      const payableGroup = payablesByDate.get(dateKey) || createEmptyPayableGroup()
      const holidayNames = holidaysByDate.get(dateKey) || []
      const txItems = scheduledByDate.get(dateKey) || []
      const scheduledSumCents = txItems.reduce((sum, tx) => sum + (tx.amount ?? 0), 0)

      cells.push({
        type: 'day',
        key: dateKey,
        day,
        dateKey,
        unpaidSumCents: payableGroup.unpaidSumCents,
        holidayName: holidayNames[0] || null,
        isToday: dateKey === currentDateKey,
        scheduledItems: txItems,
        scheduledSumCents
      })
    }

    return cells
  }, [holidaysByDate, month, payablesByDate, year])

  async function handleMarkPaid(payable) {
    if (!payable || payable.paid_at) {
      return
    }

    setMarkingPayableId(payable.id)

    try {
      await window.api.v1.payables.markAsPaid(payable.id)
      await loadCalendarData(monthValue)
      toast.success(t('calendar.markedPaid'))
    } catch {
      toast.error(t('calendar.markPaidFailed'))
    } finally {
      setMarkingPayableId(null)
    }
  }

  function handleMonthChange(event) {
    const nextValue = event.target.value

    if (!nextValue) {
      return
    }

    setMonthValue(nextValue)
    setSelectedDate(null)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{t('calendar.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('calendar.description')}</p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t('labels.month', { ns: 'common' })}</span>
          <input
            type="month"
            value={monthValue}
            onChange={handleMonthChange}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
          {t('calendar.loading')}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {weekDays.map((weekDay) => (
              <div
                key={weekDay}
                className="rounded-md bg-muted/40 px-2 py-1 text-center text-xs font-medium text-muted-foreground"
              >
                {weekDay}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => {
              if (cell.type === 'empty') {
                return (
                  <div
                    key={cell.key}
                    className="min-h-28 rounded-md border border-dashed border-border"
                  />
                )
              }

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateKey)}
                  className={`min-h-28 rounded-md border border-border p-2 text-left transition-colors ${
                    cell.isToday ? 'bg-muted/95 hover:bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="text-sm font-medium">{cell.day}</div>
                  {cell.holidayName ? (
                    <div className="mt-1 text-xs italic text-muted-foreground">
                      {cell.holidayName}
                    </div>
                  ) : null}
                  <div className="mt-2 text-center text-sm font-medium text-foreground">
                    {formatCentsLocale(cell.scheduledSumCents + cell.unpaidSumCents, i18n.language)}
                  </div>
                  {cell.scheduledItems.length > 0 && (
                    <>
                      <div className="mt-1 text-center text-xs text-muted-foreground">
                        {t('calendar.unpaid')}{' '}
                        {formatCentsLocale(cell.unpaidSumCents, i18n.language)}
                      </div>
                      <div className="mt-1 text-center text-xs text-muted-foreground">
                        {t('calendar.scheduled')}{' '}
                        {formatCentsLocale(cell.scheduledSumCents, i18n.language)}
                      </div>
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <DateDetailsModal
        open={Boolean(selectedDate)}
        date={selectedDate}
        holidayNames={selectedDateDetails.holidayNames}
        unpaidItems={selectedDateDetails.unpaidItems}
        paidItems={selectedDateDetails.paidItems}
        unpaidSumCents={selectedDateDetails.unpaidSumCents}
        paidSumCents={selectedDateDetails.paidSumCents}
        totalSumCents={selectedDateDetails.totalSumCents}
        scheduledItems={selectedDateDetails.scheduledItems}
        onClose={() => setSelectedDate(null)}
        onMarkPaid={handleMarkPaid}
        markingPayableId={markingPayableId}
      />
    </section>
  )
}

export default CalendarPage
