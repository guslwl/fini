import { ValidationError } from 'shared/errors.js'
import ScheduledTransactions from 'models/scheduled_transactions.js'
import PayablesModel from 'models/payables.js'
import Holidays from 'models/holidays.js'
import { adjustForBusinessDay } from 'services/businessDayService.js'

// Day abbreviation → JS weekday number (0=Sun, 1=Mon, ..., 6=Sat)
const DAY_ABBREV_TO_WEEKDAY = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
}

const FIXED_FREQUENCIES = new Set([
  'once',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual'
])

function parseDayOfWeekPattern(frequency) {
  const parts = frequency.split('-')
  return parts.map((p) => DAY_ABBREV_TO_WEEKDAY[p]).filter((n) => n !== undefined)
}

function isDayOfWeekPattern(frequency) {
  return !FIXED_FREQUENCIES.has(frequency)
}

function addDays(dateString, n) {
  const [year, month, day] = dateString.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function addMonths(dateString, n) {
  const [year, month, day] = dateString.split('-').map(Number)
  const targetMonth = month - 1 + n
  const targetYear = year + Math.floor(targetMonth / 12)
  const normalizedMonth = ((targetMonth % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
  const actualDay = Math.min(day, lastDay)
  return `${String(targetYear).padStart(4, '0')}-${String(normalizedMonth + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`
}

function computeNextDate(currentDateString, frequency) {
  if (isDayOfWeekPattern(frequency)) {
    const targetWeekdays = parseDayOfWeekPattern(frequency)
    if (targetWeekdays.length === 0) return currentDateString

    const [year, month, day] = currentDateString.split('-').map(Number)
    let d = new Date(Date.UTC(year, month - 1, day))
    // Find the next day (strictly after current) that matches one of the target weekdays
    for (let i = 1; i <= 7; i++) {
      d.setUTCDate(d.getUTCDate() + 1)
      if (targetWeekdays.includes(d.getUTCDay())) {
        return d.toISOString().slice(0, 10)
      }
    }
    return currentDateString
  }

  switch (frequency) {
    case 'once':
      return null // signals completion
    case 'daily':
      return addDays(currentDateString, 1)
    case 'weekly':
      return addDays(currentDateString, 7)
    case 'biweekly':
      return addDays(currentDateString, 14)
    case 'monthly':
      return addMonths(currentDateString, 1)
    case 'quarterly':
      return addMonths(currentDateString, 3)
    case 'semiannual':
      return addMonths(currentDateString, 6)
    case 'annual':
      return addMonths(currentDateString, 12)
    default:
      return addMonths(currentDateString, 1)
  }
}

function getAsOfDatePlusOne(asOfDate) {
  return addDays(asOfDate, 1)
}

export function generate({ dbClient, asOfDate }) {
  const effectiveAsOf = asOfDate ?? new Date().toISOString().slice(0, 10)
  const cutoffDate = getAsOfDatePlusOne(effectiveAsOf)

  const scheduledModel = new ScheduledTransactions(dbClient)
  const payablesModel = new PayablesModel(dbClient)
  const holidaysModel = new Holidays(dbClient)

  const activeTransactions = scheduledModel.getActive()
  const year = Number(effectiveAsOf.slice(0, 4))
  const allHolidays = holidaysModel.getByYear(year)

  const previewItems = []

  for (const tx of activeTransactions) {
    if (tx.next_date > cutoffDate) continue

    const adjustedDate = adjustForBusinessDay(tx.next_date, tx.should_postpone, allHolidays)

    const alreadyExists = payablesModel.existsByParentIdAndDueDate(tx.id, adjustedDate)
    if (alreadyExists) {
      previewItems.push({
        scheduled_transaction_id: tx.id,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        due_date: adjustedDate,
        certainty: tx.certainty,
        user_triggered: tx.user_triggered,
        needs_input: false,
        skipped: true,
        skip_reason: 'already_exists'
      })
      continue
    }

    const needsInput = tx.certainty === 'unknown' || tx.amount === null

    previewItems.push({
      scheduled_transaction_id: tx.id,
      description: tx.description,
      amount: tx.amount,
      currency: tx.currency,
      type: tx.type,
      due_date: adjustedDate,
      certainty: tx.certainty,
      user_triggered: tx.user_triggered,
      needs_input: needsInput,
      skipped: false,
      skip_reason: null
    })
  }

  return previewItems
}

export function confirmGeneration({ dbClient, previewItems }) {
  const payablesModel = new PayablesModel(dbClient)
  const scheduledModel = new ScheduledTransactions(dbClient)

  return dbClient.transaction(() => {
    let created = 0
    let skipped = 0

    for (const item of previewItems) {
      if (item.skipped) {
        skipped++
        continue
      }

      payablesModel.create({
        history: item.description,
        invoice_id: null,
        account_id: null,
        currency: item.currency,
        due_date: item.due_date,
        preferred_date: null,
        value: item.amount,
        parent_id: item.scheduled_transaction_id,
        paid_at: null
      })

      advanceNextDate({ dbClient, scheduledModel, scheduledTransactionId: item.scheduled_transaction_id })

      created++
    }

    return { created, skipped }
  })()
}

export function advanceNextDate({ dbClient, scheduledModel, scheduledTransactionId }) {
  const model = scheduledModel ?? new ScheduledTransactions(dbClient)
  const tx = model.getById(scheduledTransactionId)

  const newOccurrencesCount = (tx.occurrences_count ?? 0) + 1

  if (tx.frequency === 'once') {
    dbClient
      .prepare(
        `UPDATE scheduled_transactions
         SET status = 'completed', occurrences_count = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .run(newOccurrencesCount, scheduledTransactionId)
    return
  }

  const newNextDate = computeNextDate(tx.next_date, tx.frequency)

  let newStatus = tx.status

  if (tx.end_type === 'after_n' && tx.end_after_n !== null && newOccurrencesCount >= tx.end_after_n) {
    newStatus = 'completed'
  } else if (tx.end_type === 'until_date' && tx.end_date !== null && newNextDate > tx.end_date) {
    newStatus = 'completed'
  }

  dbClient
    .prepare(
      `UPDATE scheduled_transactions
       SET next_date = ?, occurrences_count = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .run(newNextDate, newOccurrencesCount, newStatus, scheduledTransactionId)
}

export function getUpcoming({ dbClient, days }) {
  if (!Number.isInteger(days) || days < 0) {
    throw new ValidationError({
      code: 'INVALID_DAYS_VALUE',
      action: 'Provide a non-negative integer for days'
    })
  }

  const model = new ScheduledTransactions(dbClient)
  return model.getUpcoming(days)
}

export default {
  generate,
  confirmGeneration,
  advanceNextDate,
  getUpcoming
}
