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
