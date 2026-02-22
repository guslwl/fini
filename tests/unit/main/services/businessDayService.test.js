import { describe, expect, it } from 'vitest'
import businessDayService, { adjustForBusinessDay } from 'services/businessDayService.js'

const { isBusinessDay, isHoliday, isWeekend } = businessDayService

describe('businessDayService', () => {
  it('keeps a regular business day unchanged', () => {
    const result = adjustForBusinessDay('2024-05-15', true, [])
    expect(result).toBe('2024-05-15')
  })

  it('postpones weekend dates to next Monday', () => {
    const result = adjustForBusinessDay('2024-05-18', true, [])
    expect(result).toBe('2024-05-20')
  })

  it('anticipates weekend dates to previous Friday', () => {
    const result = adjustForBusinessDay('2024-05-18', false, [])
    expect(result).toBe('2024-05-17')
  })

  it('postpones weekday holidays to next business day', () => {
    const holidays = [{ date: '2024-01-01' }]
    const result = adjustForBusinessDay('2024-01-01', true, holidays)
    expect(result).toBe('2024-01-02')
  })

  it('anticipates weekday holidays to previous business day', () => {
    const holidays = [{ date: '2024-01-01' }]
    const result = adjustForBusinessDay('2024-01-01', false, holidays)
    expect(result).toBe('2023-12-29')
  })

  it('skips multiple consecutive non-business days when postponing', () => {
    const holidays = [{ date: '2024-01-01' }, { date: '2024-01-02' }]

    const result = adjustForBusinessDay('2023-12-30', true, holidays)
    expect(result).toBe('2024-01-03')
  })

  it('treats holiday with is_business_day flag as business day', () => {
    const holidays = [{ date: '2024-01-01', is_business_day: true }]
    const result = adjustForBusinessDay('2024-01-01', true, holidays)
    expect(result).toBe('2024-01-01')
  })

  it('treats holiday with should_count_as_business_day flag as business day', () => {
    const holidays = [{ date: '2024-01-01', should_count_as_business_day: 1 }]
    const result = adjustForBusinessDay('2024-01-01', true, holidays)
    expect(result).toBe('2024-01-01')
  })

  it('identifies weekend days correctly', () => {
    expect(isWeekend(new Date('2024-05-18T00:00:00'))).toBe(true)
    expect(isWeekend(new Date('2024-05-20T00:00:00'))).toBe(false)
  })

  it('identifies holidays based on date and flags', () => {
    const holidayDate = new Date('2024-01-01T00:00:00')

    expect(isHoliday(holidayDate, [{ date: '2024-01-01' }])).toBe(true)
    expect(isHoliday(holidayDate, [{ date: '2024-01-01', is_business_day: 1 }])).toBe(false)
  })

  it('combines weekend and holiday checks in business-day evaluation', () => {
    const holiday = [{ date: '2024-05-20' }]

    expect(isBusinessDay(new Date('2024-05-18T00:00:00'), [])).toBe(false)
    expect(isBusinessDay(new Date('2024-05-20T00:00:00'), holiday)).toBe(false)
    expect(isBusinessDay(new Date('2024-05-21T00:00:00'), holiday)).toBe(true)
  })
})
