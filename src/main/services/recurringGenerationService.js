import { ValidationError } from 'infra/errors.js'
import RecurringPayables from 'models/payables_recurring.js'
import PayablesModel from 'models/payables.js'
import Holidays from 'models/holidays.js'
import { adjustForBusinessDay } from 'services/businessDayService.js'

export function validateGenerateInput(year, month) {
  if (!Number.isInteger(year)) {
    throw new ValidationError({
      code: 'INVALID_YEAR_VALUE',
      action: 'Provide an integer for year'
    })
  }

  if (!Number.isInteger(month)) {
    throw new ValidationError({
      code: 'INVALID_MONTH_VALUE',
      action: 'Provide an integer for month'
    })
  }

  if (month < 1 || month > 12) {
    throw new ValidationError({
      code: 'INVALID_MONTH_RANGE',
      action: 'Provide a month value between 1 and 12'
    })
  }
}

function toDateString(year, month, day) {
  const yearValue = String(year)
  const monthValue = String(month).padStart(2, '0')
  const dayValue = String(day).padStart(2, '0')
  return `${yearValue}-${monthValue}-${dayValue}`
}

function getNominalDateString(year, month, dueDay) {
  const lastDayOfMonth = new Date(year, month, 0).getDate()
  const actualDueDay = Math.min(dueDay, lastDayOfMonth)

  return toDateString(year, month, actualDueDay)
}

function buildBaseSkipDetail(recurring, reason) {
  return {
    recurring_id: recurring.id,
    history: recurring.history,
    reason
  }
}

export function generateRecurringForMonth({ dbClient, year, month }) {
  validateGenerateInput(year, month)

  const recurringPayables = new RecurringPayables(dbClient)
  const payablesModel = new PayablesModel(dbClient)
  const holidaysModel = new Holidays(dbClient)

  return dbClient.transaction(() => {
    const allRecurring = recurringPayables.getAll()
    const allHolidays = holidaysModel.getByYear(year)

    let generatedCount = 0
    let skippedCount = 0
    const skippedDetails = []

    for (const recurring of allRecurring) {
      const dueDay = recurring.due_day

      if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        skippedCount++
        skippedDetails.push({
          ...buildBaseSkipDetail(recurring, 'invalid_due_day'),
          due_day: dueDay
        })
        continue
      }

      const nominalDateString = getNominalDateString(year, month, dueDay)

      const adjustedDateString = adjustForBusinessDay(
        nominalDateString,
        recurring.should_postpone,
        allHolidays
      )

      const alreadyExists = payablesModel.existsByHistoryAndDueDate(
        recurring.history,
        adjustedDateString
      )

      if (alreadyExists) {
        skippedCount++
        skippedDetails.push({
          ...buildBaseSkipDetail(recurring, 'already_exists'),
          due_date: adjustedDateString
        })
        continue
      }

      payablesModel.create({
        history: recurring.history,
        invoice_id: null,
        account_id: null,
        due_date: adjustedDateString,
        preferred_date: null,
        value: recurring.value,
        parent_id: recurring.id,
        paid_at: null
      })

      generatedCount++
    }

    return {
      generated: generatedCount,
      skipped: skippedCount,
      skippedDetails,
      year,
      month
    }
  })()
}

export default {
  generateRecurringForMonth,
  validateGenerateInput
}
