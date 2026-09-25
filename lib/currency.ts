export const CURRENCIES = [
  { code: 'ZAR', label: 'Rand', symbol: 'R', locale: 'en-ZA' },
  { code: 'USD', label: 'Dollar', symbol: '$', locale: 'en-US' },
  { code: 'GBP', label: 'Pound', symbol: '£', locale: 'en-GB' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']

export type Rates = Record<CurrencyCode, number>

export type RatesResponse = {
  base: 'ZAR'
  rates: Rates
  updatedAt: string | null
  live: boolean
}

export const FALLBACK_RATES: Rates = { ZAR: 1, USD: 0.055, GBP: 0.042 }

export const PAYSTACK_SETTLEMENT_CURRENCIES: CurrencyCode[] = ['ZAR', 'USD']

export function convertFromZar(amountZar: number, currency: CurrencyCode, rates: Rates) {
  return amountZar * (rates[currency] ?? 1)
}

export function formatMoney(amount: number, currency: CurrencyCode) {
  const meta = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0]
  const whole = currency === 'ZAR' || Number.isInteger(amount)
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })
    .format(currency === 'ZAR' ? Math.round(amount) : amount)
    .replace('ZAR', 'R')
}
