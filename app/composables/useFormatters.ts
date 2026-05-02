import { useState } from '#imports'

export const useFormatters = () => {
  // Global state for currency preference, defaults to USD
  const currencyCode = useState<string>('currencyCode', () => 'USD')

  const currency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.value,
      maximumFractionDigits: 2
    }).format(value)
  }

  const percent = (value: number): string => `${value.toFixed(2)}%`

  return {
    currencyCode,
    currency,
    percent
  }
}
