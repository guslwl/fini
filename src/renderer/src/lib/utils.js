import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function centsToDecimalString(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return ''
  }

  return (value / 100).toFixed(2)
}

const LOCALE_CURRENCY = {
  'en-US': 'USD',
  'pt-BR': 'BRL'
}

export function formatCentsLocale(cents, locale) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '-'
  const currency = LOCALE_CURRENCY[locale] ?? 'USD'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100)
}

export function formatDateLocale(dateString, locale) {
  if (!dateString) return '-'
  // Treat YYYY-MM-DD as local time (not UTC midnight) to avoid day-shift issues
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateString) ? `${dateString}T00:00:00` : dateString
  const date = new Date(normalized)
  if (isNaN(date.getTime())) return dateString
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

export function decimalToCents(value) {
  const normalized = String(value).trim().replace(',', '.')

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }

  const parsed = Number(normalized)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return Math.round(parsed * 100)
}
