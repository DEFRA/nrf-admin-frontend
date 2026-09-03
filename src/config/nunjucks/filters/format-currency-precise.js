export function formatCurrencyPrecise(
  value,
  locale = 'en-GB',
  currency = 'GBP'
) {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })

  return formatter.format(value)
}
