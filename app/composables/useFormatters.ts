const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

export const useFormatters = () => {
  const currency = (value: number): string => currencyFormatter.format(value)
  const percent = (value: number): string => `${value.toFixed(2)}%`

  return {
    currency,
    percent
  }
}
